import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';
import { CarModule } from '../car/car.module';
import { DriverLocationModule } from '../driverLocation/driverLocation.module';
import { GeneralModule } from '../general/general.module';
import { InspectionModule } from '../inspection/inspection.module';
import { OrderModule } from '../order/order.module';
import { OrderAttachmentModule } from '../orderAttachment/orderAttachment.module';
import { OrderTimelineModule } from '../orderTimeline/orderTimeline.module';
import { PaymentModule } from '../payment/payment.module';
import { QuoteModule } from '../quote/quote.module';
import { WalletModule } from '../wallet/wallet.module';
import { ClientController } from './client.controller';

@Module({
    imports: [
        GeneralModule,
        QuoteModule,
        OrderModule,
        InspectionModule,
        DriverLocationModule,
        CarModule,
        OrderTimelineModule,
        OrderAttachmentModule,
        WalletModule,
        PaymentModule,
        AccountModule,
    ],
    controllers: [ClientController],
})
export class ClientModule {
}
