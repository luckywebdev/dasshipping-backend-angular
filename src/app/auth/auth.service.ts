import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotAcceptableException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as reCAPTCHA from 'recaptcha2';
import { Repository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { AccountEntity } from '../../entities/account.entity';
import { DeviceEntity } from '../../entities/device.entity';
import { GeneratePasswordHash } from '../../utils/crypto.utils';
import { LoginRequest } from './dto/login/request.dto';
import { LoginResponse } from './dto/login/response.dto';
import { RefreshTokenRequest } from './dto/refresh-token/request.dto';
import { RefreshTokenResponse } from './dto/refresh-token/response.dto';
import { JwtPayload } from './passport/interfaces/jwt-payload.interface';

export enum TokenTypes {
    ACCESS,
    REFRESH,
}

@Injectable()
export class AuthService {
    private forbiddenMessage = {
        web: `You are not allowed to access this resource, please access the mobile or contact our support at support@${this.config.email.domain}`,
        mobile: `You are not allowed to access this resource, please access the web or contact our support at support@${this.config.email.domain}`,
    };
    public async recaptchaValidate(token: string) {
        const { isEnabled, siteKey, secretKey } = this.config.recatcha;
        if (isEnabled) {
            return (new reCAPTCHA({
                siteKey,
                secretKey,
                ssl: true,
            })).validate(token)
                .catch(() => {
                    throw new UnauthorizedException('Are you a human?');
                });
        }

        return;
    }

    constructor(
        @InjectRepository(AccountEntity)
        private readonly accountRepository: Repository<AccountEntity>,
        @InjectRepository(DeviceEntity)
        private readonly deviceEntity: Repository<DeviceEntity>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {
    }

    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const account = await this.accountRepository.findOne({
            email: credentials.email,
            password: GeneratePasswordHash(credentials.password),
        }, { relations: ['company'] });

        if (!account) {
            throw new UnauthorizedException('Invalid Credentials');
        }
        if (account.company && account.company.blocked) {
            throw new BadRequestException('Company account blocked');
        }

        if (credentials.mobile) {
            if (account.roleId !== ROLES.CLIENT && account.roleId !== ROLES.DRIVER) {
                throw new ForbiddenException(this.forbiddenMessage.mobile);
            }
            if (!account.emailConfirmed) {
                throw new NotAcceptableException('Your email is not confirmed');
            }
            if (credentials.deviceId) {
                await this.saveDevice(credentials.deviceId, account.id);
            }
        } else {
            if (account.roleId === ROLES.CLIENT || account.roleId === ROLES.DRIVER) {
                throw new ForbiddenException(this.forbiddenMessage.web);
            }
        }

        return this.generateTokens(account);
    }

    private async saveDevice(deviceId: string, accountId: number): Promise<void> {
        const device = await this.deviceEntity.findOne({ accountId });
        if (device) {
            await this.deviceEntity.update({ accountId }, {
                deviceId,
                updatedAt: new Date(),
            });
        } else {
            await this.deviceEntity.save({
                deviceId,
                accountId,
            });
        }
    }

    async refresh(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
        try {
            const verify = this.jwtService.verify(data.refreshToken);
            const account = await this.accountRepository.findOne(verify.id);
            return this.generateTokens(account);
        } catch (e) {
            throw new ForbiddenException(e);
        }
    }

    validateAccount(payload: JwtPayload): Promise<AccountEntity> {
        return this.accountRepository.createQueryBuilder('account')
            .leftJoinAndSelect('account.company', 'company')
            .leftJoinAndSelect('account.role', 'role')
            .leftJoinAndSelect('account.gender', 'gender')
            .where({ id: payload.id, email: payload.email })
            .getOne();
    }

    private generateToken(account: AccountEntity, expiresIn: number, type: TokenTypes): string {
        const payload: JwtPayload = { id: account.id, email: account.email, type };
        return this.jwtService.sign(payload, {
            expiresIn,
        });
    }

    public generateTokens(account: AccountEntity) {
        const accessToken = this.generateToken(account, this.config.accessTokenExpiresIn, TokenTypes.ACCESS);
        const refreshToken = this.generateToken(account, this.config.refreshTokenExpiresIn, TokenTypes.REFRESH);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.config.accessTokenExpiresIn,
        };
    }
}
