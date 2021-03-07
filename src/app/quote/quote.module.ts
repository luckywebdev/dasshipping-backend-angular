import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarEntity } from '../../entities/car.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { LocationEntity } from '../../entities/location.entity';
import { PolicyEntity } from '../../entities/policy.entity';
import { QuoteRepository } from '../../repositories/quote.repository';
import { HereService } from '../here/here.service';
import { OrderModule } from '../order/order.module';
import { CalculatorService } from '../shared/calculator.service';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { CarRepository } from '../../repositories/car.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { ShipperEntity } from '../../entities/shipper.entity';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRepository,
      AccountRepository,
      ShipperEntity,
      OrderAttachmentRepository,
      PolicyEntity,
      GeneralEntity,
      CarEntity,
      CarRepository,
      LocationEntity,
    ]),
    OrderModule,
  ],
  providers: [QuoteService, CalculatorService, HereService],
  controllers: [QuoteController],
  exports: [QuoteService],
})
export class QuoteModule {}
