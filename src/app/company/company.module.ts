import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'aws-sdk';

import { AccountEntity } from '../../entities/account.entity';
import { CompanyFilesEntity } from '../../entities/companyFiles.entity';
import { ResetTokenEntity } from '../../entities/resetToken.entity';
import { FileService } from '../../file/file.service';
import { MailModule } from '../../mail/mail.module';
import { AccountRepository } from '../../repositories/account.repository';
import { CompanyRepository } from '../../repositories/company.repository';
import { AccountModule } from '../account/account.module';
import { AccountService } from '../account/account.service';
import { AuthModule } from '../auth/auth.module';
import { DriverLocationModule } from '../driverLocation/driverLocation.module';
import { InspectionModule } from '../inspection/inspection.module';
import { OrderModule } from '../order/order.module';
import { OrderAttachmentModule } from '../orderAttachment/orderAttachment.module';
import { OrderNoteModule } from '../orderNote/orderNote.module';
import { OrderTimelineModule } from '../orderTimeline/orderTimeline.module';
import { TripModule } from '../trip/trip.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import {ImportOrderService} from '../order/import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyRepository,
      AccountRepository,
      AccountEntity,
      ResetTokenEntity,
      CompanyFilesEntity,
    ]),
    AuthModule,
    MailModule,
    TripModule,
    OrderModule,
    InspectionModule,
    AccountModule,
    DriverLocationModule,
    OrderNoteModule,
    OrderAttachmentModule,
    OrderTimelineModule,
  ],
  providers: [CompanyService, FileService, ConfigService, AccountService, ImportOrderService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule { }
