import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEventEmitter } from 'nest-emitter';
import { Repository } from 'typeorm';

import { SuccessDTO } from '../../dto/success.dto';
import { WalletDTO } from '../../dto/wallet.dto';
import { AccountEntity } from '../../entities/account.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { AppEventEmitter } from '../event/app.events';
import { PaymentService } from '../payment/payment.service';
import { WalletRequestDTO } from './dto/addWallet.dto';

@Injectable()
export class WalletService {

    constructor(
        @InjectRepository(WalletEntity) private readonly walletEntity: Repository<WalletEntity>,
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        private readonly paymentService: PaymentService,
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    ) { }

    public async findWallet(clientId: number): Promise<WalletDTO | {}> {
        const wallet = await this.walletEntity.findOne({ clientId });
        if (wallet) {
            delete wallet.customerId;
            delete wallet.token;
        }
        return wallet;
    }

    public async addWallet(account: AccountEntity, data: WalletRequestDTO): Promise<WalletDTO> {
        const existWallet = await this.walletEntity.findOne({ clientId: account.id });
        if (existWallet) {
            throw new BadRequestException('You already have a wallet set');
        }
        const paymentMethod = await this.paymentService.addPaymentMethod({
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            phone: account.phoneNumber,
        }, data);

        const wallet = await this.walletEntity.save({
            ...paymentMethod,
            clientId: account.id,
        });

        if (account.paymentFailed) {
            await this.accountRepository.update(account.id, { paymentFailed: false });
            this.emitter.emit('order_charge', account.id);
        }

        if (wallet) {
            delete wallet.customerId;
            delete wallet.token;
        }
        return wallet;
    }

    public async removeWallet(clientId: number): Promise<SuccessDTO> {
        const wallet = await this.walletEntity.findOne({ clientId });
        if (!wallet) {
            throw new BadRequestException(`You don't have a wallet`);
        }
        await this.paymentService.deletePaymentMethod(wallet.token);

        await this.walletEntity.save({ ...wallet, token: null, details: null });
        return { success: true };
    }

    public async editWallet(account: AccountEntity, data: WalletRequestDTO): Promise<WalletDTO> {
        const existWallet = await this.walletEntity.findOne({ clientId: account.id });
        if (!existWallet) {
            throw new BadRequestException(`You don't have a wallet`);
        }
        let paymentMethod = {};
        try {
            if (existWallet.token) {
                await this.paymentService.deletePaymentMethod(existWallet.token);
            }
            paymentMethod = await this.paymentService.createPaymentMethod(existWallet.customerId, data.type, data.token);
        } catch (e) {
            throw new BadRequestException(e && e.message ? e.message : e);
        }

        const wallet = await this.walletEntity.save({
            ...existWallet,
            ...paymentMethod,
            clientId: account.id,
        });

        if (account.paymentFailed) {
            await this.accountRepository.update(account.id, { paymentFailed: false });
            this.emitter.emit('order_charge', account.id);
        }

        if (wallet) {
            delete wallet.customerId;
            delete wallet.token;
        }
        return wallet;
    }
}
