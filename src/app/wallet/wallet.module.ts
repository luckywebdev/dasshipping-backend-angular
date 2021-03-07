import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WalletEntity } from '../../entities/wallet.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { PaymentModule } from '../payment/payment.module';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, AccountRepository]),
    PaymentModule,
  ],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule { }
