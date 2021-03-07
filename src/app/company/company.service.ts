import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { In, Repository, Transaction, TransactionRepository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { CompanyDTO } from '../../dto/company.dto';
import { WEB_NOTIFICATION } from '../../dto/notification.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { COMPANY_STATUSES, CompanyEntity } from '../../entities/company.entity';
import { CompanyFilesEntity } from '../../entities/companyFiles.entity';
import { NotificationStatus } from '../../entities/notification.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { MailMessage } from '../../mail/dto/mail.dto';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { CompanyRepository } from '../../repositories/company.repository';
import { fileSign } from '../../utils/fileSign.util';
import { RandomString } from '../../utils/random.utils';
import { RequestAccountFilesDTO } from '../account/dto/patch/requestAccountFiles.dto';
import { ApproveCompanyRequest } from './dto/approve/request.dto';
import { BlockCompaniesRequest } from './dto/blockCompanies/request.dto';
import { BlockCompanyRequest } from './dto/blockCompany/request.dto';
import { GetCompanyResponse } from './dto/get/response.dto';
import { GetCompanyListRequest } from './dto/list/request.dto';
import { GetCompanyListResponse } from './dto/list/response.dto';
import { PatchCompanyRequest } from './dto/patch/request.dto';
import { ChengesCompanyRequest } from './dto/requested-changes/request.dto';

@Injectable()
export class CompanyService {

    constructor(
        @InjectRepository(CompanyRepository) private readonly companyRepository: CompanyRepository,
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        @InjectRepository(ResetTokenEntity) private readonly resetTokenRepository: Repository<ResetTokenEntity>,
        @InjectRepository(CompanyFilesEntity) private readonly companyFilesEntity: Repository<CompanyFilesEntity>,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) { }

    async blockCompanies(data: BlockCompaniesRequest): Promise<SuccessDTO> {
        const { blocked, reason } = data;

        const companies = await this.companyRepository.find({ id: In(data.ids) });

        const subject = data.blocked ? 'Block company' : 'Active company';
        const status = data.blocked ? 'blocked' : 'activated';
        companies.forEach(async item => {
            const mail = await this.blockMail(item, { subject, status, reason });
            await this.mailService.sendEmail(mail);
        });

        await this.companyRepository.update({ id: In(data.ids) }, { blocked });
        return { success: true };
    }

    @Transaction()
    async approve(
        data: ApproveCompanyRequest,
        @TransactionRepository(CompanyRepository) companyRepository?: CompanyRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
    ): Promise<SuccessDTO> {
        const { id } = data;
        const company = await companyRepository.findOne({ id, status: COMPANY_STATUSES.REQUESTED });
        if (!company) {
            throw new BadRequestException('Company was not found');
        }
        await companyRepository.update(company.id, {
            status: COMPANY_STATUSES.ACTIVE,
        });
        await accountRepository.update(
            { companyId: company.id },
            { approved: true });

        return { success: true };
    }

    async requestedChanges(data: ChengesCompanyRequest): Promise<SuccessDTO> {
        const { id, message } = data;
        const company = await this.companyRepository.findOne({ id, status: COMPANY_STATUSES.REQUESTED });
        if (!company) {
            throw new BadRequestException('Company was not found');
        }

        const account = await this.accountRepository.findOne({ email: company.email, companyId: company.id });
        if (!account) {
            throw new BadRequestException('Account was not found');
        }

        const hash = RandomString(36);
        await this.resetTokenRepository.insert({
            token: hash,
            expire: moment().add(24, 'hours').toDate(),
            accountId: account.id,
        });

        const mail = await this.requestedChangesMail(company, message, hash);
        await this.mailService.sendEmail(mail);

        return { success: true };
    }

    async getById(id: string | number): Promise<CompanyDTO> {
        const company = await this.companyRepository.findOne(id);
        if (!company) {
            throw new BadRequestException('Company was not found');
        }
        return company;
    }

    async getList(query: GetCompanyListRequest, accountId: number): Promise<GetCompanyListResponse> {
        const { orderByField, orderByDirection } = query;

        const data = await this.companyRepository.createQueryBuilder('company')
            .leftJoinAndSelect('company.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.CARRIER })
            .where('company.status = :status', { status: query.status })
            .orderBy(`company.${orderByField || 'id'}`, orderByDirection || 'ASC')
            .skip(query.offset)
            .take(query.limit)
            .getMany();

        const count = await this.companyRepository.createQueryBuilder('company')
            .where('company.status = :status', { status: query.status })
            .getCount();

        return { data, count };
    }

    protected async saveCompanyFiles(companyId: number, files: RequestAccountFilesDTO[]): Promise<void> {
        const existingAccountFiles = await this.companyFilesEntity.find({ companyId });
        const filesToDelete = existingAccountFiles
            .filter(file => !files
                .filter(dataFile => dataFile.hasOwnProperty('id'))
                .map(dataF => dataF.id).includes(file.id));
        const filesToAdd = files.filter(file => !file.hasOwnProperty('id'))
            .map(file => {
                return {
                    path: file.path ? file.path : fileSign(file.displayName),
                    displayName: file.displayName,
                    companyId,
                };
            });
        await this.companyFilesEntity.remove(filesToDelete);
        await this.companyFilesEntity.save(filesToAdd);
    }

    async patch(data: PatchCompanyRequest, companyId: number): Promise<CompanyDTO> {
        let company = await this.companyRepository.getCompany(companyId, {});

        if (!company) {
            throw new NotFoundException(`Company ${companyId} not found`);
        }

        if (data.files) {
            await this.saveCompanyFiles(companyId, data.files);
            company = await this.companyRepository.getCompany(companyId, {});
        }
        delete data.files;

        await this.companyRepository.save({ ...company, ...data });

        return await this.companyRepository.getCompany(companyId, {});
    }

    async blockCompany(id: number, data: BlockCompanyRequest): Promise<SuccessDTO> {
        const company = await this.companyRepository.getCompany(id, {});

        if (!company) {
            throw new NotFoundException(`Company ${id} not found`);
        }
        const { reason, blocked } = data;
        const subject = data.blocked ? 'Block company' : 'Active company';
        const status = data.blocked ? 'blocked' : 'activated';

        await this.companyRepository.update(company.id, { blocked });

        const mail = await this.blockMail(company, { subject, status, reason });
        await this.mailService.sendEmail(mail);

        return { success: true };
    }

    private async requestedChangesMail(company: CompanyEntity, message: string, hash: string): Promise<MailMessage> {
        const { contactPersonFirstName, contactPersonLastName, email } = company;

        const html = await this.mailService.changesCompanyTemplate({
            contactPersonFirstName,
            contactPersonLastName,
            message,
            changeUrl: `${this.configService.domain}/changes-carrier/${hash}`,
        });

        return {
            from: `no-reply@${this.configService.email.domain}`,
            to: email,
            subject: 'Changes company placeholder',
            html,
        };
    }

    private async blockMail(company: CompanyEntity, data: { subject: string, status: string, reason: string }): Promise<MailMessage> {
        const { contactPersonFirstName, contactPersonLastName, email } = company;
        const { subject, status, reason } = data;

        const html = await this.mailService.blockCompanyTemplate({
            contactPersonFirstName,
            contactPersonLastName,
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

    public async getCompany(id: number, query: any = {}): Promise<GetCompanyResponse> {
        const company = await this.companyRepository.getCompany(id, query);

        if (!company) {
            throw new NotFoundException(`Company ${id} not found`);
        }

        const driversCount = await this.accountRepository.count({ companyId: id, roleId: ROLES.DRIVER });
        const dispatchersCount = await this.accountRepository.count({ companyId: id, roleId: ROLES.DISPATCHER });

        return {
            ...company,
            driversCount,
            dispatchersCount,
        };
    }

    public async getCompanyFiles(companyId: number): Promise<CompanyEntity> {
        const company = await this.companyRepository.findOne(companyId, { select: ['id', 'mcCertificateUrl', 'insuranceUrl'], relations: ['files'] });
        return { ...company, files: company.files.map(item => ({ ...item, url: fileSign(item.path) })) };
    }
}
