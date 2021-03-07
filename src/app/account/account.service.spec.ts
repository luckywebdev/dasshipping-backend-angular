import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as csvjson from 'csvjson';
import * as fs from 'fs';
import * as MockExpressResponse from 'mock-express-response';
import * as moment from 'moment';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { AccountEntity } from '../../entities/account.entity';
import { AccountFilesEntity } from '../../entities/accountFiles.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { JoinRequestRepository } from '../../repositories/joinRequests.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { repositoryMockFactory } from '../../testutils/repository';
import { checkExistsFile, fileSign } from '../../utils/fileSign.util';
import { NotificationService } from '../notification/notification.service';
import { AccountService } from './account.service';
import { ACCOUNTS_ORDER_BY_FIELDS } from './dto/list/request.dto';
import { PatchUserRequest } from './dto/patch/request.dto';

jest.mock('../../utils/fileSign.util');
jest.mock('fs');
jest.mock('csvjson');
jest.mock('rimraf');
jest.mock('zip-folder');
const zipFolder = (callback) => callback();

const MailServiceMock = jest.fn().mockImplementation(() => {
    return {
        blockAccountTemplate: jest.fn(),
        sendEmail: jest.fn(),
        resetPasswordTemplate: jest.fn(),
    };
});
const ConfigServiceMock = jest.fn().mockImplementation(() => {
    return {
        email: { apiKey: 'apiKey', domain: 'domain' },
        apiKey: jest.fn(),
    };
});
const NotificationServiceMock = jest.fn().mockImplementation(() => {
    return {
        create: jest.fn(),
    };
});

describe('JoinRequestService', () => {
    let resetTokenRepositryMock;
    let quoteRepositoryMock;
    let accountRepositoryMock;
    let notificationRepositoryMock;
    let accountFilesRepositoryMock;
    let mailServiceMock;
    let configServiceMock;
    let joinRequestRepositoryMock;
    let notificationServiceMock;
    let accountService: AccountService;

    beforeEach(async () => {

        const module = await Test.createTestingModule({
            providers: [
                AccountService,
                {
                    provide: getRepositoryToken(AccountRepository),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(ResetTokenEntity),
                    useFactory: repositoryMockFactory,
                },
                {
                    provide: getRepositoryToken(JoinRequestRepository),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(AccountFilesEntity),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(NotificationRepository),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: getRepositoryToken(QuoteRepository),
                    useValue: new repositoryMockFactory(),
                },
                {
                    provide: MailService,
                    useValue: new MailServiceMock(),
                },
                {
                    provide: ConfigService,
                    useValue: new ConfigServiceMock(),
                },
                {
                    provide: NotificationService,
                    useValue: new NotificationServiceMock(),
                },
            ],
        }).compile();

        accountRepositoryMock = module.get(getRepositoryToken(AccountRepository));
        resetTokenRepositryMock = module.get(getRepositoryToken(ResetTokenEntity));
        joinRequestRepositoryMock = module.get(getRepositoryToken(JoinRequestRepository));
        accountFilesRepositoryMock = module.get(getRepositoryToken(AccountFilesEntity));
        notificationRepositoryMock = module.get(getRepositoryToken(NotificationRepository));
        quoteRepositoryMock = module.get(getRepositoryToken(QuoteRepository));
        mailServiceMock = module.get(MailService);
        configServiceMock = module.get(ConfigService);
        notificationServiceMock = module.get(NotificationService);
        accountService = module.get(AccountService);
    });

    describe('approve', () => {
        it('Approve account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';

            jest.spyOn(accountRepositoryMock, 'update').mockResolvedValueOnce({});

            expect(await accountService.approve(account, { approved: true, ids: [account.id] })).toEqual({ success: true });
        });

        it('Approve account with admin account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            account.roleId = ROLES.SUPER_ADMIN;

            jest.spyOn(accountRepositoryMock, 'update').mockResolvedValueOnce({});

            expect(await accountService.approve(account, { approved: true, ids: [account.id] })).toEqual({ success: true });
        });
    });

    describe('block', () => {
        it('Block account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';

            jest.spyOn(accountRepositoryMock, 'update');
            jest.spyOn(accountRepositoryMock, 'find').mockReturnValue([account]);
            jest.spyOn(mailServiceMock, 'blockAccountTemplate');
            jest.spyOn(mailServiceMock, 'sendEmail');

            expect(await accountService.blockAccounts(account,
                { blocked: true, ids: [account.id], reason: 'block test reason' })).toEqual({ success: true });
        });

        it('Block account with admin account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            account.roleId = ROLES.SUPER_ADMIN;

            jest.spyOn(accountRepositoryMock, 'update');
            jest.spyOn(accountRepositoryMock, 'find').mockReturnValue([account]);
            jest.spyOn(mailServiceMock, 'blockAccountTemplate');
            jest.spyOn(mailServiceMock, 'sendEmail');

            expect(await accountService.blockAccounts(account,
                { blocked: true, ids: [account.id] })).toEqual({ success: true });
        });

        it('Active account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';

            jest.spyOn(accountRepositoryMock, 'update');
            jest.spyOn(accountRepositoryMock, 'find').mockReturnValue([account]);
            jest.spyOn(mailServiceMock, 'blockAccountTemplate');
            jest.spyOn(mailServiceMock, 'sendEmail');

            expect(await accountService.blockAccounts(account,
                { blocked: false, ids: [account.id], reason: 'active test reason' })).toEqual({ success: true });
        });
    });

    describe('delete', () => {
        it('Delete account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';

            jest.spyOn(accountRepositoryMock, 'update');

            expect(await accountService.delete(account, { deleted: true, ids: [account.id] })).toEqual({ success: true });
        });

        it('Delete account with admin account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            account.roleId = ROLES.SUPER_ADMIN;

            jest.spyOn(accountRepositoryMock, 'update');

            expect(await accountService.delete(account, { deleted: true, ids: [account.id] })).toEqual({ success: true });
        });
    });

    describe('editMyProfile', () => {
        it('editMyProfile account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            const updatedAccount = account;
            updatedAccount.lastName = 'Test patch';

            jest.spyOn(accountService, 'patch').mockImplementation(() =>
                Promise.resolve(updatedAccount),
            );

            expect(await accountService.editMyProfile(account, { ...updatedAccount })).toEqual(updatedAccount);
        });

        it('editMyProfile account with password success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            const updatedAccount = account;
            updatedAccount.password = 'Secret!123123';

            jest.spyOn(accountService, 'patch').mockImplementation(() =>
                Promise.resolve(updatedAccount),
            );

            expect(await accountService.editMyProfile(account, { ...updatedAccount })).toEqual(account);
        });

        it('editMyProfile account with password success and supper admin', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            account.roleId = ROLES.SUPER_ADMIN;
            const updatedAccount = account;
            updatedAccount.password = 'Secret!123123';

            jest.spyOn(accountService, 'patch').mockImplementation(() =>
                Promise.resolve(updatedAccount),
            );

            expect(await accountService.editMyProfile(account, { ...updatedAccount })).toEqual(account);
        });

        it('editMyProfile account with password filed not valid', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            const updatedAccount = account;
            updatedAccount.password = 'Test patch';

            try {
                await accountService.editMyProfile(account, { ...updatedAccount });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Password is not enough strong');
            }
        });

        it('editMyProfile account with password filed not valid and company admin', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.firstName = 'first name';
            account.roleId = ROLES.COMPANY_ADMIN;
            const updatedAccount = account;
            updatedAccount.password = 'Test patch';

            try {
                await accountService.editMyProfile(account, { ...updatedAccount });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Password is not enough strong');
            }
        });
    });

    describe('forgotPassword', () => {
        it('forgotPassword account', async () => {
            const email = 'test@gmail.com';
            const account = new AccountEntity();

            jest.spyOn(accountRepositoryMock, 'findOne').mockReturnValue(account);
            jest.spyOn(resetTokenRepositryMock, 'insert');
            jest.spyOn(mailServiceMock, 'resetPasswordTemplate').mockReturnValue('html');
            jest.spyOn(mailServiceMock, 'sendEmail');

            expect(await accountService.forgotPassword({ email })).toEqual({ success: true });
        });

        it('forgotPassword account no exist', async () => {
            const email = 'test@gmail.com';

            jest.spyOn(accountRepositoryMock, 'findOne').mockReturnValue(null);

            try {
                await accountService.forgotPassword({ email });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Account was not found.');
            }
        });

        it('forgotPassword account mail service trow error', async () => {
            const email = 'test@gmail.com';
            const account = new AccountEntity();

            jest.spyOn(accountRepositoryMock, 'findOne').mockReturnValue(account);
            jest.spyOn(resetTokenRepositryMock, 'insert');
            jest.spyOn(mailServiceMock, 'resetPasswordTemplate').mockRejectedValue('html');

            try {
                await accountService.forgotPassword({ email });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(500);
                expect(message.message).toEqual('Error at sending email.');
            }
        });
    });

    describe('getAccount', () => {
        it('getAccount account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            jest.spyOn(accountRepositoryMock, 'getAccount').mockReturnValue(account);

            expect(await accountService.getAccount(1)).toEqual(account);
        });

        it('getAccount account not exist', async () => {
            jest.spyOn(accountRepositoryMock, 'getAccount').mockReturnValue(null);

            try {
                await accountService.getAccount(1);
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(404);
                expect(message.message).toEqual('Account 1 not found');
            }
        });
    });

    describe('getAccountsList', () => {
        it(`getAccountsList success with query orderByField ${ACCOUNTS_ORDER_BY_FIELDS.BLOCKED}`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            const query = { limit: 10, orderByField: ACCOUNTS_ORDER_BY_FIELDS.BLOCKED };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it(`getAccountsList success with query orderByField ${ACCOUNTS_ORDER_BY_FIELDS.FULL_NAME}`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            const query = { limit: 10, orderByField: ACCOUNTS_ORDER_BY_FIELDS.FULL_NAME };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it(`getAccountsList success with query orderByField ${ACCOUNTS_ORDER_BY_FIELDS.ROLE}`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            const query = { limit: 10, orderByField: ACCOUNTS_ORDER_BY_FIELDS.ROLE };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it('getAccountsList success without query orderByField', async () => {
            const account = new AccountEntity();
            account.id = 1;
            const query = { limit: 10 };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it('getAccountsList success with query role', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.SUPER_ADMIN;
            const query = { limit: 10, role: 'dispatcher' };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it('getAccountsList success with query textFilter', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            account.companyId = 2;
            const query = { limit: 10, textFilter: 'dispatcher' };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });

        it('getAccountsList success by dispetcher', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const query = { limit: 10, textFilter: 'driver', where: { dispatcherId: 3, roleId: ROLES.DRIVER } };
            const result = { data: [], count: 0 };

            jest.spyOn(accountRepositoryMock, 'getAccountsList').mockReturnValue(result);

            expect(await accountService.getAccountsList(account, query)).toEqual(result);
        });
    });

    describe('getMyProfile', () => {
        it('getMyProfile success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;

            expect(await accountService.getMyProfile(account)).toEqual(account);
        });

        it('getMyProfile account role client', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.CLIENT;
            jest.spyOn(notificationRepositoryMock, 'getCount').mockReturnValue(1);
            jest.spyOn(quoteRepositoryMock, 'getVisibleCount').mockReturnValue(1);

            expect(await accountService.getMyProfile(account)).toEqual(account);
        });
    });

    describe('getDispatcherProfile', () => {
        it('getDispatcherProfile success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.dispatcherId = 3;

            jest.spyOn(accountRepositoryMock, 'findOne').mockReturnValue(account);

            expect(await accountService.getDispatcherProfile(account)).toEqual(account);
        });
    });

    describe('patch', () => {
        it('patch success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.dispatcherId = 3;
            const updatedAccount = account;
            updatedAccount.lastName = 'Test patch';

            jest.spyOn(accountService, 'getAccount').mockImplementation(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountRepositoryMock, 'save').mockReturnValue(updatedAccount);

            expect(await accountService.patch(updatedAccount, 1)).toEqual(updatedAccount);
        });

        it('patch success with field payRate', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            account.dispatcherId = 3;
            const updatedAccount = account;
            updatedAccount.lastName = 'Test patch';
            updatedAccount.payRate = 3;

            jest.spyOn(accountService, 'getAccount').mockImplementation(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountRepositoryMock, 'save').mockReturnValue(updatedAccount);

            expect(await accountService.patch(updatedAccount, 1)).toEqual(updatedAccount);
            expect(accountService.getAccount).toHaveBeenCalled();
            expect(accountRepositoryMock.save).toHaveBeenCalled();
        });

        it('patch success with field files', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            account.dispatcherId = 3;
            const updatedAccount: PatchUserRequest = account;
            account.roleId = ROLES.DRIVER;
            updatedAccount.lastName = 'Test patch';
            updatedAccount.files = [{ path: 'path', displayName: 'Test' }];

            jest.spyOn(accountService, 'getAccount').mockImplementation(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountRepositoryMock, 'save').mockReturnValue(updatedAccount);
            jest.spyOn(accountFilesRepositoryMock, 'find').mockReturnValue([]);
            jest.spyOn(accountFilesRepositoryMock, 'remove');
            jest.spyOn(accountFilesRepositoryMock, 'save');

            expect(await accountService.patch(updatedAccount, 1)).toEqual(updatedAccount);
            expect(accountService.getAccount).toHaveBeenCalled();
            expect(accountRepositoryMock.save).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.find).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.remove).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.save).toHaveBeenCalled();
        });

        it('patch success with field files and exist files', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            account.dispatcherId = 3;
            const updatedAccount: PatchUserRequest = account;
            account.roleId = ROLES.DRIVER;
            updatedAccount.lastName = 'Test patch';
            updatedAccount.files = [{ path: 'path', displayName: 'Test' }, { id: 2, path: 'path', displayName: 'Test' }];

            jest.spyOn(accountService, 'getAccount').mockImplementation(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountRepositoryMock, 'save').mockReturnValue(updatedAccount);
            jest.spyOn(accountFilesRepositoryMock, 'find').mockReturnValue([
                { id: 1, path: 'path', displayName: 'Test' },
                { id: 2, path: 'path', displayName: 'Test' }]);
            jest.spyOn(accountFilesRepositoryMock, 'remove');
            jest.spyOn(accountFilesRepositoryMock, 'save');

            expect(await accountService.patch(updatedAccount, 1)).toEqual(updatedAccount);
            expect(accountService.getAccount).toHaveBeenCalled();
            expect(accountRepositoryMock.save).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.find).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.remove).toHaveBeenCalled();
            expect(accountFilesRepositoryMock.save).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it(`resetPassword success by role ${ROLES.COMPANY_ADMIN}`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;

            const getOne = jest.fn(() => ({ account, accountId: 1 }));
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            jest.spyOn(accountRepositoryMock, 'update');
            jest.spyOn(resetTokenRepositryMock, 'update');

            const resp = await accountService.resetPassword({ hash: 'hash', password: 'Secret!123123' });

            expect(resp).toEqual({ success: true });
            expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
            expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
            expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
        });

        it(`resetPassword success by role ${ROLES.DRIVER}`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DRIVER;

            const getOne = jest.fn(() => ({ account, accountId: 1 }));
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            jest.spyOn(accountRepositoryMock, 'update');
            jest.spyOn(resetTokenRepositryMock, 'update');

            const resp = await accountService.resetPassword({ hash: 'hash', password: 'Secret!123123' });

            expect(resp).toEqual({ success: true });
            expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
            expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
            expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
        });

        it(`resetPassword error not token`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DRIVER;

            const getOne = jest.fn(() => null);
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            try {
                await accountService.resetPassword({ hash: 'hash', password: 'Secret!123123' });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Token was not found');
                expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
                expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
                expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
                expect(accountRepositoryMock.update).not.toHaveBeenCalled();
                expect(resetTokenRepositryMock.update).not.toHaveBeenCalled();
            }
        });

        it(`resetPassword error with not valid password`, async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DRIVER;

            const getOne = jest.fn(() => ({ account, accountId: 1 }));
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            try {
                await accountService.resetPassword({ hash: 'hash', password: 'password' });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Password is not strong enough');
                expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
                expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
                expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
                expect(accountRepositoryMock.update).not.toHaveBeenCalled();
                expect(resetTokenRepositryMock.update).not.toHaveBeenCalled();
            }
        });
    });

    describe('getFileSign', () => {
        it('getFileSign success', async (done) => {
            await accountService.getFileSign('filename');
            expect(checkExistsFile).toHaveBeenCalled();
            expect(fileSign).toHaveBeenCalled();
            done();
        });

        // to do
        // it('getFileSign error', async (done) => {
        //     await accountService.getFileSign('filename');
        //     expect(checkExistsFile).toHaveBeenCalled();
        //     expect(fileSign).toHaveBeenCalled();
        //     done();
        // });
    });

    describe('resetPasswordRedirect', () => {
        it('resetPasswordRedirect success with role DISPATCHER', async () => {
            const res = new MockExpressResponse();

            jest.spyOn(accountService, 'validateResetPasswordToken').mockImplementation(() =>
                Promise.resolve({
                    success: true,
                    roleId: ROLES.DISPATCHER,
                }),
            );
            await accountService.resetPasswordRedirect({ hash: 'hash' }, res);
            expect(accountService.validateResetPasswordToken).toHaveBeenCalled();
        });

        it('resetPasswordRedirect success with role DRIVER', async () => {
            const res = new MockExpressResponse();

            jest.spyOn(accountService, 'validateResetPasswordToken').mockImplementation(() =>
                Promise.resolve({
                    success: true,
                    roleId: ROLES.DRIVER,
                }),
            );
            await accountService.resetPasswordRedirect({ hash: 'hash' }, res);
            expect(accountService.validateResetPasswordToken).toHaveBeenCalled();
        });

        it('resetPasswordRedirect success with role CLIENT', async () => {
            const res = new MockExpressResponse();

            jest.spyOn(accountService, 'validateResetPasswordToken').mockImplementation(() =>
                Promise.resolve({
                    success: true,
                    roleId: ROLES.CLIENT,
                }),
            );
            await accountService.resetPasswordRedirect({ hash: 'hash' }, res);
            expect(accountService.validateResetPasswordToken).toHaveBeenCalled();
        });

        it('resetPasswordRedirect error', async () => {
            const res = new MockExpressResponse();
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.CLIENT;

            jest.spyOn(accountService, 'validateResetPasswordToken').mockImplementation(() =>
                Promise.reject(),
            );
            await accountService.resetPasswordRedirect({ hash: 'hash' }, res);
            expect(accountService.validateResetPasswordToken).toHaveBeenCalled();
        });
    });

    describe('validateResetPasswordToken', () => {
        it('validateResetPasswordToken success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            const expire = moment().add(8, 'hours');

            const getOne = jest.fn(() => ({ account, accountId: 1, expire }));
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            const resp = await accountService.validateResetPasswordToken({ hash: 'hash' });

            expect(resp).toEqual({ success: true, roleId: ROLES.COMPANY_ADMIN });
            expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
            expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
            expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
        });

        it('validateResetPasswordToken error not token', async () => {
            const getOne = jest.fn();
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            try {
                await accountService.validateResetPasswordToken({ hash: 'hash' });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Token was not found');
                expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
                expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
                expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
            }
        });

        it('validateResetPasswordToken error not token', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.COMPANY_ADMIN;
            const expire = moment().subtract(2, 'hours');

            const getOne = jest.fn(() => ({ account, accountId: 1, expire }));
            const where = jest.fn(() => ({ getOne }));
            const leftJoinAndSelect = jest.fn(() => ({ where }));
            resetTokenRepositryMock.createQueryBuilder = jest.fn(() => ({ leftJoinAndSelect }));

            try {
                await accountService.validateResetPasswordToken({ hash: 'hash' });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual('Hash is expired');
                expect(resetTokenRepositryMock.createQueryBuilder).toHaveBeenCalledWith('resetToken');
                expect(leftJoinAndSelect).toHaveBeenCalledWith('resetToken.account', 'account');
                expect(where).toHaveBeenCalledWith({ token: 'hash', used: false });
            }
        });
    });

    describe('leaveCompany', () => {
        it('leaveCompany success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.company = new CompanyEntity();

            await accountService.leaveCompany(account);

            expect(accountRepositoryMock.update).toHaveBeenCalled();
        });

        it('leaveCompany error', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.company = null;
            account.firstName = 'firstName';
            account.lastName = 'lastName';

            try {
                await accountService.leaveCompany(account);
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Account ${account.firstName} ${account.lastName} is not associated to any company`);
            }
        });
    });

    describe('kickOut', () => {
        it('kickOut success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.company = new CompanyEntity();

            jest.spyOn(accountRepositoryMock, 'getAccount').mockImplementation(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountService, 'leaveCompany');
            jest.spyOn(notificationServiceMock, 'create');

            await accountService.kickOut(1, 2);

            expect(accountRepositoryMock.getAccount).toHaveBeenCalled();
            expect(accountService.leaveCompany).toHaveBeenCalled();
            expect(notificationServiceMock.create).toHaveBeenCalled();
        });
    });

    // to do error
    describe('joinCompany', () => {
        it('joinCompany success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            const company = new CompanyEntity();

            await accountService.joinCompany(account, company);

            expect(accountRepositoryMock.update).toHaveBeenCalled();
        });
    });

    // to do error
    describe('getActiveJoinedRequest', () => {
        it('getActiveJoinedRequest success', async () => {
            const account = new AccountEntity();
            account.id = 1;

            jest.spyOn(joinRequestRepositoryMock, 'findOne');

            await accountService.getActiveJoinedRequest(account);

            expect(joinRequestRepositoryMock.findOne).toHaveBeenCalled();
        });
    });

    describe('linkDriverToDispatcher', () => {
        it('linkDriverToDispatcher success with linked driver', async () => {
            const account = new AccountEntity();
            account.id = 3;

            const resp = await accountService.linkDriverToDispatcher(account, 1, 2, true);

            expect(resp).toEqual({
                status: 'success',
                message: 'linked',
            });
            expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            expect(accountRepositoryMock.update).toHaveBeenCalled();
            expect(notificationServiceMock.create).toHaveBeenCalled();
        });

        it('linkDriverToDispatcher success with unlinked driver', async () => {
            const account = new AccountEntity();
            account.id = 3;

            const resp = await accountService.linkDriverToDispatcher(account, 1, 2, false);

            expect(resp).toEqual({
                status: 'success',
                message: 'unlinked',
            });
            expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            expect(accountRepositoryMock.update).toHaveBeenCalled();
            expect(notificationServiceMock.create).toHaveBeenCalled();
        });

        it('linkDriverToDispatcher error Dispatcher not found', async () => {
            const account = new AccountEntity();
            account.id = 3;
            const dispatcherId = 1;

            jest.spyOn(accountRepositoryMock, 'findOne').mockReturnValue(null);

            try {
                await accountService.linkDriverToDispatcher(account, dispatcherId, 2, false);
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(404);
                expect(message.message).toEqual(`Dispatcher ${dispatcherId} not found`);
                expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            }
        });

        it('linkDriverToDispatcher error Driver not found', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const dispatcherId = 1;
            const driverId = 2;

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(account),
            );

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(null),
            );

            try {
                await accountService.linkDriverToDispatcher(account, dispatcherId, driverId, true);
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(404);
                expect(message.message).toEqual(`Driver ${driverId} not found`);
                expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            }
        });

        it('linkDriverToDispatcher error Driver was linked to this dispatcher', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const dispatcherId = 1;
            const driverId = 2;

            const driver = new AccountEntity();
            driver.id = driverId;
            driver.dispatcherId = dispatcherId;
            driver.roleId = ROLES.DRIVER;

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(account),
            );

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(driver),
            );

            try {
                await accountService.linkDriverToDispatcher(account, dispatcherId, driverId, true);
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(400);
                expect(message.message).toEqual(`Driver ${driverId} was linked to dispatcher ${dispatcherId}`);
                expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            }
        });
    });

    describe('getDispatcherDrivers', () => {
        it('getDispatcherDrivers success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const result = { data: [account], count: 1 };
            const dispatcherId = 1;

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(account),
            );
            jest.spyOn(accountRepositoryMock, 'getDriversForDispatcher').mockImplementationOnce(() =>
                Promise.resolve(result),
            );

            const resp = await accountService.getDispatcherDrivers(dispatcherId, { limit: 10, offset: 0 });

            expect(resp).toEqual(result);
            expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            expect(accountRepositoryMock.getDriversForDispatcher).toHaveBeenCalled();
        });

        it('getDispatcherDrivers error', async () => {
            const dispatcherId = 1;

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(null),
            );

            try {
                await accountService.getDispatcherDrivers(dispatcherId, { limit: 10, offset: 0 });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(404);
                expect(message.message).toEqual(`Dispatcher ${dispatcherId} not found`);
                expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            }
        });
    });

    describe('blockAccount', () => {
        it('blockAccount success blockAccount', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const accountId = 1;
            const result = {
                success: true,
                message: `Account ${accountId} was successfully blocked`,
            };

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(account),
            );
            jest.spyOn(mailServiceMock, 'sendEmail');
            jest.spyOn(accountRepositoryMock, 'update');

            const resp = await accountService.blockAccount(accountId, { blocked: true });

            expect(resp).toEqual(result);
            expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            expect(mailServiceMock.sendEmail).toHaveBeenCalled();
            expect(accountRepositoryMock.update).toHaveBeenCalled();
        });

        it('blockAccount success active Account', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DISPATCHER;
            const accountId = 1;
            const result = {
                success: true,
                message: `Account ${accountId} was successfully activated`,
            };

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(account),
            );
            jest.spyOn(mailServiceMock, 'sendEmail');
            jest.spyOn(accountRepositoryMock, 'update');

            const resp = await accountService.blockAccount(accountId, { blocked: false });

            expect(resp).toEqual(result);
            expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            expect(mailServiceMock.sendEmail).toHaveBeenCalled();
            expect(accountRepositoryMock.update).toHaveBeenCalled();
        });

        it('blockAccount error', async () => {
            const accountId = 1;

            jest.spyOn(accountRepositoryMock, 'findOne').mockImplementationOnce(() =>
                Promise.resolve(null),
            );

            try {
                await accountService.blockAccount(accountId, { blocked: false });
            } catch (error) {
                const { status, message } = error;
                expect(status).toEqual(404);
                expect(message.message).toEqual(`Account ${accountId} not found`);
                expect(accountRepositoryMock.findOne).toHaveBeenCalled();
            }
        });
    });

    describe('getDriversLastLocation', () => {
        it('getDriversLastLocation success', async () => {
            const companyId = 1;
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DRIVER;
            account.companyId = companyId;

            jest.spyOn(accountRepositoryMock, 'getAccountsLastLocation').mockImplementation(() =>
                Promise.resolve([account]),
            );

            const resp = await accountService.getDriversLastLocation({
                companyId,
                roleId: ROLES.DRIVER,
            });

            expect(resp).toEqual([account]);
            expect(resp[0].roleId).toEqual(ROLES.DRIVER);
            expect(resp[0].companyId).toEqual(companyId);
            expect(accountRepositoryMock.getAccountsLastLocation).toHaveBeenCalled();
        });
    });

    describe('saveSignature', () => {
        it('saveSignature success', async () => {
            const account = new AccountEntity();
            account.id = 1;
            account.roleId = ROLES.DRIVER;

            jest.spyOn(accountRepositoryMock, 'update');

            const resp = await accountService.saveSignature(account, { signatureUrl: 'signatureUrl.png' });

            expect(resp).toEqual({ success: true });
            expect(accountRepositoryMock.update).toHaveBeenCalled();
        });
    });

    describe('getByUserReport', () => {
        it('getByUserReport success', async () => {
            const data = [];

            jest.spyOn(accountRepositoryMock, 'getByUserReport').mockImplementationOnce(() =>
                Promise.resolve({ data }),
            );

            const resp = await accountService.getByUserReport({ role: ROLES.DRIVER });

            expect(resp.data).toEqual(data);
            expect(resp.data.length).toEqual(0);
            expect(accountRepositoryMock.getByUserReport).toHaveBeenCalled();
        });

        it('getByUserReport success not empty', async () => {
            const data = [{
                id: 1,
                payRate: 2,
                grossRevenue: 23,
                toPay: 12,
                firstName: 'string',
                lastName: 'string',
            }];

            jest.spyOn(accountRepositoryMock, 'getByUserReport').mockImplementationOnce(() =>
                Promise.resolve({ data }),
            );

            const resp = await accountService.getByUserReport({ role: ROLES.DRIVER });

            expect(resp.data).toEqual(data);
            expect(resp.data.length).toEqual(1);
            expect(accountRepositoryMock.getByUserReport).toHaveBeenCalled();
        });
    });

    describe('dowloadReportsByUser', () => {
        it('dowloadReportsByUser success', async () => {
            const email = 'test@gmail.com';

            jest.spyOn(accountRepositoryMock, 'getCount');
            jest.spyOn(accountRepositoryMock, 'getByUserReport');
            jest.spyOn(csvjson, 'toCSV');
            jest.spyOn(fs, 'existsSync');
            jest.spyOn(fs, 'mkdirSync');
            jest.spyOn(fs, 'writeFileSync');
            jest.spyOn(fs, 'readFileSync');
            jest.spyOn(mailServiceMock, 'sendEmail');
            jest.spyOn(rimraf, 'sync');
            jest.spyOn(fs, 'unlinkSync');

            const resp = await accountService.dowloadReportsByUser(email, { role: ROLES.DRIVER });

            expect(resp).toEqual({ success: true });
            expect(accountRepositoryMock.getCount).toHaveBeenCalled();
            expect(accountRepositoryMock.getByUserReport).toHaveBeenCalled();
        });

        it('dowloadReportsByUser success not emptity data', async () => {
            const data = [{
                id: 1,
                payRate: 2,
                grossRevenue: 23,
                toPay: 12,
                firstName: 'string',
                lastName: 'string',
            }];
            const email = 'test@gmail.com';

            jest.spyOn(accountRepositoryMock, 'getCount');
            jest.spyOn(accountRepositoryMock, 'getByUserReport').mockImplementationOnce(() =>
                Promise.resolve({ data }),
            );
            jest.spyOn(csvjson, 'toCSV');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'mkdirSync');
            jest.spyOn(fs, 'writeFileSync');
            jest.spyOn(fs, 'readFileSync');
            jest.spyOn(mailServiceMock, 'sendEmail');
            jest.spyOn(rimraf, 'sync');
            jest.spyOn(fs, 'unlinkSync');

            const resp = await accountService.dowloadReportsByUser(email, { deliveredOnly: false });

            expect(resp).toEqual({ success: true });
            expect(accountRepositoryMock.getCount).toHaveBeenCalled();
            expect(accountRepositoryMock.getByUserReport).toHaveBeenCalled();
        });

        it('dowloadReportsByUser success not emptity data not folder', async () => {
            const data = [{
                id: 1,
                payRate: 0,
                grossRevenue: 23,
                toPay: 12,
                firstName: 'string',
                lastName: 'string',
            }];
            const email = 'test@gmail.com';

            jest.spyOn(accountRepositoryMock, 'getCount');
            jest.spyOn(accountRepositoryMock, 'getByUserReport').mockImplementationOnce(() =>
                Promise.resolve({ data }),
            );

            jest.spyOn(csvjson, 'toCSV').mockReturnValue('data_csv');
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            jest.spyOn(fs, 'mkdirSync');
            jest.spyOn(fs, 'writeFileSync');
            jest.spyOn(fs, 'readFileSync').mockReturnValue(new Buffer('test'));
            jest.spyOn(mailServiceMock, 'sendEmail');
            jest.spyOn(rimraf, 'sync');
            jest.spyOn(fs, 'unlinkSync');

            const resp = await accountService.dowloadReportsByUser(email, { deliveredOnly: false });

            expect(resp).toEqual({ success: true });
            expect(accountRepositoryMock.getCount).toHaveBeenCalled();
            expect(accountRepositoryMock.getByUserReport).toHaveBeenCalled();
        });
    });
});
