import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'aws-sdk';

import { AccountEntity } from '../../entities/account.entity';
import { AccountFilesEntity } from '../../entities/accountFiles.entity';
import { QuoteEntity } from '../../entities/quote.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { MailModule } from '../../mail/mail.module';
import { AccountRepository } from '../../repositories/account.repository';
import { JoinRequestRepository } from '../../repositories/joinRequests.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([AccountEntity, ResetTokenEntity, JoinRequestRepository, AccountRepository,
            AccountFilesEntity, QuoteEntity, QuoteRepository]),
        MailModule,
        AuthModule,
        NotificationModule,
    ],
    providers: [AccountService, ConfigService],
    controllers: [AccountController],
    exports: [AccountService],
})
export class AccountModule { }
