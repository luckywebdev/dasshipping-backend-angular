import { Module } from '@nestjs/common';

import { CarModule } from '../car/car.module';
import { CompanyModule } from '../company/company.module';
import { DriverLocationModule } from '../driverLocation/driverLocation.module';
import { InspectionModule } from '../inspection/inspection.module';
import { OrderModule } from '../order/order.module';
import { OrderAttachmentModule } from '../orderAttachment/orderAttachment.module';
import { OrderTimelineModule } from '../orderTimeline/orderTimeline.module';
import { TripModule } from '../trip/trip.module';
import { DriverController } from './driver.controller';

@Module({
  imports: [
    TripModule,
    OrderModule,
    InspectionModule,
    DriverLocationModule,
    CarModule,
    OrderAttachmentModule,
    OrderTimelineModule,
    CompanyModule,
  ],
  controllers: [DriverController],
})
export class DriverModule { }
