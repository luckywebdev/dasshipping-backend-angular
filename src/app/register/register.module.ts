import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from '../../entities/account.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { RoleEntity } from '../../entities/role.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { MailModule } from '../../mail/mail.module';
import { EmailConfrimCodeRepository } from '../../repositories/emailConfirm.repository';
import { InviteRepository } from '../../repositories/invite.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { GeneralEntity } from '../../entities/general.entity';
import { TransactionModule } from '../transaction/transaction.module';
import { DispatchRepository } from '../../repositories/dispatch.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      CompanyEntity,
      InviteRepository,
      ResetTokenEntity,
      QuoteRepository,
      VirtualAccountEntity,
      RoleEntity,
      EmailConfrimCodeRepository,
      GeneralEntity,
      OrderRepository,
      DispatchRepository,
    ]),
    MailModule,
    AuthModule,
    TransactionModule,
  ],
  controllers: [RegisterController],
  providers: [RegisterService, AuthService],
  exports: [RegisterService],
})
export class RegisterModule { }
