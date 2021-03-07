import { Module } from '@nestjs/common';

import { ConfigModule } from '../../config/config.module';
import { PaymentService } from './payment.service';
import { TransactionEntity } from '../../entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            TransactionEntity,
        ]),
    ],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }
