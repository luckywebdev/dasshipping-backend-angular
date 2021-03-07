import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriverLocationEntity } from '../../entities/driverLocation.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { DriverLocationRepository } from '../../repositories/driverLocation.repository';
import { AuthModule } from '../auth/auth.module';
import { DriverLocationController } from './driverLocation.controller';
import { DriverLocationService } from './driverLocation.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([DriverLocationEntity, DriverLocationRepository, AccountRepository]),
        AuthModule,
    ],
    providers: [DriverLocationService],
    controllers: [DriverLocationController],
    exports: [DriverLocationService],
})
export class DriverLocationModule { }
