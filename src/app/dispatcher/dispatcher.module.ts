import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';
import { CompanyModule } from '../company/company.module';
import { InspectionModule } from '../inspection/inspection.module';
import { OrderModule } from '../order/order.module';
import { OrderAttachmentModule } from '../orderAttachment/orderAttachment.module';
import { OrderNoteModule } from '../orderNote/orderNote.module';
import { OrderTimelineModule } from '../orderTimeline/orderTimeline.module';
import { TripModule } from '../trip/trip.module';
import { DispatcherController } from './dispatcher.controller';

@Module({
  imports: [
    TripModule,
    OrderModule,
    AccountModule,
    InspectionModule,
    CompanyModule,
    OrderNoteModule,
    OrderAttachmentModule,
    OrderTimelineModule,
  ],
  controllers: [DispatcherController],
})
export class DispatcherModule { }
