import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from '../../entities/account.entity';
import { PolicyEntity } from '../../entities/policy.entity';
import { AuthModule } from '../auth/auth.module';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { PolicyRepository } from '../../repositories/policy.repository';
import { ConfigModule } from '../../config/config.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AccountEntity, PolicyEntity, PolicyRepository]),
        AuthModule,
        ConfigModule,
    ],
    controllers: [PolicyController],
    providers: [PolicyService],
})
export class PolicyModule { }
