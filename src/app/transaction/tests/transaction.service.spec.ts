import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GeneralEntity } from '../../../entities/general.entity';
import { OrderEntity } from '../../../entities/order.entity';
import { TRANSACTION_STATUSES, TransactionEntity } from '../../../entities/transaction.entity';
import { WALLET_STATUSES, WalletEntity } from '../../../entities/wallet.entity';
import { TransactionRepository } from '../../../repositories/transaction.repository';
import { repositoryMockFactory } from '../../../testutils/repository';
import { PaymentServiceMock } from '../../../testutils/servicesMock';
import { PAYMENT_METHOD_TYPE, PaymentService } from '../../payment/payment.service';
import { TransactionService } from '../transaction.service';

describe('TransactionService', () => {
    let service: TransactionService;
    let walletRepositoryMock;
    let paymentServiceMock;
    let transactionRepositoryMock;
    let generalRepositoryMock;

    beforeAll(async () => {

        const module = await Test.createTestingModule({
            providers: [
                TransactionService,
                {
                    provide: getRepositoryToken(TransactionRepository),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(WalletEntity),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(GeneralEntity),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: PaymentService,
                    useValue: new PaymentServiceMock(),
                },
            ],
        }).compile();

        service = module.get(TransactionService);
        walletRepositoryMock = module.get(getRepositoryToken(WalletEntity));
        transactionRepositoryMock = module.get(getRepositoryToken(TransactionRepository));
        generalRepositoryMock = module.get(getRepositoryToken(GeneralEntity));
        paymentServiceMock = module.get(PaymentService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('GetList transactions emptity', async () => {
        const result = { count: 0, data: [], totalMonth: 0 };

        jest.spyOn(transactionRepositoryMock, 'get').mockReturnValue(result);
        const resp = await service.getList({ clientId: 1 });
        expect(resp).toBe(result);
    });

    it('GetList transactions', async () => {
        const transaction = new TransactionEntity();
        const result = { count: 1, data: [transaction], totalMonth: 100 };

        jest.spyOn(transactionRepositoryMock, 'get').mockReturnValue(result);
        const resp = await service.getList({ clientId: 1 });
        expect(resp).toBe(result);
    });

    it('charge function not wallet', async () => {
        const order = new OrderEntity();
        order.createdById = 1;
        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(null);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { message, status } = error;
            expect(status).toEqual(400);
            expect(message.message).toEqual(`There aren't any payment method sets for client 1, or the selected method is not active`);
        }
    });

    it('charge function wallet with failed status', async () => {
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.FAILED;
        const order = new OrderEntity();
        order.createdById = 1;

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { message, status } = error;
            expect(status).toEqual(400);
            expect(message.message).toEqual(`There aren't any payment method sets for client 1, or the selected method is not active`);
        }
    });

    it('charge function wallet', async () => {
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        wallet.type = PAYMENT_METHOD_TYPE.CREDIT_CARD;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        general.creditCardPaymentFee = 4;
        const transaction = new TransactionEntity();

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'sale').mockReturnValue({
            status: TRANSACTION_STATUSES.AUTHORIZED,
            externalId: 'id', amount: 100, provider: 'merchantAccountId',
        });
        jest.spyOn(paymentServiceMock, 'submitForSettlement').mockReturnValue({
            status: TRANSACTION_STATUSES.SUBMITTED_FOR_SETTLEMENT,
            externalId: 'id', amount: 100, provider: 'merchantAccountId',
        });
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('charge function sale error', async () => {
        const result = { success: false, message: 'Could not create transaction' };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'sale').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { status } = error;
            expect(status).toEqual(400);
        }
    });

    it('charge function sale error without message error', async () => {
        const result = { success: false };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'sale').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { status } = error;
            expect(status).toEqual(400);
        }
    });

    it('charge function sale error with failed status', async () => {
        const result = {
            success: false,
            transaction: {
                id: 2,
                merchantAccountId: 'merchantAccountId',
                amount: 100,
                status: TRANSACTION_STATUSES.FAILED,
            },
        };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'sale').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { status, message } = error;
            expect(status).toEqual(400);
            expect(message.message).toEqual(`Transaction failed status ${TRANSACTION_STATUSES.FAILED}`);
        }
    });

    it('charge order transaction is settled', async () => {
        const result = {
            success: false,
            transaction: {
                id: 2,
                merchantAccountId: 'merchantAccountId',
                amount: 100,
                status: TRANSACTION_STATUSES.SETTLED,
            },
        };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();
        transaction.externalId = '123';

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'findOne').mockReturnValue(transaction);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'submitForSettlement').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        await service.charge(order, 100);
    });

    it('charge order submit for settlement, transaction error', async () => {
        const result = {
            success: false,
            transaction: {
                id: 2,
                merchantAccountId: 'merchantAccountId',
                amount: 100,
                status: TRANSACTION_STATUSES.AUTHORIZED_EXPIRED,
            },
        };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();
        transaction.externalId = '123';

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'findOne').mockReturnValue(transaction);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'submitForSettlement').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            const { status, message } = error;
            expect(status).toEqual(400);
            expect(message.message).toEqual(`Transaction failed status ${TRANSACTION_STATUSES.AUTHORIZED_EXPIRED}`);
        }
    });

    it('charge order submit for settlement, transaction error undeffined', async () => {
        const result = {
            success: false,
        };
        const wallet = new WalletEntity();
        wallet.status = WALLET_STATUSES.VERIFIED;
        const order = new OrderEntity();
        order.createdById = 1;
        const general = new GeneralEntity();
        const transaction = new TransactionEntity();
        transaction.externalId = '123';

        jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(transactionRepositoryMock, 'findOne').mockReturnValue(transaction);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);
        jest.spyOn(paymentServiceMock, 'submitForSettlement').mockRejectedValue(result);
        jest.spyOn(transactionRepositoryMock, 'save').mockReturnValue(transaction);

        try {
            await service.charge(order, 100);
        } catch (error) {
            expect(error.status).toEqual(400);
        }
    });

    it('chargeOrder function', async () => {
        const order = new OrderEntity();
        const general = new GeneralEntity();

        jest.spyOn(generalRepositoryMock, 'findOne').mockReturnValue(general);
        jest.spyOn(service, 'charge').mockImplementation(() =>
            Promise.reject(),
        );
        try {
            await service.chargeOrder(order);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });
});
