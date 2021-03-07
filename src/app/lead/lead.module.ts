import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '../../config/config.module';
import { CarEntity } from '../../entities/car.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { LocationEntity } from '../../entities/location.entity';
import { PolicyEntity } from '../../entities/policy.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { CarRepository } from '../../repositories/car.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { AuthModule } from '../auth/auth.module';
import { HereService } from '../here/here.service';
import { CalculatorService } from '../shared/calculator.service';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import {PolicyRepository} from '../../repositories/policy.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRepository,
      PolicyEntity,
      AccountRepository,
      CarEntity,
      GeneralEntity,
      VirtualAccountEntity,
      LocationEntity,
      CarRepository,
      PolicyRepository,
    ]),
    AuthModule,
    ConfigModule,
  ],
  providers: [
    LeadService,
    CalculatorService,
    HereService,
    MailService,
  ],
  controllers: [LeadController],
  exports: [LeadService],
})
export class LeadModule { }
