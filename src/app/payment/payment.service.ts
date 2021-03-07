import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import * as braintree from 'braintree';
import { path } from 'ramda';

import { ConfigService } from '../../config/config.service';
import { SuccessDTO } from '../../dto/success.dto';
import { WalletDTO } from '../../dto/wallet.dto';
import { WALLET_STATUSES } from '../../entities/wallet.entity';

export enum PAYMENT_METHOD_TYPE {
    CREDIT_CARD = 'CreditCard',
    ACH = 'ACH',
}

@Injectable()
export class PaymentService implements OnModuleInit {
    protected gateway;

    constructor(
        private readonly configService: ConfigService,
    ) { }

    onModuleInit(): any {
        this.gateway = braintree.connect(this.configService.braintreePayment);
    }

    public async getClientToken(): Promise<{ clientToken: string } | any> {
        return new Promise((resolve, reject) => {
            this.gateway.clientToken.generate({
            }, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (!response.success) {
                    return reject(response);
                }
                const clientToken = response.clientToken;
                return resolve({ clientToken });
            });
        });
    }

    public async addPaymentMethod(
        customer: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        },
        data: {
            token: string,
            type: string,
        }): Promise<WalletDTO> {
        try {
            const { token, type } = data;
            const customerId = await this.createCustomer(customer);
            return await this.createPaymentMethod(customerId, type, token);
        } catch (e) {
            throw new BadRequestException(e && e.message ? e.message : e);
        }
    }

    private async createCustomer(customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }): Promise<string> {
        return new Promise((resolve, reject) => {
            this.gateway.customer.create(customer,
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!result.success) {
                        return reject(result);
                    }
                    const customerId = path(['customer', 'id'], result) as string;
                    return resolve(customerId);
                },
            );
        });
    }

    public async createPaymentMethod(customerId: string, type: string, paymentMethodNonce: string): Promise<WalletDTO> {
        return new Promise((resolve, reject) => {
            let data: any = {
                customerId,
                paymentMethodNonce,
            };

            if (type === PAYMENT_METHOD_TYPE.ACH) {
                data = {
                    ...data,
                    options: {
                        usBankAccountVerificationMethod: 'network_check',
                    },
                };
            }
            if (type === PAYMENT_METHOD_TYPE.CREDIT_CARD) {
                data = {
                    ...data,
                    options: {
                        verifyCard: true,
                    },
                };
            }
            this.gateway.paymentMethod.create(data,
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!result.success) {
                        return reject(result);
                    }
                    const paymentMethod = path(['paymentMethod'], result) as any;
                    const { bin, maskedNumber, last4, expirationDate, expirationYear,
                        expirationMonth, cardType, token, verified, routingNumber } = paymentMethod;

                    let status = null;
                    if (type === PAYMENT_METHOD_TYPE.CREDIT_CARD) {
                        const verification = path(['paymentMethod', 'verification'], result) as any;
                        status = verification.status;
                    }
                    if (type === PAYMENT_METHOD_TYPE.ACH) {
                        const verifications = path(['paymentMethod', 'verifications'], result) as any;
                        status = verified && verifications.length ? WALLET_STATUSES.VERIFIED : WALLET_STATUSES.FAILED;
                    }

                    return resolve({
                        status,
                        customerId,
                        token,
                        type,
                        details: {
                            bin, maskedNumber, last4, expirationDate, expirationYear, expirationMonth, cardType, routingNumber,
                        },
                    });
                },
            );
        });
    }

    public async removePaymentMethod(data: { customerId: string; token: string }): Promise<SuccessDTO> {
        try {
            const { customerId, token } = data;
            await this.deletePaymentMethod(token);
            return await this.deleteCustomer(customerId);
        } catch (e) {
            throw new BadRequestException(e && e.message ? e.message : e);
        }
    }

    private async deleteCustomer(customerId: string): Promise<SuccessDTO> {
        return new Promise((resolve, reject) => {
            this.gateway.customer.delete(customerId,
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve({
                        success: true,
                    });
                },
            );
        });
    }

    public async deletePaymentMethod(token: string): Promise<SuccessDTO> {
        return new Promise((resolve, reject) => {
            this.gateway.paymentMethod.delete(token,
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve({
                        success: true,
                    });
                },
            );
        });
    }

    public async sale(
        data: {
            amount: string,
            paymentMethodToken: string,
            orderId: string,
        },
        submitForSettlement: boolean = false,
    ): Promise<{ provider: string; status: string; externalId: string; amount: string; }> {
        return new Promise((resolve, reject) => {
            this.gateway.transaction.sale({
                ...data,
                options: {
                    submitForSettlement,
                },
            },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!result.success) {
                        return reject(result);
                    }
                    const transaction = path(['transaction'], result) as any;
                    const { status, id, amount, merchantAccountId } = transaction;
                    return resolve({ status, externalId: id, amount, provider: merchantAccountId });
                },
            );
        });
    }

    public async submitForSettlement(transactionId: string): Promise<{ provider: string; status: string; externalId: string; amount: string; }> {
        return new Promise((resolve, reject) => {
            this.gateway.transaction.submitForSettlement(transactionId, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!result.success) {
                        return reject(result);
                    }
                    const transaction = path(['transaction'], result) as any;
                    const { status, id, amount, merchantAccountId } = transaction;
                    return resolve({ status, externalId: id, amount, provider: merchantAccountId });
                },
            );
        });
    }

}
