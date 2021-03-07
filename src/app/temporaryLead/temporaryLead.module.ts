import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailService } from '../../mail/mail.service';
import { AuthModule } from '../auth/auth.module';
import { HereService } from '../here/here.service';
import { CalculatorService } from '../shared/calculator.service';
import { TemporaryLeadEntity } from '../../entities/temporaryLead.entity';
import { TemporaryLeadService } from './temporaryLead.service';
import { TemporaryLeadController } from './temporaryLead.controller';
import { PolicyEntity } from '../../entities/policy.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { ConfigModule } from '../../config/config.module';
import { LeadModule } from '../lead/lead.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ TemporaryLeadEntity, PolicyEntity, GeneralEntity ]),
    AuthModule,
    ConfigModule,
    LeadModule,
  ],
  providers: [
    CalculatorService,
    HereService,
    MailService,
    TemporaryLeadService,
  ],
  controllers: [TemporaryLeadController],
  exports: [TemporaryLeadService],
})
export class TemporaryLeadModule { }
