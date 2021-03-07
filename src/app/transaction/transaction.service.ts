import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {path} from 'ramda';
import * as shortid from 'shortid';
import {In, Not, Repository} from 'typeorm';

import {GeneralEntity} from '../../entities/general.entity';
import {OrderEntity} from '../../entities/order.entity';
import {TRANSACTION_STATUSES, TransactionEntity} from '../../entities/transaction.entity';
import {WALLET_STATUSES, WalletEntity} from '../../entities/wallet.entity';
import {TransactionRepository} from '../../repositories/transaction.repository';
import {GetTransactionListRequest} from '../client/dto/get/request.dto';
import {GetTransactionListResponse} from '../client/dto/get/transactions.dto';
import {PAYMENT_METHOD_TYPE, PaymentService} from '../payment/payment.service';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(TransactionRepository)
        private readonly transactionRepository: TransactionRepository,
        @InjectRepository(WalletEntity)
        private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(GeneralEntity)
        private readonly generalRepository: Repository<GeneralEntity>,
        private readonly paymentService: PaymentService,
    ) {
    }

    public async chargeOrder(order: OrderEntity): Promise<void> {
        const general = await this.generalRepository.findOne();
        const {priceWithDiscount} = order;
        const {serviceAbsoluteFee} = general;
        await this.charge(order, priceWithDiscount - serviceAbsoluteFee);
    }

    public async charge(order: OrderEntity, fixAmount: number): Promise<void> {
        const clientId = order.createdById;
        const wallet = await this.walletRepository.findOne({clientId});

        if (!(wallet && wallet.status === WALLET_STATUSES.VERIFIED)) {
            throw new BadRequestException(
                `There aren't any payment method sets for client ${clientId}, or the selected method is not active`,
            );
        }
        const general = await this.generalRepository.findOne();
        const {creditCardPaymentFee, achPaymentFee} = general;
        const totalAmmount =
            (wallet.type === PAYMENT_METHOD_TYPE.CREDIT_CARD
                ? (fixAmount * creditCardPaymentFee) / 100
                : achPaymentFee) + fixAmount;
        const amount = totalAmmount.toFixed(2);

        const secret = `${order.uuid}_${order.status}`;
        const where = {
            secret,
            status: Not(In([
                TRANSACTION_STATUSES.FAILED,
                TRANSACTION_STATUSES.AUTHORIZED_EXPIRED,
                TRANSACTION_STATUSES.PROCESSOR_DECLINED,
                TRANSACTION_STATUSES.GATEWAY_REJECTED,
                TRANSACTION_STATUSES.SETTLEMENT_DECLINED,
            ])),
        };
        let transaction = await this.transactionRepository.findOne(where);
        if (!transaction) {
            transaction = await this.transactionRepository.save({
                amount,
                clientId,
                secret,
                orderId: order.id,
                companyId: order.companyId,
                status: TRANSACTION_STATUSES.NEW,
                paymentMethod: wallet.type,
                uuid: shortid.generate(),
            });
        }

        if (!transaction.externalId) {
            transaction = await this.braintreeCharge(amount, transaction, wallet);
        }
        await this.submitForSettlement(transaction, wallet);
    }

    private async braintreeCharge(amount, transaction: TransactionEntity, wallet): Promise<TransactionEntity> {
        try {
            const braintreeTransaction = await this.paymentService.sale({
                amount,
                paymentMethodToken: wallet.token,
                orderId: transaction.secret,
            });
            transaction = await this.transactionRepository.save({
                ...transaction,
                status: TRANSACTION_STATUSES.PENDING,
                provider: braintreeTransaction.provider,
                externalId: braintreeTransaction.externalId,
                amount: braintreeTransaction.amount,
                uuid: shortid.generate(),
            });
        } catch (e) {
            if (e && e.transaction && e.transaction.id) {
                const transactionDecline = path(['transaction'], e) as any;
                const {status, id, amount, merchantAccountId} = transactionDecline;
                await this.transactionRepository.save({
                    ...transaction,
                    amount,
                    status: TRANSACTION_STATUSES.FAILED,
                    provider: merchantAccountId,
                    externalId: id,
                    updatedAt: new Date(),
                });
                throw new BadRequestException(`Transaction failed status ${status}`);
            }
            throw new BadRequestException(
                `Transaction ${e && e.message ? e.message : e}`,
            );
        }

        return transaction;
    }

    private async submitForSettlement(transaction: TransactionEntity, wallet: WalletEntity): Promise<any> {
        try {
            await this.paymentService.submitForSettlement(transaction.externalId);
            await this.transactionRepository.save({
                ...transaction,
                status: TRANSACTION_STATUSES.PAID,
                updatedAt: new Date(),
            });
        } catch (e) {
            switch (true) {
                case e.type === 'notFoundError':
                    transaction = await this.braintreeCharge(transaction.amount, transaction, wallet);
                    await this.submitForSettlement(transaction, wallet);
                    break;
                case e && e.transaction && (['settled', 'submitted_for_settlement'].includes(e.transaction.status) ||
                    e.transaction.gatewayRejectionReason === 'duplicate'):
                    await this.transactionRepository.save({
                        ...transaction,
                        status: TRANSACTION_STATUSES.PAID,
                        updatedAt: new Date(),
                    });
                    break;
                case !!(e && e.transaction && e.transaction.id):
                    await this.transactionRepository.save({
                        ...transaction,
                        status: TRANSACTION_STATUSES.FAILED,
                        updatedAt: new Date(),
                    });
                    throw new BadRequestException(`Transaction failed status ${e.transaction.status}`);
                default:
                    throw new BadRequestException(
                        `Transaction ${e && e.message ? e.message : e}`,
                    );
            }
        }
    }

    public async getList(query: GetTransactionListRequest): Promise<GetTransactionListResponse> {
        return await this.transactionRepository.get(query);
    }
}
