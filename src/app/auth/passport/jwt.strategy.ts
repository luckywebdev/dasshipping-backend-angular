import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '../../../config/config.service';
import { AuthService, TokenTypes } from '../auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        public readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('token'),
            secretOrKey: configService.token.secretOrPrivateKey,
        });
    }

    async validate(payload: JwtPayload) {
        if (payload.type !== TokenTypes.ACCESS) {
            throw new UnauthorizedException();
        }

        if (payload.orderId && !payload.id) {
            return payload.orderId;
        }

        const account = await this.authService.validateAccount(payload);
        if (!account) {
            throw new UnauthorizedException('Account does not exist');
        }
        if (!account.approved) {
            throw new UnauthorizedException('Your account is pending approval');
        }
        if (account.company && account.company.blocked) {
            throw new UnauthorizedException('Your company have been blocked. Please contact system administrators.');
        }
        if (account.blocked) {
            throw new UnauthorizedException('Your account have been blocked. Please contact company administrators.');
        }
        if (account.deleted) {
            throw new UnauthorizedException('Account does not exist');
        }
        return account;
    }
}
