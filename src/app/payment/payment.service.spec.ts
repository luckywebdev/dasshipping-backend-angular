import { Test } from '@nestjs/testing';

import { ConfigService } from '../../config/config.service';
import { TransactionDTO } from '../../dto/transaction.dto';
import { WalletDTO } from '../../dto/wallet.dto';
import { PAYMENT_METHOD_TYPE, PaymentService } from './payment.service';

const ConfigServiceMock = jest.fn().mockImplementation(() => {
    return {
        braintreePayment: {
            merchantId: 'merchantId',
            publicKey: 'publicKey',
            privateKey: 'privateKey',
            environment: 'Sandbox',
        },
    };
});

const gatwayMock = jest.fn().mockImplementation(() => {
    return {
        clientToken: { generate: (callback) => callback() },
        customer: { create: (callback) => callback(), delete: (callback) => callback() },
        paymentMethod: { create: (callback) => callback(), delete: (callback) => callback() },
        transaction: { sale: (callback) => callback() },
    };
});

describe('PaymentService', () => {
    let paymentService: PaymentService;
    const wallet: WalletDTO = {
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
                PaymentService,
                {
                    provide: ConfigService,
                    useValue: new ConfigServiceMock(),
                },
            ],
        }).compile();

        paymentService = module.get(PaymentService);
        paymentService['gateway'] = new gatwayMock();
    });

    describe('getClientToken', () => {
        it('Get Client Token return response with token', async (done) => {
            const result = { clientToken: 'clientToken' };

            jest.spyOn(paymentService['gateway'].clientToken, 'generate').mockReturnValue(result);
            done()

            expect(await paymentService.getClientToken()).toEqual(result);
        });

        it('Get Client Token return response without token', async (done) => {
            const result = { success: false, message: 'Could not generate token' };

            jest.spyOn(paymentService['gateway'].clientToken, 'generate').mockReturnValue(result);
            done()

            try {
                await paymentService.getClientToken();
            } catch (error) {
                expect(error).toEqual(result);
            }
        });

        it('Get Client Token return err', async (done) => {
            const result = { success: false };

            jest.spyOn(paymentService['gateway'].clientToken, 'generate').mockReturnValue(result);
            done();

            try {
                await paymentService.getClientToken();
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });
    });

    describe('createCustomer', () => {
        const customer = {
            firstName: 'Test',
            lastName: 'Test',
            email: 'test@gmail.com',
            phone: '123456789',
        };

        it('Create customer return response with customerId', async (done) => {
            const result = '849185956';

            jest.spyOn(paymentService['gateway'].customer, 'create').mockReturnValue(result);
            done();

            // tslint:disable-next-line: no-string-literal
            const response = await paymentService['createCustomer'](customer);
            expect(response).toEqual(result);
        });

        it('Create customer return response without customerId', async (done) => {
            const result = { success: false, message: 'Could not create customer' };

            jest.spyOn(paymentService['gateway'].customer, 'create').mockReturnValue(result);
            done();

            try {
                // tslint:disable-next-line: no-string-literal
                await paymentService['createCustomer'](customer);
            } catch (error) {
                expect(error).toEqual(result);
            }
        });

        it('Create customer return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].customer, 'create').mockReturnValue(result);
            done();

            try {
                // tslint:disable-next-line: no-string-literal
                await paymentService['createCustomer'](customer);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });
    });

    describe('createPaymentMethod', () => {
        const customerId = '849185956';
        const paymentMethodNonce = 'tokencc_bh_d7pdnn_h763gs_xyssy6_4s26sf_yhz';

        it('Create PaymentMethod return response with wallet', async (done) => {
            const result = wallet;
            jest.spyOn(paymentService['gateway'].paymentMethod, 'create').mockReturnValue(result);
            done();

            const response = await paymentService.createPaymentMethod(customerId, PAYMENT_METHOD_TYPE.CREDIT_CARD, paymentMethodNonce);
            expect(response).toEqual(result);
        });

        it('Create PaymentMethod return response without wallet', async (done) => {
            const result = { success: false, message: 'Could not create PaymentMethod' };

            jest.spyOn(paymentService['gateway'].paymentMethod, 'create').mockReturnValue(result);
            done();

            try {
                await paymentService.createPaymentMethod(customerId, PAYMENT_METHOD_TYPE.CREDIT_CARD, paymentMethodNonce);
            } catch (error) {
                expect(error).toEqual(result);
            }
        });

        it('Create PaymentMethod return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].paymentMethod, 'create').mockReturnValue(result);
            done();

            try {
                await paymentService.createPaymentMethod(customerId, PAYMENT_METHOD_TYPE.CREDIT_CARD, paymentMethodNonce);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });
    });

    describe('deleteCustomer', () => {
        const customerId = '849185956';

        it('Delete customer return response', async (done) => {
            const result = {
                success: true,
            };

            jest.spyOn(paymentService['gateway'].customer, 'delete').mockReturnValue(result);
            done();

            // tslint:disable-next-line: no-string-literal
            const response = await paymentService['deleteCustomer'](customerId);
            expect(response).toEqual(result);
        });

        it('Delete customer return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].customer, 'delete').mockReturnValue(result);
            done();

            try {
                // tslint:disable-next-line: no-string-literal
                await paymentService['deleteCustomer'](customerId);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });
    });

    describe('deletePaymentMethod', () => {
        const token = '2mvw5q';

        it('Delete PaymentMethod return response', async (done) => {
            const result = {
                success: true,
            };

            jest.spyOn(paymentService['gateway'].paymentMethod, 'delete').mockReturnValue(result);
            done();

            const response = await paymentService.deletePaymentMethod(token);
            expect(response).toEqual(result);
        });

        it('Delete PaymentMethod return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].paymentMethod, 'delete').mockReturnValue(result);
            done();

            try {
                await paymentService.deletePaymentMethod(token);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });
    });

    describe('removePaymentMethod', () => {
        const data = { customerId: '849185956', token: '2mvw5q' };

        it('Remove PaymentMethod return response', async () => {
            const result = {
                success: true,
            };

            jest.spyOn<any, any>(paymentService, 'deleteCustomer').mockImplementation(() =>
                Promise.resolve(result)
            );
            jest.spyOn(paymentService, 'deletePaymentMethod').mockImplementation(() =>
                Promise.resolve(result)
            );

            const response = await paymentService.removePaymentMethod(data);
            expect(response).toEqual(result);
        });

        it('Remove PaymentMethod return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].paymentMethod, 'delete').mockReturnValue(result);
            done();
            jest.spyOn(paymentService, 'deletePaymentMethod').mockRejectedValue(result.message);

            try {
                await paymentService.removePaymentMethod(data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Braintree error');
            }
        });
    });

    describe('addPaymentMethod', () => {
        const customer = {
            firstName: 'Test',
            lastName: 'Test',
            email: 'test@gmail.com',
            phone: '123456789',
        };
        const token = 'token_card_2mvw5q';

        it('Add PaymentMethod return response', async (done) => {
            const result = wallet;

            jest.spyOn(paymentService['gateway'].customer, 'create').mockReturnValue(result);
            done();

            const response = await paymentService.addPaymentMethod(customer, { token, type: PAYMENT_METHOD_TYPE.CREDIT_CARD });
            expect(response).toEqual(result);
        });

        it('Add PaymentMethod return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].customer, 'create').mockReturnValue(result);
            done();
            jest.spyOn<any, string>(paymentService, 'createCustomer').mockRejectedValue(result.message);

            try {
                await paymentService.addPaymentMethod(customer, { token, type: PAYMENT_METHOD_TYPE.CREDIT_CARD });
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Braintree error');
            }
        });
    });

    describe('sale', () => {
        const data = {
            amount: '10.00',
            paymentMethodToken: 'token',
            orderId: 'orderId_dad',
        };

        it('Sale return err', async (done) => {
            const result = { success: false, message: 'Braintree error' };

            jest.spyOn(paymentService['gateway'].transaction, 'sale').mockReturnValue(result);
            done();

            try {
                await paymentService['sale'](data);
            } catch (error) {
                const { message, status } = error;
                expect(status).toEqual(400);
                expect(message).toEqual('Braintree error');
            }
        });

        it('Sale return response without transaction', async (done) => {
            const result = { success: false, message: 'Could not create transaction' };

            jest.spyOn(paymentService['gateway'].transaction, 'sale').mockReturnValue(result);
            done();

            try {
                await paymentService['sale'](data);
            } catch (error) {
                expect(error).toEqual(result);
            }
        });

        it('Sale return response success', async (done) => {
            const transaction = new TransactionDTO();
            jest.spyOn(paymentService['gateway'].transaction, 'sale').mockReturnValue(transaction);
            done();

            expect(await paymentService['sale'](data)).toEqual(transaction);
        });
    });

});
