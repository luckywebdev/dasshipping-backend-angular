import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import { path } from 'ramda';
import * as randomstring from 'randomstring';
import { In, IsNull, LessThan, Repository, Transaction, TransactionRepository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { IMAGES_MODEL } from '../../constants/carLogos.constant';
import { CONTACT_INFO } from '../../constants/contactInfo.constant';
import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { InviteDTO } from '../../dto/invite.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { COMPANY_STATUSES, CompanyEntity } from '../../entities/company.entity';
import { EmailConfirmCodeEntity } from '../../entities/emailConfirmCode.entity';
import { InviteEntity } from '../../entities/invite.entity';
import { INVITE_STATUS } from '../../entities/inviteStatus.entity';
import { CLIENT_PAYMENT_STATUSES, OrderEntity } from '../../entities/order.entity';
import { ORDER_STATUS, QUOTE_STATUS } from '../../entities/orderBase.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { RoleEntity } from '../../entities/role.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { MailMessage } from '../../mail/dto/mail.dto';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { CompanyRepository } from '../../repositories/company.repository';
import { EmailConfrimCodeRepository } from '../../repositories/emailConfirm.repository';
import { InviteRepository } from '../../repositories/invite.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { GeneratePasswordHash } from '../../utils/crypto.utils';
import { ValidateStandartPassword } from '../../utils/password.utils';
import { RandomString } from '../../utils/random.utils';
import { AuthService } from '../auth/auth.service';
import { LoginResponse } from '../auth/dto/login/response.dto';
import { AppEventEmitter } from '../event/app.events';
import { GetAccountInvitesListRequest } from './dto/account-invite-list/request.dto';
import { GetAccountInvitesListResponse } from './dto/account-invite-list/response.dto';
import { AccountInviteRequest } from './dto/account-invite/request.dto';
import { CarrierEditRegisterRequest } from './dto/carrier-changes/request.dto';
import { CarrierInviteRequest } from './dto/carrier-invite/request.dto';
import { CarrierNewRegisterRequest } from './dto/carrier-new-register/request.dto';
import { CarrierNewRegisterResponse } from './dto/carrier-new-register/response.dto';
import { CarrierRegisterRequest } from './dto/carrier-register/request.dto';
import { CarrierRegisterResponse } from './dto/carrier-register/response.dto';
import { ClientRegisterRequest } from './dto/client-register/request.dto';
import { CommonRegisterRequest } from './dto/common-register/request.dto';
import { CommonRegisterResponse } from './dto/common-register/response.dto';
import { GetCompanyInvitesListRequest } from './dto/company-invite-list/request.dto';
import { GetCompanyInvitesListResponse } from './dto/company-invite-list/response.dto';
import { DeclineAccountInviteRequest } from './dto/decline-account-invite/request.dto';
import { DeclineAccountInviteResponse } from './dto/decline-account-invite/response.dto';
import { DeclineCarrierInviteRequest } from './dto/decline-carrier-invite/request.dto';
import { DeclineCarrierInviteResponse } from './dto/decline-carrier-invite/response.dto';
import { DriverRegisterRequest } from './dto/driver-register/request.dto';
import { EmailConfirmRedirect } from './dto/email-confirm-redirect/request.dto';
import { ExpireInviteRequest } from './dto/expire-invite/request.dto';
import { ExpireInviteResponse } from './dto/expire-invite/response.dto';
import { InviteRequestChangesRequest } from './dto/invite-request-changes/request.dto';
import { InviteRequestChangesResponse } from './dto/invite-request-changes/response.dto';
import { RegisterRedirect } from './dto/register-redirect/request.dto';
import { ResendConfirmationCodeRequest } from './dto/resend-confirmation-code/request.dto';
import { ResendInviteRequest } from './dto/resend-invite/request.dto';
import { ResendInviteResponse } from './dto/resend-invite/response.dto';
import { ValidateConfirmationCodeRequest } from './dto/validate-confirmation-code/request.dto';
import { ValidateTokenRequest } from './dto/validate-token/request.dto';
import { ValidateTokenResponse } from './dto/validate-token/response.dto';
import { TransactionService } from '../transaction/transaction.service';
import { GeneralEntity } from '../../entities/general.entity';
import { CLIENT_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { DISPATCH_STATUS } from '../../entities/dispatch.entity';
import { DispatchRepository } from '../../repositories/dispatch.repository';
import { GetInviteRequest } from './dto/carrier-invite/get-invite.dto';

@Injectable()
export class RegisterService {
    constructor(
        @InjectRepository(InviteRepository)
        private readonly inviteRepository: InviteRepository,
        @InjectRepository(QuoteRepository)
        private readonly quoteRepository: QuoteRepository,
        @InjectRepository(OrderRepository)
        private readonly orderRepository: OrderRepository,
        @InjectRepository(EmailConfrimCodeRepository)
        private readonly emailConfirmCodeRepository: EmailConfrimCodeRepository,
        @InjectRepository(AccountEntity)
        private readonly accountRepository: Repository<AccountEntity>,
        @InjectRepository(CompanyEntity)
        private readonly companyRepository: Repository<CompanyEntity>,
        @InjectRepository(DispatchRepository)
        private readonly dispatchRepository: DispatchRepository,
        @InjectRepository(VirtualAccountEntity)
        private readonly virtualAccountRepository: Repository<VirtualAccountEntity>,
        @InjectRepository(ResetTokenEntity)
        private readonly resetTokenRepositry: Repository<ResetTokenEntity>,
        @InjectRepository(RoleEntity)
        private readonly roleRepository: Repository<RoleEntity>,
        @InjectRepository(GeneralEntity)
        private readonly generalRepository: Repository<GeneralEntity>,
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private readonly mailService: MailService,
        private readonly transactionService: TransactionService,
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    ) {
    }

    async carrier(
        data: CarrierRegisterRequest,
    ): Promise<CarrierRegisterResponse> {
        const invite = await this.validateInvite(data.hash, true);

        const company = await this.companyRepository.findOne(invite.companyId);

        const updatedCompany = {
            ...company,
            ...data,
            status: COMPANY_STATUSES.REQUESTED,
        };
        delete updatedCompany.hash;
        delete updatedCompany.termsOfServiceAccepted;
        await this.companyRepository.update(invite.companyId, updatedCompany);

        const newAccount = await this.accountRepository.insert({
            email: invite.email,
            roleId: ROLES.COMPANY_ADMIN,
            companyId: company.id,
            password: GeneratePasswordHash(RandomString()),
            firstName: invite.firstName,
            lastName: invite.lastName,
        });
        const account: AccountEntity = path(['identifiers', '0'], newAccount);

        await this.inviteRepository.update(invite.id, {
            statusId: INVITE_STATUS.ACCEPTED,
        });
        const hash = RandomString(36);
        await this.resetTokenRepositry.insert({
            token: hash,
            expire: moment()
                .add(2, 'hours')
                .toDate(),
            accountId: account.id,
        });

        if (invite.orderId) {
            this.changeOrder(invite.orderId, company.id, account.id);
        }

        if (invite.companyId) {
            this.emitter.emit('notification_admin', { companyId: invite.companyId });
        }

        return { success: true, hash };
    }

    private async changeOrder(orderId: number, companyId: number, accountId: number): Promise<void> {
        const order = await this.orderRepository.findOne({ id: orderId, companyId: IsNull() });
        if (order) {
            const general = await this.generalRepository.findOne();
            const { serviceAbsoluteFee } = general;
            if (CLIENT_PAYMENT_STATUSES.SERVICE_FEE_PAID !== order.clientPaymentStatus) {
                try {
                    await this.transactionService.charge(
                        { ...order, companyId },
                        serviceAbsoluteFee,
                    );
                } catch (e) {
                    await this.orderRepository.update(order.id, {
                        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.SERVICE_FEE_FAILED,
                        published: true,
                    });
                    const pickDate = new Date();
                    const deliveryDate = new Date().getTime() + (86400000 * 7);

                    await this.dispatchRepository.save({
                        accountId,
                        pickDate,
                        deliveryDate: new Date(deliveryDate),
                        companyId,
                        orderId: order.id,
                        status: DISPATCH_STATUS.NEW,
                    });

                    await this.accountRepository.update(order.createdById, { paymentFailed: true });
                    this.emitter.emit('notification', {
                        type: CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_FAILED,
                        actions: [],
                        title: `Order payment fails`,
                        content: `Deposit fee for order #${order.uuid} FAILED, reason ${e && e.message ? e.message : e}`,
                        additionalInfo: order.uuid,
                        targetUserId: order.createdById,
                    });
                    return;
                }
            }
            await this.orderRepository.update(order.id, {
                clientPaymentStatus: CLIENT_PAYMENT_STATUSES.SERVICE_FEE_PAID,
                companyId,
                published: true,
                status: ORDER_STATUS.DISPATCHED,
            });
        }
    }

    public async checkExpiredInvitation(): Promise<void> {
        const invitations = await this.inviteRepository.find({
            expire: LessThan(new Date()),
            statusId: INVITE_STATUS.PENDING,
        });

        if (invitations && invitations.length) {
            const invitationIds = invitations.map(item => item.id);
            await this.inviteRepository.update(invitationIds, { statusId: INVITE_STATUS.EXPIRED });
            const orderIds = invitations.map(item => item.orderId).filter(orderId => orderId);
            if (orderIds && orderIds.length) {
                await this.orderRepository.update(orderIds, { published: true });
            }
            invitations.forEach(invite => {
                if (invite.roleId === ROLES.COMPANY_ADMIN) {
                    this.emitter.emit('notification_admin', { inviteId: invite.id });
                }

                if ([ROLES.DISPATCHER, ROLES.DRIVER].includes(invite.roleId)) {
                    this.emitter.emit('notification_account', { companyId: invite.companyId, inviteId: invite.id });
                }
            });
        }
    }

    @Transaction()
    async carrierNew(
        data: CarrierNewRegisterRequest,
        @TransactionRepository(CompanyRepository) companyRepository?: CompanyRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
        @TransactionRepository(ResetTokenEntity) resetTokenRepository?: Repository<ResetTokenEntity>,
    ): Promise<CarrierNewRegisterResponse> {
        await this.validateEmailExistance({ email: data.email });
        const company = await companyRepository.findOne({
            where: [{ msNumber: data.msNumber }, { dotNumber: data.dotNumber }],
        });

        if (company) {
            throw new BadRequestException('This carrier already exist.');
        }

        const newCompany = await companyRepository.insert(data);

        const account = await accountRepository.insert({
            email: data.email,
            roleId: ROLES.COMPANY_ADMIN,
            companyId: newCompany.identifiers[0].id,
            password: GeneratePasswordHash(RandomString()),
            firstName: data.contactPersonFirstName,
            lastName: data.contactPersonLastName,
            termsOfServiceAccepted: data.termsOfServiceAccepted,
        });

        const hash = RandomString(36);
        await resetTokenRepository.insert({
            token: hash,
            expire: moment()
                .add(2, 'hours')
                .toDate(),
            accountId: account.identifiers[0].id,
        });

        return { success: true, hash };
    }

    async client(data: ClientRegisterRequest): Promise<AccountDTO> {
        if (!ValidateStandartPassword(data.password)) {
            throw new BadRequestException('Password is not enough strong');
        }

        await this.validateEmailExistance({ email: data.email });
        const newAccount = await this.accountRepository.save({
            ...data,
            password: GeneratePasswordHash(data.password),
            roleId: ROLES.CLIENT,
            approved: true,
        });

        const virtualAccount = await this.virtualAccountRepository.findOne({
            email: data.email,
        });

        if (virtualAccount) {
            const leads = await this.quoteRepository.find({
                customerId: virtualAccount.id,
            });
            const leadsIds = leads.map(lead => lead.id);
            await this.quoteRepository.update(
                { id: In(leadsIds) },
                {
                    createdById: newAccount.id,
                    status: QUOTE_STATUS.NEW,
                    customerId: null,
                },
            );
            // TODO this might fail
            await this.virtualAccountRepository.delete(virtualAccount);
        }
        await this.sendEmailConfirmCodeEmail(newAccount);

        delete newAccount.password;
        return newAccount;
    }

    @Transaction()
    async common(
        data: CommonRegisterRequest,
        @TransactionRepository(InviteRepository) inviteRepository?: InviteRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
    ): Promise<CommonRegisterResponse> {
        const invite = await this.validateInvite(data.hash, false);
        await this.validateEmailExistance({ email: invite.email });

        const account = data;
        delete account.hash;

        if (!ValidateStandartPassword(account.password)) {
            throw new BadRequestException('Password is not enough strong');
        }

        await inviteRepository.update(invite.id, {
            statusId: INVITE_STATUS.ACCEPTED,
        });

        const { companyId, roleId, email, firstName, lastName } = invite;
        let dataAccount: any = {
            ...data,
            firstName,
            lastName,
            email,
            password: GeneratePasswordHash(account.password),
            companyId,
            roleId,
        };

        if (roleId === ROLES.DISPATCHER) {
            dataAccount = { ...dataAccount, approved: true };
        }

        const newAccount = await accountRepository.insert(dataAccount);

        if ([ROLES.DISPATCHER, ROLES.DRIVER].includes(invite.roleId)) {
            const accountId: number = path(['identifiers', '0', 'id'], newAccount);
            this.emitter.emit('notification_account', { companyId, accountId });
        }

        return { success: true };
    }

    async declineInviteAccount(
        data: DeclineAccountInviteRequest,
        carrier: boolean = false,
    ): Promise<DeclineAccountInviteResponse> {
        const invite = await this.validateInvite(data.hash, carrier);

        await this.inviteRepository.update(invite.id, {
            statusId: INVITE_STATUS.DECLINED,
        });
        if (invite.orderId) {
            this.orderRepository.update(invite.orderId, { published: true });
        }

        if (invite.roleId === ROLES.COMPANY_ADMIN) {
            this.emitter.emit('notification_admin', { inviteId: invite.id });
        }

        if ([ROLES.DISPATCHER, ROLES.DRIVER].includes(invite.roleId)) {
            this.emitter.emit('notification_account', { companyId: invite.companyId, inviteId: invite.id });
        }

        return { success: true };
    }

    async declineInviteCarrier(
        data: DeclineCarrierInviteRequest,
    ): Promise<DeclineCarrierInviteResponse> {
        const invite = await this.validateInvite(data.hash, true);

        await this.inviteRepository.update(invite.id, {
            statusId: INVITE_STATUS.DECLINED,
        });
        return { success: true };
    }

    @Transaction()
    async driver(
        data: DriverRegisterRequest,
        @TransactionRepository(InviteRepository) inviteRepository?: InviteRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
        @TransactionRepository(EmailConfrimCodeRepository) emailConfirmCodeRepository?: EmailConfrimCodeRepository,
    ): Promise<AccountDTO> {
        if (!ValidateStandartPassword(data.password)) {
            throw new BadRequestException('Password is not enough strong');
        }

        let payload = {
            ...data,
            password: GeneratePasswordHash(data.password),
            roleId: ROLES.DRIVER,
            companyId: null,
            email: data.email,
            emailConfirmed: false,
            approved: false,
            termsOfServiceAccepted: true,
        };
        await this.validateEmailExistance({ email: payload.email });

        if (data.hash) {
            const invite = await this.validateInvite(data.hash, false);

            if (payload.email !== invite.email) {
                throw new BadRequestException(
                    'The provided email and invitation email are different',
                );
            }

            await inviteRepository.update(invite.id, {
                statusId: INVITE_STATUS.ACCEPTED,
            });

            const { companyId, roleId, email } = invite;

            payload = {
                ...payload,
                companyId,
                roleId,
                email,
                emailConfirmed: true,
                approved: true,
            };
        }

        const driverAccount = await accountRepository.save(payload);

        if (!payload.emailConfirmed) {
            await this.sendEmailConfirmCodeEmail(driverAccount, emailConfirmCodeRepository);
        }
        return driverAccount;
    }

    async expireInvite(
        data: ExpireInviteRequest,
        account: AccountEntity,
    ): Promise<ExpireInviteResponse> {
        const query =
            account.roleId === ROLES.SUPER_ADMIN
                ? {}
                : { companyId: account.companyId };
        await this.inviteRepository.update(
            { id: In(data.ids), ...query },
            { expire: moment().toDate() },
        );
        await this.checkExpiredInvitation();
        return { success: true };
    }

    async retrieveInvite(id: number): Promise<SuccessDTO> {
        const invite = await this.inviteRepository.findOne({ id, statusId: INVITE_STATUS.PENDING });
        if (!invite) {
            throw new BadRequestException('Invite was not found');
        }
        await this.inviteRepository.update(invite.id, {
            expire: moment().toDate(),
            statusId: INVITE_STATUS.EXPIRED,
        });
        if (invite.orderId) {
            await this.orderRepository.update(invite.orderId, { published: true });
        }
        return { success: true };
    }

    public async getAccountInvitesList(
        account: AccountEntity,
        query: GetAccountInvitesListRequest,
        extended: boolean = false,
    ): Promise<GetAccountInvitesListResponse> {
        return await this.inviteRepository.getInviteList(account, query, extended);
    }

    public async getInvite(query: GetInviteRequest): Promise<InviteDTO> {
        try {
            const invite = await this.inviteRepository.getInvite({
                statusId: INVITE_STATUS.PENDING,
                roleId: ROLES.COMPANY_ADMIN,
            }, {
                msNumber: query.msNumber,
                dotNumber: query.dotNumber,
            });
            return invite;
        } catch (e) {
            return;
        }
    }

    public getCompanyInviteList(
        account: AccountEntity,
        query: GetCompanyInvitesListRequest,
    ): Promise<GetCompanyInvitesListResponse> {
        return this.getAccountInvitesList(account, query, true);
    }

    async inviteAccount(
        data: AccountInviteRequest,
        account: AccountEntity,
    ): Promise<InviteDTO> {
        await this.validateEmailExistance({ email: data.email });

        const hash = RandomString(36);

        try {
            const company = await this.companyRepository.findOne(account.companyId);
            const mail = await this.inviteAccountEmail(data, company, hash);
            await this.mailService.sendEmail(mail);
            const invite = await this.inviteRepository.save({
                email: data.email,
                companyId: account.companyId,
                roleId: data.roleId,
                hash,
                expire: moment()
                    .add(3, 'days')
                    .toDate(),
                firstName: data.firstName,
                lastName: data.lastName,
                createdById: account.id,
            });
            return await this.inviteRepository.getInvite({ id: invite.id });
        } catch (e) {
            throw new BadRequestException('Error at sending email.');
        }
    }

    private async inviteCarrierWithOffer(
        data: CarrierInviteRequest | CompanyEntity,
        hash: string,
        order: OrderEntity,
    ): Promise<MailMessage> {
        const cars = order.cars.map(item => {
            const logo = IMAGES_MODEL.find((img) => item.make && img.name.toLowerCase() === item.make.toLowerCase());
            return {
                ...item,
                logo: logo ? logo.url : `${this.configService.apiDomain}/images/make_dafault.png`,
            };
        });
        const html = await this.mailService.carrierInvitationTemplateOrder({
            acceptUrl: `${this.configService.domain}/register-carrier/${hash}`,
            denyUrl: `${this.configService.domain}/register-carrier-decline/${hash}`,
            domain: this.configService.apiDomain,
            firstName: data.contactPersonFirstName,
            lastName: data.contactPersonLastName,
            companyName: data.name,
            orderUuid: order.uuid,
            cars,
            contactInfo: CONTACT_INFO,
            pickDate: moment(order.pickDate).format('MMM D'),
            deliveryDate: moment(order.deliveryDate).format('MMM D'),
            pickupLocation: `${order.pickLocation.city} ${order.pickLocation.state}`,
            deliveryLocation: `${order.deliveryLocation.city} ${order.deliveryLocation.state}`,
            distance: order.distance.toFixed(0),
            price: order.salePrice.toFixed(),
            condition: order.trailerType.toLocaleUpperCase(),
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: data.email,
            subject: 'Carrier registration',
            html,
        };
    }

    @Transaction()
    async inviteCarrier(
        data: CarrierInviteRequest,
        account: AccountEntity,
        @TransactionRepository(CompanyRepository) companyRepository?: CompanyRepository,
        @TransactionRepository(InviteRepository) inviteRepository?: InviteRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
        @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    ): Promise<InviteDTO> {
        const invitation = await inviteRepository.getInvite({
            statusId: INVITE_STATUS.PENDING,
            roleId: ROLES.COMPANY_ADMIN,
        }, {
            msNumber: data.msNumber,
            dotNumber: data.dotNumber,
        });

        if (!invitation) {
            await this.validateEmailExistance({ email: data.email, approved: true });
        }

        const company = await companyRepository.findOne({
            status: In([COMPANY_STATUSES.ACTIVE, COMPANY_STATUSES.REQUESTED]),
            msNumber: data.msNumber, dotNumber: data.dotNumber,
        });

        if (company && !invitation) {
            throw new BadRequestException('This carrier already exist.');
        }

        let order: OrderEntity;
        if (data.orderId) {
            const invitationDispatch = await inviteRepository.findOne({
                orderId: data.orderId,
                statusId: In([INVITE_STATUS.PENDING]),
            });

            if (invitationDispatch) {
                throw new BadRequestException('This order already invited.');
            }

            order = await orderRepository.getOrder(
                data.orderId,
                ['pickLocation', 'deliveryLocation', 'cars'],
                { where: { status: ORDER_STATUS.PUBLISHED, companyId: IsNull(), published: true } });
            if (!order) {
                throw new BadRequestException('This order already assigned.');
            }
        }

        let companyDetails;
        const companyData = {
            ...data,
        };

        delete companyData.orderId;
        if (invitation) {
            inviteRepository.update(
                { id: invitation.id },
                { expire: moment().toDate(), statusId: INVITE_STATUS.EXPIRED },
            );
            companyDetails = invitation.company;
            await companyRepository.update(invitation.companyId, {
                ...companyData,
                status: COMPANY_STATUSES.INVITED,
            });

            if (invitation.orderId) {
                await orderRepository.update(invitation.orderId, { published: true });
            }
        } else {
            const newCompany = await companyRepository.insert({
                ...companyData,
                status: COMPANY_STATUSES.INVITED,
            });

            companyDetails = path(['identifiers', '0'], newCompany);
        }

        const expire = data.orderId ? moment().add(1, 'hours').toDate() : moment().add(3, 'days').toDate();
        const hash = RandomString(36);
        const invite = await inviteRepository.save({
            email: data.email,
            companyId: companyDetails.id,
            roleId: ROLES.COMPANY_ADMIN,
            hash,
            extended: true,
            expire,
            firstName: data.contactPersonFirstName,
            lastName: data.contactPersonLastName,
            createdById: account.id,
            orderId: data.orderId,
        });

        try {
            const mail = data.orderId ? await this.inviteCarrierWithOffer(data, hash, order) : await this.inviteCarrierEmail(data, hash);
            await this.mailService.sendEmail(mail);
        } catch (e) {
            throw new BadRequestException('Error at sending email.');
        }

        return inviteRepository.getInvite({ id: invite.id });
    }

    async inviteRequestChanges(
        data: InviteRequestChangesRequest,
    ): Promise<InviteRequestChangesResponse> {
        return { success: true };
    }

    async resendInvite(
        data: ResendInviteRequest,
        account: AccountEntity,
    ): Promise<ResendInviteResponse> {
        const invites = await this.inviteRepository.getInviteListByIds(
            data,
            account,
        );

        await this.inviteRepository.update(
            { id: In(invites.map(invite => invite.id)) },
            {
                expire: moment()
                    .add(3, 'days')
                    .toDate(),
            },
        );

        invites.forEach(async invite => {
            const mail = invite.extended
                ? await this.inviteCarrierEmail(invite.company, invite.hash)
                : await this.inviteAccountEmail(invite, invite.company, invite.hash);
            await this.mailService.sendEmail(mail);
        });
        return { success: true };
    }

    async validateToken(
        data: ValidateTokenRequest,
    ): Promise<ValidateTokenResponse> {
        const invite = await this.inviteRepository.getInvite({ hash: data.hash });
        const virtualAccount = await this.virtualAccountRepository.findOne({
            hash: data.hash,
        });

        if (virtualAccount) {
            return {
                success: true,
                invite: {
                    ...virtualAccount,
                    roleId: ROLES.CLIENT,
                    role: { id: ROLES.CLIENT, name: 'Client' },
                },
            };
        }

        if (!invite) {
            throw new BadRequestException('Invite was not found');
        }

        if (invite.statusId !== INVITE_STATUS.PENDING) {
            throw new BadRequestException('Invite was used before');
        }

        if (!invite.extended) {
            delete invite.company;
        }

        return { success: true, invite };
    }

    private async inviteAccountEmail(
        data: AccountInviteRequest,
        company: CompanyEntity,
        hash: string,
    ): Promise<MailMessage> {
        const { email, firstName, lastName, roleId } = data;
        const role = await this.roleRepository.findOne(roleId);
        let acceptUrl = `${this.configService.domain}/register-common/${hash}`;
        const denyUrl = `${
            this.configService.domain
            }/register-common-decline/${hash}`;

        if (roleId === ROLES.DRIVER) {
            acceptUrl = `${
                this.configService.apiDomain
                }/register/redirect/${roleId}/${hash}`;
        }

        const html = await this.mailService.commonInvitationTemplate({
            acceptUrl,
            denyUrl,
            carrierName: company.name,
            firstName,
            lastName,
            roleName: role.name,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: email,
            subject: 'Account registration',
            html,
        };
    }

    private async clientEmailActivationCodeEmail(
        account: AccountEntity,
        emailCode: EmailConfirmCodeEntity,
    ): Promise<MailMessage> {
        const { email, firstName, lastName } = account;

        const html = await this.mailService.clientMailConfirmTemplate({
            firstName,
            lastName,
            code: emailCode.code,
            url: `${this.configService.apiDomain}/register/email-confirm-redirect/${
                emailCode.hash
                }`,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: email,
            subject: 'Email confirmation',
            html,
        };
    }

    private async inviteCarrierEmail(
        data: CarrierInviteRequest | CompanyEntity,
        hash: string,
    ): Promise<MailMessage> {
        const html = await this.mailService.carrierInvitationTemplate({
            acceptUrl: `${this.configService.domain}/register-carrier/${hash}`,
            denyUrl: `${this.configService.domain}/register-carrier-decline/${hash}`,
            firstName: data.contactPersonFirstName,
            lastName: data.contactPersonLastName,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: data.email,
            subject: 'Carrier registration',
            html,
        };
    }

    private async validateEmailExistance(query: any): Promise<never | void> {
        const existAccount = await this.accountRepository.findOne(query);
        if (existAccount) {
            throw new BadRequestException('Account already exist.');
        }
    }

    private async validateInvite(
        hash: string,
        carrier: boolean,
    ): Promise<never | InviteEntity> {
        const invite = await this.inviteRepository.findOne({ hash });
        if (!invite) {
            throw new BadRequestException('Invite was not found');
        }

        if (invite.statusId !== INVITE_STATUS.PENDING) {
            throw new BadRequestException('Invite was used before');
        }

        if (invite.extended !== carrier) {
            throw new BadRequestException('Wrong invitation type.');
        }

        if (moment(invite.expire).isBefore(moment())) {
            throw new BadRequestException('Invitation has expired');
        }

        return invite;
    }

    public async validateCode(
        data: ValidateConfirmationCodeRequest,
    ): Promise<LoginResponse> {
        const account = await this.accountRepository.findOne({
            email: data.email,
        });

        if (!account) {
            throw new BadRequestException('Could not find this account');
        }

        const emailCode = await this.emailConfirmCodeRepository.findOne({
            code: data.code,
            accountId: account.id,
        });

        if (!emailCode) {
            throw new BadRequestException('Invalid confirmation code');
        }

        if (moment(emailCode.expire).isBefore(moment())) {
            throw new BadRequestException('Code is expired');
        }

        if (account.emailConfirmed) {
            throw new BadRequestException('Your email is already confirmed');
        }

        await this.accountRepository.save({
            id: account.id,
            emailConfirmed: true,
            approved: account.approved || account.roleId === ROLES.DRIVER,
        });

        return this.authService.generateTokens(account);
    }

    async sendEmailConfirmCodeEmail(
        account,
        emailConfirmCodeRepository: EmailConfrimCodeRepository = this.emailConfirmCodeRepository,
    ): Promise<EmailConfirmCodeEntity> {
        const code = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });
        const emailConfirmCode = await emailConfirmCodeRepository.save({
            code,
            accountId: account.id,
            expire: moment().add(12, 'hour'),
            hash: RandomString(36),
            createdAt: moment(),
        });

        const mail = await this.clientEmailActivationCodeEmail(
            account,
            emailConfirmCode,
        );
        await this.mailService.sendEmail(mail);

        return emailConfirmCode;
    }

    async resendCode(data: ResendConfirmationCodeRequest): Promise<SuccessDTO> {
        const account = await this.accountRepository.findOne({
            email: data.email,
        });

        if (!account) {
            throw new BadRequestException('Could not find this account');
        }

        if (account.roleId !== ROLES.DRIVER && account.roleId !== ROLES.CLIENT) {
            throw new BadRequestException(
                'You are not allowed to access this resource,',
            );
        }

        const lastInvite = await this.emailConfirmCodeRepository.getEmailConfirmByAccount(
            account.id,
        );

        if (lastInvite) {
            const lastInviteDate = moment(lastInvite.createdAt);
            if (moment.duration(moment().diff(lastInviteDate)).asMinutes() < 5) {
                throw new BadRequestException(
                    `You already resent an invite less than 5 minutes ago, please check your email (${
                    data.email
                    })`,
                );
            }
        }

        await this.sendEmailConfirmCodeEmail(account);

        return { success: true };
    }

    async codeConfirmRedirect(data: EmailConfirmRedirect) {
        const emailCode = await this.emailConfirmCodeRepository.getEmailConfirmByHash(
            data.hash,
        );

        const androidId = emailCode.account.roleId === ROLES.DRIVER ? this.configService.appAndroidDriver : this.configService.appAndroidClient;
        const iosId = emailCode.account.roleId === ROLES.DRIVER ? this.configService.appIosDriver : this.configService.appIosClient;

        if (!emailCode) {
            return { url: this.configService.domain, fallback: this.configService.domain, androidId, iosLink: `https://itunes.apple.com/app/${iosId}` };
        }
        const schema = emailCode.account.roleId === ROLES.DRIVER ? this.configService.appSchemaDriver : this.configService.appSchemaClient;
        const url = `${schema}://confirm?code=${emailCode.code}&email=${emailCode.account.email}`;

        return { url, fallback: this.configService.domain, androidId, iosLink: `https://itunes.apple.com/app/${iosId}` };
    }

    async registerRedirect(data: RegisterRedirect) {
        const url = data.role === ROLES.DRIVER ? `${this.configService.appSchemaDriver}://register-driver?hash=${data.hash}` :
            `${this.configService.appSchemaClient}://register-client?hash=${data.hash}&role=${data.role}`;
        const androidId = data.role === ROLES.DRIVER ? this.configService.appAndroidDriver : this.configService.appAndroidClient;
        const iosId = data.role === ROLES.DRIVER ? this.configService.appIosDriver : this.configService.appIosClient;

        return { url, fallback: this.configService.domain, androidId, iosLink: `https://itunes.apple.com/app/${iosId}` };
    }

    private async validateHash(token: string): Promise<ResetTokenEntity> {
        const tokenEntity = await this.resetTokenRepositry.findOne({
            token,
            used: false,
        });
        if (!tokenEntity) {
            throw new BadRequestException('Token was not found');
        }

        if (moment(tokenEntity.expire).isBefore(moment())) {
            throw new BadRequestException('Hash is expired');
        }
        return tokenEntity;
    }

    async getByHash(hash: string): Promise<CompanyEntity> {
        const token = await this.validateHash(hash);

        const account = await this.accountRepository.findOne(token.accountId);
        if (!account) {
            throw new BadRequestException('Account was not found');
        }
        const company = await this.companyRepository.findOne(account.companyId);

        if (!company) {
            throw new BadRequestException('Company was not found');
        }

        return company;
    }

    @Transaction()
    async carrierEdit(
        data: CarrierEditRegisterRequest,
        @TransactionRepository(ResetTokenEntity) resetTokenRepository?: Repository<ResetTokenEntity>,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
        @TransactionRepository(CompanyRepository) companyRepository?: CompanyRepository,
    ): Promise<SuccessDTO> {
        const token = await this.validateHash(data.token);

        const account = await accountRepository.findOne({
            id: token.accountId,
            email: data.email,
            companyId: data.id,
        });
        if (!account) {
            throw new BadRequestException('Account was not found');
        }

        const company = await companyRepository.findOne(account.companyId);
        if (!company || company.id !== data.id) {
            throw new BadRequestException('Company was not found');
        }

        delete data.token;
        delete data.termsOfServiceAccepted;
        await companyRepository.update(company.id, {
            ...company,
            ...data,
        });
        await accountRepository.update(account.id, {
            firstName: data.contactPersonFirstName,
            lastName: data.contactPersonLastName,
        });
        await resetTokenRepository.update(token.id, { used: true });

        return { success: true };
    }
}
