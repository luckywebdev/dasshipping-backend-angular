import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { WalletDTO } from '../../dto/wallet.dto';
import { AccountEntity } from '../../entities/account.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { repositoryMockFactory } from '../../testutils/repository';
import { PaymentServiceMock } from '../../testutils/servicesMock';
import { PAYMENT_METHOD_TYPE, PaymentService } from '../payment/payment.service';
import { WalletRequestDTO } from './dto/addWallet.dto';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
    let paymentServiceMock;
    let walletRepositoryMock;
    let walletService: WalletService;
    const wallet: WalletDTO = {
        id: 1,
        status: 'verified',
        customerId: '849185956',
        token: '2mvw5q',
        type: 'CreditCard',
        details: {
            bin: '401200',
            maskedNumber: '401200******7777',
            last4: '7777',
            expirationDate: '10/2020',
            expirationYear: '2020',
            expirationMonth: '10',
            cardType: 'Visa',
        },
    };

    beforeEach(async () => {

        const module = await Test.createTestingModule({
            providers: [
                WalletService,
                {
                    provide: getRepositoryToken(WalletEntity),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: PaymentService,
                    useValue: new PaymentServiceMock(),
                },
            ],
        }).compile();

        walletRepositoryMock = module.get(getRepositoryToken(WalletEntity));
        paymentServiceMock = module.get<PaymentService>(PaymentService);
        walletService = module.get(WalletService);
    });

    describe('findWallet', () => {
        const clientId = 1;
        it('Get Client wallet return response', async () => {
            const result = wallet;

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(result);

            const response = await walletService.findWallet(clientId);
            expect(response).toEqual(result);
        });

        it('Get Client wallet return response emptity object', async () => {
            const result = {};
            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(result);

            expect(await walletService.findWallet(clientId)).toEqual(result);
        });

        it('Get Client wallet is clientId = null return emptity object', async () => {
            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(null);

            expect(await walletService.findWallet(clientId)).toEqual(null);
        });
    });

    describe('addWallet', () => {
        const existWallet = wallet;
        const account = new AccountEntity();
        account.id = 1;
        const data: WalletRequestDTO = { token: 'token', type: PAYMENT_METHOD_TYPE.CREDIT_CARD };

        it('Add Client wallet return exist wallet error', async () => {

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(existWallet);

            try {
                await walletService.addWallet(account, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`You already have a wallet set`);
            }
        });

        it('Add Client wallet return paymentService error', async () => {
            const result = new BadRequestException('Braintree error');

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(null);
            jest.spyOn(paymentServiceMock, 'addPaymentMethod').mockImplementation(() =>
                Promise.reject(result),
            );

            try {
                await walletService.addWallet(account, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Braintree error`);
            }
        });

        it('Add Client wallet return wallet', async () => {
            const result = new WalletDTO();

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);
            jest.spyOn(paymentServiceMock, 'addPaymentMethod').mockImplementation(() =>
                Promise.resolve(),
            );
            jest.spyOn(walletRepositoryMock, 'save').mockResolvedValue(result);

            expect(await walletService.addWallet(account, data)).toEqual(result);
        });

        it('Add Client wallet return wallet empty', async () => {
            const result = new WalletDTO();

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);
            jest.spyOn(paymentServiceMock, 'addPaymentMethod').mockImplementation(() =>
                Promise.resolve(result),
            );
            jest.spyOn(walletRepositoryMock, 'save').mockReturnValue(null);

            expect(await walletService.addWallet(account, data)).toEqual(null);
        });
    });

    describe('removeWallet', () => {
        const clientId = 1;

        it('Remove Client wallet return not exist wallet error', async () => {
            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);

            try {
                await walletService.removeWallet(clientId);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`You don't have a wallet`);
            }
        });

        it('Remove Client wallet return paymentService error', async () => {
            const result = new BadRequestException('Braintree error');

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
            jest.spyOn(paymentServiceMock, 'removePaymentMethod').mockImplementation(() =>
                Promise.reject(result),
            );

            try {
                await walletService.removeWallet(clientId);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Braintree error`);
            }
        });

        it('Remove Client wallet return success', async () => {
            const result = { success: true };

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(wallet);
            jest.spyOn(paymentServiceMock, 'removePaymentMethod').mockImplementation(() =>
                Promise.resolve(result),
            );

            expect(await walletService.removeWallet(clientId)).toEqual(result);
        });

        it('Remove Client wallet is clientId = null return error', async () => {

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);

            try {
                await walletService.removeWallet(null);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`You don't have a wallet`);
            }
        });
    });

    describe('editWallet', () => {
        const clientId = 1;
        const data: WalletRequestDTO = { token: 'token', type: PAYMENT_METHOD_TYPE.CREDIT_CARD };

        it('Edit Client wallet return not exist wallet error', async () => {
            const result = new BadRequestException(`You don't have a wallet`);

            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`You don't have a wallet`);
            }
        });

        it('Edit Client wallet return paymentService error from deletePaymentMethod', async () => {
            const result = new BadRequestException('Braintree error');

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockImplementation(() =>
                Promise.reject(result),
            );

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Braintree error`);
            }
        });

        it('Edit Client wallet return paymentService error without message from deletePaymentMethod', async () => {
            const result = { status: 400 };
            const existWallet = wallet;
            delete existWallet.token;

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(existWallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockRejectedValue(result);
            jest.spyOn(paymentServiceMock, 'createPaymentMethod').mockRejectedValue({ success: false });

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                const { status } = error;
                expect(status).toEqual(400);
            }
        });

        it('Edit Client wallet if exist wallet', async () => {
            const existWallet = wallet;
            existWallet.token = 'test';

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(existWallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockImplementation(() =>
                Promise.reject(),
            );

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                const { status } = error;
                expect(status).toEqual(400);
            }
        });

        it('Edit Client wallet return paymentService error from createPaymentMethod', async () => {
            const result = new BadRequestException('Braintree error');

            jest.spyOn(walletRepositoryMock, 'findOne').mockReturnValue(wallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockImplementation(() =>
                Promise.resolve({ success: true }),
            );
            jest.spyOn(paymentServiceMock, 'createPaymentMethod').mockImplementation(() =>
                Promise.reject(result),
            );

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Braintree error`);
            }
        });

        it('Edit Client wallet return success', async () => {
            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(wallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockImplementation(() =>
                Promise.resolve({ success: true }),
            );
            jest.spyOn(paymentServiceMock, 'createPaymentMethod').mockImplementation(() =>
                Promise.resolve(wallet),
            );
            jest.spyOn(walletRepositoryMock, 'save').mockResolvedValue(wallet);

            expect(await walletService.editWallet(clientId, data)).toEqual(wallet);
        });

        it('Edit Client wallet is clientId = null return error', async () => {
            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(null);

            try {
                await walletService.editWallet(null, data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`You don't have a wallet`);
            }
        });

        it('Edit Client wallet return wallet empty', async () => {
            jest.spyOn(walletRepositoryMock, 'findOne').mockResolvedValue(wallet);
            jest.spyOn(paymentServiceMock, 'deletePaymentMethod').mockImplementation(() =>
                Promise.resolve({ success: true }),
            );
            jest.spyOn(paymentServiceMock, 'createPaymentMethod').mockImplementation(() =>
                Promise.resolve(wallet),
            );
            jest.spyOn(walletRepositoryMock, 'save').mockResolvedValue(null);

            try {
                await walletService.editWallet(clientId, data);
            } catch (error) {
                expect(error).toEqual(null);
            }
        });
    });
});
