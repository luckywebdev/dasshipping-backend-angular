import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as csvjson from 'csvjson';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import * as zipFolder from 'zip-folder';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { DRIVER_NOTIFICATION_ACTIONS, DRIVER_NOTIFICATION_TYPES, WEB_NOTIFICATION } from '../../dto/notification.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { AccountFilesEntity } from '../../entities/accountFiles.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { JOIN_REQUEST_STATUS, JoinRequestEntity } from '../../entities/joinRequest.entity';
import { NotificationStatus } from '../../entities/notification.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { MailMessage } from '../../mail/dto/mail.dto';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { JoinRequestRepository } from '../../repositories/joinRequests.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { GeneratePasswordHash } from '../../utils/crypto.utils';
import { checkExistsFile, fileSign } from '../../utils/fileSign.util';
import { ValidateStandartPassword, ValidateStrongPassword } from '../../utils/password.utils';
import { RandomString } from '../../utils/random.utils';
import { ReportsByUserRequestDTO } from '../company/dto/reports-by-user/request.dto';
import { GetReportsByUserResponse } from '../company/dto/reports-by-user/response.dto';
import { GetList } from '../dto/requestList.dto';
import { NotificationService } from '../notification/notification.service';
import { ApproveAccountsRequest } from './dto/approve/request.dto';
import { ApproveAccountsResponse } from './dto/approve/response.dto';
import { BlockAccountRequest } from './dto/blockAccount/request.dto';
import { BlockAccountResponse } from './dto/blockAccount/response.dto';
import { BlockAccountsRequest } from './dto/blockAccounts/request.dto';
import { DeleteAccountsRequest } from './dto/delete/request.dto';
import { DeleteAccountsResponse } from './dto/delete/response.dto';
import { AccountEditRequest } from './dto/edit/request.dto';
import { FileSignResponse } from './dto/file-sign/response.dto';
import { ForgotPasswordRequest } from './dto/forgot-password/request.dto';
import { ForgotPasswordResponse } from './dto/forgot-password/response.dto';
import { ACCOUNTS_ORDER_BY_FIELDS, GetAccountsListRequest } from './dto/list/request.dto';
import { GetAccountsListResponse } from './dto/list/response.dto';
import { PatchUserRequest } from './dto/patch/request.dto';
import { RequestAccountFilesDTO } from './dto/patch/requestAccountFiles.dto';
import { ResetPasswordRequest } from './dto/reset-password/request.dto';
import { ResetPasswordResponse } from './dto/reset-password/response.dto';
import { SaveSignatureRequest } from './dto/saveSignature.dto';
import { ValidateResetPasswordTokenRequest } from './dto/validate-reset-password-token/request.dto';
import { ValidateResetPasswordTokenResponse } from './dto/validate-reset-password-token/response.dto';

@Injectable()
export class AccountService {

    constructor(
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        @InjectRepository(ResetTokenEntity) private readonly resetTokenRepositry: Repository<ResetTokenEntity>,
        @InjectRepository(JoinRequestRepository) private readonly joinRequestRepository: JoinRequestRepository,
        @InjectRepository(AccountFilesEntity) private readonly accountFilesRepository: Repository<AccountFilesEntity>,
        @InjectRepository(NotificationRepository) private readonly notificationRepository: NotificationRepository,
        @InjectRepository(QuoteRepository) private readonly quoteRepository: QuoteRepository,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private notificationService: NotificationService,
    ) { }

    async approve(account: AccountEntity, data: ApproveAccountsRequest): Promise<ApproveAccountsResponse> {
        const query = account.roleId === ROLES.SUPER_ADMIN ? {} : { companyId: account.companyId };
        await this.accountRepository.update({
            id: In(data.ids),
            ...query,
        }, { approved: data.approved });
        return { success: true };
    }

    async blockAccounts(account: AccountEntity, data: BlockAccountsRequest): Promise<SuccessDTO> {
        const query = account.roleId === ROLES.SUPER_ADMIN ? {} : { companyId: account.companyId };

        const accounts = await this.accountRepository.find({ id: In(data.ids), ...query });

        const subject = data.blocked ? 'Block account' : 'Active account';
        const status = data.blocked ? 'blocked' : 'activated';

        accounts.forEach(async item => {
            const mail = await this.blockMail(item, { subject, status, reason: data.reason });
            await this.mailService.sendEmail(mail);
        });

        await this.accountRepository.update({
            id: In(data.ids),
            ...query,
        }, { blocked: data.blocked });
        return { success: true };
    }

    async delete(account: AccountEntity, data: DeleteAccountsRequest): Promise<DeleteAccountsResponse> {
        const query = account.roleId === ROLES.SUPER_ADMIN ? {} : { companyId: account.companyId };
        await this.accountRepository.update({
            id: In(data.ids),
            ...query,
        }, { deleted: data.deleted });
        return { success: true };
    }

    public async editMyProfile(account: AccountEntity, data: AccountEditRequest): Promise<AccountEntity> {
        if (data.password) {
            if (account.roleId === ROLES.SUPER_ADMIN || account.roleId === ROLES.COMPANY_ADMIN) {
                if (!ValidateStandartPassword(data.password)) {
                    throw new BadRequestException('Password is not enough strong');
                }
            } else {
                if (!ValidateStrongPassword(data.password)) {
                    throw new BadRequestException('Password is not enough strong');
                }
            }
            data.password = GeneratePasswordHash(data.password);
        }

        return await this.patch(data, account.id, account);
    }

    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        const { email } = data;
        const account = await this.accountRepository.findOne({ email });
        if (!account) {
            throw new BadRequestException('Account was not found.');
        }

        const hash = RandomString(36);
        await this.resetTokenRepositry.insert({
            token: hash,
            expire: moment().add(2, 'hours').toDate(),
            accountId: account.id,
        });

        try {
            const mail = await this.forgotMail(hash, account);
            await this.mailService.sendEmail(mail);
            return { success: true };
        } catch (e) {
            throw new InternalServerErrorException('Error at sending email.');
        }
    }

    async getAccount(id: number, query: any = {}): Promise<AccountEntity> {
        const user = await this.accountRepository.getAccount(id, query);

        if (!user) {
            throw new NotFoundException(`Account ${id} not found`);
        }

        return { ...user, signatureUrl: fileSign(user.signatureUrl) };
    }

    async getAccountsList(account: AccountEntity, query: GetAccountsListRequest): Promise<GetAccountsListResponse> {
        let companyId = null;
        if (account.roleId !== ROLES.SUPER_ADMIN) {
            companyId = account.companyId;
        }
        let orderByField = 'account.id';

        if (query.orderByField) {
            switch (query.orderByField) {
                case ACCOUNTS_ORDER_BY_FIELDS.BLOCKED:
                    orderByField = 'account.blocked';
                    break;
                case ACCOUNTS_ORDER_BY_FIELDS.FULL_NAME:
                    orderByField = 'account.firstName';
                    break;
                case ACCOUNTS_ORDER_BY_FIELDS.ROLE:
                    orderByField = 'account.role';
                    break;
            }
        }
        query.orderByField = orderByField;

        return await this.accountRepository.getAccountsList(account, query, companyId);
    }

    public async getMyProfile(account: AccountEntity | any): Promise<AccountDTO> {
        account.signatureUrl = fileSign(account.signatureUrl);
        if (account.roleId === ROLES.CLIENT) {
            account.notificationsCount = await this.notificationRepository.getCount({
                targetUserId: account.id,
                status: NotificationStatus.ACTIVE,
            });
            account.quotes = await this.quoteRepository.getVisibleCount({
                createdById: account.id,
                createdAt: MoreThanOrEqual(moment().subtract(72, 'hours')),
            });
        }
        if ([ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER].includes(account.roleId)) {
            account.notificationOrders = await this.notificationRepository.getCount({
                targetUserId: account.id,
                status: NotificationStatus.ACTIVE,
                orderId: Not(IsNull()),
                type: WEB_NOTIFICATION.ORDER,
            });
        }
        if ([ROLES.SUPER_ADMIN].includes(account.roleId)) {
            account.notificationCompanies = await this.notificationRepository.getCountNotifyCompany({
                targetUserId: account.id,
                type: WEB_NOTIFICATION.CARRIER,
                status: NotificationStatus.ACTIVE,
            });
            account.notificationQuotes = await this.notificationRepository.getCount({
                targetUserId: account.id,
                status: NotificationStatus.ACTIVE,
                quoteId: Not(IsNull()),
                type: WEB_NOTIFICATION.QUOTE,
            });
        }

        if ([ROLES.COMPANY_ADMIN].includes(account.roleId)) {
            account.notificationUsers = await this.notificationRepository.getCountNotifyUsers({
                targetUserId: account.id,
                type: WEB_NOTIFICATION.USER,
                status: NotificationStatus.ACTIVE,
            });
        }
        return account;
    }

    public getDispatcherProfile(account: AccountEntity): Promise<AccountEntity> {
        return this.accountRepository.findOne({ id: account.dispatcherId }, { relations: ['languages'] });
    }

    public async patch(data: PatchUserRequest, userId: number, query?: any): Promise<AccountEntity> {
        let editAccount = await this.getAccount(userId, query);
        if (ROLES.DRIVER === editAccount.roleId && data.files) {
            await this.saveAccountFiles(userId, data.files);
            editAccount = await this.getAccount(userId, query);
        }

        if (![ROLES.DISPATCHER, ROLES.DRIVER].includes(editAccount.roleId) && data.payRate) {
            delete data.payRate;
        }

        delete data.files;
        delete editAccount.gender;
        if (editAccount.signatureUrl && editAccount.signatureUrl.includes('http')) {
            delete editAccount.signatureUrl;
        }
        const updatedProfile = await this.accountRepository.save({ ...editAccount, ...data });
        updatedProfile.avatarUrl = fileSign(updatedProfile.avatarUrl);

        return updatedProfile;
    }

    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        const { password, hash } = data;
        const token = await this.resetTokenRepositry.createQueryBuilder('resetToken')
            .leftJoinAndSelect('resetToken.account', 'account')
            .where({ token: hash, used: false })
            .getOne();

        if (!token) {
            throw new BadRequestException('Token was not found');
        }

        const accountRole = token.account.roleId;
        const validationMethod = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN].includes(accountRole) ? ValidateStrongPassword : ValidateStandartPassword;

        if (!validationMethod(password)) {
            throw new BadRequestException('Password is not strong enough');
        }

        await this.accountRepository.update(token.accountId, { password: GeneratePasswordHash(password) });
        await this.resetTokenRepositry.update(token.id, { used: true });
        return { success: true };
    }

    async getFileSign(filename: string): Promise<FileSignResponse> {
        try {
            await checkExistsFile(filename);
        } catch (err) {
            throw new BadRequestException('This file was not found');
        }
        const url = fileSign(filename, this.configService.accessTokenExpiresInFile);
        return { url, filename };
    }

    async resetPasswordRedirect(data: ValidateResetPasswordTokenRequest) {
        let roleId;
        let url = `${this.configService.domain}/reset-password/${data.hash}`;
        let androidId = null;
        let iosId = null;
        try {
            const tokenValidationData = await this.validateResetPasswordToken(data);
            roleId = tokenValidationData.roleId;
            if (roleId === ROLES.DRIVER) {
                url = `${this.configService.appSchemaDriver}://reset-password?hash=${data.hash}`;
            }
            if (roleId === ROLES.CLIENT) {
                url = `${this.configService.appSchemaClient}://reset-password?hash=${data.hash}`;
            }
            androidId = roleId === ROLES.DRIVER ? this.configService.appAndroidDriver : this.configService.appAndroidClient;
            iosId = roleId === ROLES.DRIVER ? this.configService.appIosDriver : this.configService.appIosClient;
        } catch (err) {
            return { url, fallback: this.configService.domain, androidId, iosLink: iosId ? `https://itunes.apple.com/app/${iosId}` : null };
        }
        return { url, fallback: this.configService.domain, androidId, iosLink: iosId ? `https://itunes.apple.com/app/${iosId}` : null };
    }

    async validateResetPasswordToken(data: ValidateResetPasswordTokenRequest): Promise<ValidateResetPasswordTokenResponse> {
        const token = await this.resetTokenRepositry
            .createQueryBuilder('resetToken')
            .leftJoinAndSelect('resetToken.account', 'account')
            .where({ token: data.hash, used: false })
            .getOne();
        if (!token) {
            throw new BadRequestException('Token was not found');
        }

        if (moment(token.expire).isBefore(moment())) {
            throw new BadRequestException('Hash is expired');
        }

        return {
            success: true,
            roleId: token.account.roleId,
        };
    }

    private async blockMail(account: AccountEntity, data: { subject: string, status: string, reason?: string }): Promise<MailMessage> {
        const { firstName, lastName, email } = account;
        const { subject, status, reason } = data;

        const html = await this.mailService.blockAccountTemplate({
            firstName,
            lastName,
            reason: reason && reason.length ? `Reason: ${reason}` : '',
            status,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: email,
            subject,
            html,
        };
    }

    private async forgotMail(hash: string, account: AccountEntity): Promise<MailMessage> {
        const { firstName, lastName, email } = account;

        const url = `${this.configService.domain}/reset-password/${hash}`;

        const html = await this.mailService.resetPasswordTemplate({
            url,
            firstName,
            lastName,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: email,
            subject: 'Reset password',
            html,
        };
    }

    public async kickOut(companyId: number, id: number): Promise<void> {
        const account = await this.accountRepository.getAccount(id, { companyId });
        await this.leaveCompany(account);
        await this.notificationService.create({
            type: DRIVER_NOTIFICATION_TYPES.KICK_OFF,
            actions: [],
            title: `Account update`,
            content: `Carrier ${account.company.name} removed you from their fleet`,
            targetUserId: account.id,
        });
    }

    public async leaveCompany(account: AccountEntity): Promise<void> {
        if (!account.company) {
            throw new BadRequestException(`Account ${account.firstName} ${account.lastName} is not associated to any company`);
        }
        await this.accountRepository.update(account.id, { company: null, dispatcherId: null });
    }

    public async joinCompany(account: AccountEntity, companyEntity: CompanyEntity): Promise<void> {
        await this.accountRepository.update(account.id, { company: companyEntity });
    }

    public async getActiveJoinedRequest(account: AccountEntity): Promise<JoinRequestEntity> {
        return await this.joinRequestRepository.findOne({ account, status: JOIN_REQUEST_STATUS.PENDING }, { relations: ['company'] });
    }

    public async linkDriverToDispatcher(
        account: AccountEntity,
        dispatcherId: number,
        driverId: number, linkOrUnlink: boolean, query: any = {}): Promise<any> {
        const dispatcher = await this.accountRepository.findOne({ id: dispatcherId, roleId: ROLES.DISPATCHER, ...query.where });
        if (!dispatcher) {
            throw new NotFoundException(`Dispatcher ${dispatcherId} not found`);
        }
        const driver = await this.accountRepository.findOne({ id: driverId, roleId: ROLES.DRIVER, ...query.where });
        if (!driver) {
            throw new NotFoundException(`Driver ${driverId} not found`);
        }

        if (driver.dispatcherId && linkOrUnlink && driver.dispatcherId === dispatcher.id) {
            throw new BadRequestException(`Driver ${driverId} was linked to dispatcher ${dispatcherId}`);
        }

        driver.dispatcherId = null;
        let outputMessage = 'unlinked';
        let notificationMessage = `Dispatcher ${dispatcher.firstName} ${dispatcher.lastName} was unassigned from you`;
        if (linkOrUnlink) {
            driver.dispatcherId = dispatcher.id;
            outputMessage = 'linked';
            notificationMessage = `Dispatcher ${dispatcher.firstName} ${dispatcher.lastName} was assigned to you`;
        }
        await this.accountRepository.update(driver.id, driver);

        await this.notificationService.create({
            type: DRIVER_NOTIFICATION_TYPES.LINKED_TO_DISPATCHER,
            actions: [DRIVER_NOTIFICATION_ACTIONS.GO_TO_PROFILE],
            title: `Account update`,
            content: notificationMessage,
            targetUserId: driverId,
        });
        return {
            status: 'success',
            message: outputMessage,
        };
    }

    public async getDispatcherDrivers(dispatcherId: number, query: GetList): Promise<GetAccountsListResponse> {
        const dispatcher = await this.accountRepository.findOne({ id: dispatcherId, roleId: ROLES.DISPATCHER, ...query.where });
        if (!dispatcher) {
            throw new NotFoundException(`Dispatcher ${dispatcherId} not found`);
        }
        return await this.accountRepository.getDriversForDispatcher(dispatcher, query);
    }

    protected async saveAccountFiles(userId: number, files: RequestAccountFilesDTO[]): Promise<void> {
        const existingAccountFiles = await this.accountFilesRepository.find({ accountId: userId });
        const filesToDelete = existingAccountFiles
            .filter(file => !files
                .filter(dataFile => dataFile.hasOwnProperty('id'))
                .map(dataF => dataF.id).includes(file.id));
        const filesToAdd = files.filter(file => !file.hasOwnProperty('id'))
            .map(file => {
                return {
                    path: file.path ? file.path : fileSign(file.displayName),
                    displayName: file.displayName,
                    accountId: userId,
                };
            });
        await this.accountFilesRepository.remove(filesToDelete);
        await this.accountFilesRepository.save(filesToAdd);
    }

    public async blockAccount(accountId: number, data: BlockAccountRequest, query: any = {}): Promise<BlockAccountResponse> {
        const account = await this.accountRepository.findOne({ id: accountId, ...query.where });
        if (!account) {
            throw new NotFoundException(`Account ${accountId} not found`);
        }
        const { blocked, reason } = data;
        const subject = data.blocked ? 'Block account' : 'Active account';
        const status = data.blocked ? 'blocked' : 'activated';
        const mail = await this.blockMail(account, { subject, reason, status });
        await this.mailService.sendEmail(mail);

        await this.accountRepository.update({
            id: accountId,
        }, { blocked });

        return {
            success: true,
            message: `Account ${accountId} was successfully ${status}`,
        };
    }

    public async getDriversLastLocation(query: any): Promise<AccountEntity[]> {
        return await this.accountRepository.getAccountsLastLocation(query);
    }

    public async saveSignature(account: AccountEntity, signatureData: SaveSignatureRequest): Promise<SuccessDTO> {
        await this.accountRepository.update(account.id, { signatureUrl: signatureData.signatureUrl });

        return { success: true };
    }

    public async getByUserReport(query: ReportsByUserRequestDTO): Promise<GetReportsByUserResponse> {
        return await this.accountRepository.getByUserReport(query);
    }

    public async dowloadReportsByUser(email: string, filter: ReportsByUserRequestDTO): Promise<SuccessDTO> {
        this.dowloadReportsCsv(email, filter);
        return { success: true };
    }

    private async dowloadReportsCsv(email: string, filter: ReportsByUserRequestDTO): Promise<SuccessDTO> {
        let roles = [ROLES.DISPATCHER, ROLES.DRIVER];
        if (filter.role) {
            roles = [filter.role];
        }
        const count = await this.accountRepository.getCount(filter.where, roles);
        filter = { ...filter, limit: count };
        const data = await this.accountRepository.getByUserReport(filter);
        const reports = data.data.map((item) => {
            return {
                userName: `${item.firstName} ${item.lastName}`,
                payRate: item.payRate ? `${item.payRate}%` : '0%',
                grossRevenue: `$${item.grossRevenue.toFixed(2)}`,
                toPay: `$${item.toPay.toFixed(2)}`,
            };
        });
        const folderPath = path.join(__dirname, `../../../upload/company-${moment().unix()}`);

        try {
            const resp = csvjson.toCSV(reports, {
                headers: 'relative',
            });
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            fs.writeFileSync(`${folderPath}/reports.csv`, resp);
            await this.createZip(folderPath);
            const dataBuffer = fs.readFileSync(`${folderPath}.zip`);
            await this.mailService.sendEmail({
                from: `no-reply@${this.configService.email.domain}`,
                to: email,
                subject: `Reports by user`,
                html: `Hello, See the reports by user`,
                attachment: [{ fileName: `Reports.zip`, data: dataBuffer }],
            });
            rimraf.sync(folderPath);
            fs.unlinkSync(`${folderPath}.zip`);
            return { success: true };
        } catch (e) {
            throw new BadRequestException(`Send Reports Error: ${e.message || e}`);
        }
    }

    private async createZip(folderName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            zipFolder(folderName, `${folderName}.zip`, (err) => {
                if (err) {
                    return reject();
                } else {
                    return resolve();
                }
            });
        });
    }
}
