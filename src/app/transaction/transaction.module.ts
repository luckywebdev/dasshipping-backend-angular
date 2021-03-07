import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeneralEntity } from '../../entities/general.entity';
import { TransactionEntity } from '../../entities/transaction.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { PaymentModule } from '../payment/payment.module';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity, TransactionRepository, WalletEntity, GeneralEntity]),
    PaymentModule,
  ],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule { }
