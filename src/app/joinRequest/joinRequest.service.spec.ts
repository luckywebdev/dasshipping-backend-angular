import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from '../../entities/account.entity';
import { JoinRequestRepository } from '../../repositories/joinRequests.repository';
import { JoinRequestService } from './joinRequest.service';
import { CompanyEntity } from '../../entities/company.entity';
import { AccountService } from '../account/account.service';
import { JOIN_REQUEST_STATUS, JoinRequestEntity } from '../../entities/joinRequest.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

const CompanyRepositoryMock = jest.fn().mockImplementation(() => {
    return {
        findOne: jest.fn(),
    };
});
const AccountServiceMock = jest.fn().mockImplementation(() => {
    return {
        joinCompany: jest.fn(),
    };
});
const JoinRequestRepositoryMock = jest.fn().mockImplementation(() => {
    return {
        getJoinedRequests: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };
});
const NotificarionServiceMock = jest.fn().mockImplementation(() => {
    return {
        create: jest.fn(),
    };
});

describe('JoinRequestService', () => {
    let joinRequestService: JoinRequestService;
    let companyRepositoryMock;
    let joinRequestRepositoryMock;
    let accountServiceMock;

    beforeEach(async () => {

        const module = await Test.createTestingModule({
            providers: [
                JoinRequestService,
                {
                    provide: getRepositoryToken(JoinRequestRepository),
                    useValue: new JoinRequestRepositoryMock(),
                },
                {
                    provide: getRepositoryToken(CompanyEntity),
                    useValue: new CompanyRepositoryMock(),
                },
                {
                    provide: AccountService,
                    useValue: new AccountServiceMock(),
                },
                {
                    provide: NotificationService,
                    useValue: new NotificarionServiceMock(),
                },
            ],
        }).compile();

        joinRequestService = module.get(JoinRequestService);
        joinRequestRepositoryMock = module.get(getRepositoryToken(JoinRequestRepository));
        companyRepositoryMock = module.get(getRepositoryToken(CompanyEntity));
        accountServiceMock = module.get(AccountService);
    });

    describe('GetJoinedRequests', () => {
        it('should return count and array of joined requests', async () => {
            const account = new AccountEntity();
            const joinRequest = new JoinRequestEntity();
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.ACCEPTED;
            joinRequest.company = new CompanyEntity();

            const result = { count: 1, data: [joinRequest] };

            jest.spyOn(joinRequestRepositoryMock, 'getJoinedRequests').mockReturnValueOnce(result);

            expect(await joinRequestService.getJoinedRequests(account, { limit: 10 }, 'Accepted')).toEqual(result);
        });
    });

    describe('createJoinRequest', () => {
        it('Create successful a join request and return it', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            company.dotNumber = '123';
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(companyRepositoryMock, 'findOne').mockReturnValueOnce(company);
            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(null);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            const result = await joinRequestService.createJoinRequest({ dotNumber: company.dotNumber }, account);

            expect(result).toEqual(joinRequest);
        });
    });

    describe('createJoinRequest', () => {
        it('Throw error as account already has a company assigned', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            account.company = company;
            account.firstName = 'first name';
            account.lastName = 'last name';
            company.dotNumber = '123';
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(companyRepositoryMock, 'findOne').mockReturnValueOnce(company);
            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(null);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.createJoinRequest({ dotNumber: company.dotNumber }, account);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(BadRequestException);
            expect(thrownError.message).toEqual({
                error: 'Bad Request',
                message: `Account ${account.firstName} ${account.lastName} has already a company assigned`,
                statusCode: 400,
            });
        });
    });

    describe('createJoinRequest', () => {
        it('Throw error as company not found by dotNumber', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            account.company = null;
            account.firstName = 'first name';
            account.lastName = 'last name';
            company.dotNumber = '123';
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(companyRepositoryMock, 'findOne').mockReturnValueOnce(null);
            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(null);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.createJoinRequest({ dotNumber: company.dotNumber }, account);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(NotFoundException);
            expect(thrownError.message).toEqual({
                error: 'Not Found',
                message: `Company with dot number ${company.dotNumber} not found`,
                statusCode: 404,
            });
        });
    });

    describe('createJoinRequest', () => {
        it('Throw error as account already has an active join request created', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            account.company = null;
            account.firstName = 'first name';
            account.lastName = 'last name';
            company.dotNumber = '123';
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(companyRepositoryMock, 'findOne').mockReturnValueOnce(company);
            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.createJoinRequest({ dotNumber: company.dotNumber }, account);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(BadRequestException);
            expect(thrownError.message).toEqual({
                error: 'Bad Request',
                message: `Account ${account.firstName} ${account.lastName} has already a join request`,
                statusCode: 400,
            });
        });
    });

    describe('joinRequestAction', () => {
        it('Accept join request', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'accept';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(accountServiceMock, 'joinCompany')
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            await joinRequestService.joinRequestAction(joinRequest.id, action);
        });
    });

    describe('joinRequestAction', () => {
        it('Decline join request', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'decline';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            await joinRequestService.joinRequestAction(joinRequest.id, action);
        });
    });

    describe('joinRequestAction', () => {
        it('Cancel join request', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'cancel';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            await joinRequestService.joinRequestAction(joinRequest.id, action);
        });
    });

    describe('joinRequestAction', () => {
        it('Throw error join request not found', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'cancel';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(null);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.joinRequestAction(joinRequest.id, action);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(NotFoundException);
            expect(thrownError.message).toEqual({
                error: 'Not Found',
                message: `Join request ${joinRequest.id} not found`,
                statusCode: 404,
            });
        });
    });

    describe('joinRequestAction', () => {
        it('Throw error join request have no pending status (is not active)', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'cancel';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.ACCEPTED;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.joinRequestAction(joinRequest.id, action);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(BadRequestException);
            expect(thrownError.message).toEqual({
                error: 'Bad Request',
                message: `Join request ${joinRequest.id} has already been closed`,
                statusCode: 400,
            });
        });
    });

    describe('joinRequestAction', () => {
        it('Throw error invalid action', async () => {
            const account = new AccountEntity();
            const company = new CompanyEntity();
            const joinRequest = new JoinRequestEntity();

            const action = 'invalid action';
            company.dotNumber = '123';
            joinRequest.id = 1;
            joinRequest.account = account;
            joinRequest.status = JOIN_REQUEST_STATUS.PENDING;
            joinRequest.company = company;

            jest.spyOn(joinRequestRepositoryMock, 'findOne').mockReturnValueOnce(joinRequest);
            jest.spyOn(joinRequestRepositoryMock, 'save').mockReturnValueOnce(joinRequest);

            let thrownError = null;
            try {
                await joinRequestService.joinRequestAction(joinRequest.id, action);
            } catch (e) {
                thrownError = e;
            }

            expect(thrownError).toBeInstanceOf(BadRequestException);
            expect(thrownError.message).toEqual({
                error: 'Bad Request',
                message: `No action found for ${action}`,
                statusCode: 400,
            });
        });
    });
});
