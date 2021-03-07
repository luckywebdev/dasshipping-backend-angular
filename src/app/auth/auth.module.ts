import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/config.service';
import { AccountEntity } from '../../entities/account.entity';
import { DeviceEntity } from '../../entities/device.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './passport/jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => (configService.token),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([AccountEntity, DeviceEntity]),
        ConfigModule,
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [PassportModule, AuthService],
})
export class AuthModule { }
