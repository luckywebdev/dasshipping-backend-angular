import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import {TruckEntity} from '../../entities/truck.entity';
import {TruckService} from './truck.service';
import {TruckController} from './truck.controller';
import {AccountModule} from '../account/account.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TruckEntity]),
        AuthModule,
        AccountModule,
    ],
    providers: [TruckService],
    controllers: [TruckController],
})
export class TruckModule { }
