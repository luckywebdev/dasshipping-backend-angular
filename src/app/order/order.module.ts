import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '../../config/config.module';
import { CarEntity } from '../../entities/car.entity';
import { DispatchEntity } from '../../entities/dispatch.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { LocationEntity } from '../../entities/location.entity';
import { OrderEntity } from '../../entities/order.entity';
import { OrderNoteEntity } from '../../entities/orderNote.entity';
import { OrderTimelineEntity } from '../../entities/orderTimeline.entity';
import { OrderToTripEntity } from '../../entities/orderToTrip.entity';
import { PolicyEntity } from '../../entities/policy.entity';
import { ShipperEntity } from '../../entities/shipper.entity';
import { TempPriceEntity } from '../../entities/tempPrice.entity';
import { TripEntity } from '../../entities/trip.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { FileService } from '../../file/file.service';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { CarRepository } from '../../repositories/car.repository';
import { DispatchRepository } from '../../repositories/dispatch.repository';
import { DriverLocationRepository } from '../../repositories/driverLocation.repository';
import { InspectionRepository } from '../../repositories/inspection.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';
import { OrderNoteRepository } from '../../repositories/orderNote.repository';
import { OrderTimelineRepository } from '../../repositories/orderTimeline.repository';
import { PolicyRepository } from '../../repositories/policy.repository';
import { TripRepository } from '../../repositories/trip.repository';
import { AuthModule } from '../auth/auth.module';
import { HereModule } from '../here/here.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { InspectionPhotosService } from '../services/inspectionPhotos.service';
import { LocationService } from '../services/location/location.service';
import { PdfGenerationService } from '../services/pdfGeneration.service';
import { CalculatorService } from '../shared/calculator.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ImportOrderService } from './import.service';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      DispatchEntity,
      OrderTimelineEntity,
      PolicyEntity,
      GeneralEntity,
      CarEntity,
      LocationEntity,
      OrderRepository,
      TripEntity,
      TripRepository,
      TempPriceEntity,
      VirtualAccountEntity,
      InspectionRepository,
      DispatchRepository,
      OrderNoteEntity,
      OrderToTripEntity,
      ShipperEntity,
      OrderAttachmentRepository,
      DriverLocationRepository,
      OrderNoteRepository,
      OrderTimelineRepository,
      CarRepository,
      AccountRepository,
      PolicyRepository,
    ]),
    AuthModule,
    NotificationModule,
    HereModule,
    ConfigModule,
    TransactionModule,
  ],
  providers: [
    OrderService,
    FileService,
    CalculatorService,
    LocationService,
    ImportOrderService,
    PdfGenerationService,
    InspectionPhotosService,
    OrderAttachmentService,
    MailService,
  ],
  controllers: [OrderController],
  exports: [OrderService, ImportOrderService],
})
export class OrderModule { }
