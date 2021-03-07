import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { NestEmitterModule } from 'nest-emitter';
import { ScheduleModule } from 'nest-schedule';
import { ApmModule } from 'nestjs-apm';

import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { FileModule } from '../file/file.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { CarModule } from './car/car.module';
import { ClientModule } from './client/client.module';
import { CompanyModule } from './company/company.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { DispatcherModule } from './dispatcher/dispatcher.module';
import { DriverModule } from './driver/driver.module';
import { DriverLocationModule } from './driverLocation/driverLocation.module';
import { EventsModule } from './events/events.module';
import { GeneralModule } from './general/general.module';
import { HereModule } from './here/here.module';
import { InspectionModule } from './inspection/inspection.module';
import { JoinRequestModule } from './joinRequest/joinRequest.module';
import { LeadModule } from './lead/lead.module';
import { LoggerMiddleware } from './logger.middleware';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { OrderAttachmentModule } from './orderAttachment/orderAttachment.module';
import { OrderNoteModule } from './orderNote/orderNote.module';
import { OrderTimelineModule } from './orderTimeline/orderTimeline.module';
import { PaymentModule } from './payment/payment.module';
import { PolicyModule } from './policy/policy.module';
import { QuoteModule } from './quote/quote.module';
import { RegisterModule } from './register/register.module';
import { ScheduleService } from './services/schedule.service';
import { TrailerModule } from './trailer/trailer.module';
import { TripModule } from './trip/trip.module';
import { TruckModule } from './truck/truck.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import {TemporaryLeadModule} from './temporaryLead/temporaryLead.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, NestEmitterModule.forRoot(new EventEmitter())],
      useFactory: async (configService: ConfigService) =>
        configService.database,
      inject: [ConfigService],
    }),
    AccountModule,
    AuthModule,
    ConfigModule,
    RegisterModule,
    CompanyModule,
    FileModule,
    OrderModule,
    TripModule,
    HereModule,
    PolicyModule,
    CarModule,
    OrderNoteModule,
    QuoteModule,
    GeneralModule,
    OrderTimelineModule,
    OrderAttachmentModule,
    JoinRequestModule,
    TruckModule,
    TrailerModule,
    DispatchModule,
    ClientModule,
    DispatcherModule,
    DriverModule,
    InspectionModule,
    NotificationModule,
    EventsModule,
    DriverLocationModule,
    LeadModule,
    WalletModule,
    PaymentModule,
    TransactionModule,
    TemporaryLeadModule,
    ScheduleModule.register(),
    // ApmModule.register(),
  ],
  providers: [ScheduleService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/');
  }
}
