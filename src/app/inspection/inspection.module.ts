import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { InspectionEntity } from '../../entities/inspection.entity';
import { InspectionDetailsEntity } from '../../entities/inspectionDetails.entity';
import { InspectionService } from './inspection.service';
import { InspectionRepository } from '../../repositories/inspection.repository';
import { InspectionController } from './inspection.controller';
import { TripRepository } from '../../repositories/trip.repository';
import { CarEntity } from '../../entities/car.entity';
import { LocationEntity } from '../../entities/location.entity';
import { LocationService } from '../services/location/location.service';
import { HereModule } from '../here/here.module';
import { OrderRepository } from '../../repositories/order.repository';
import { DriverLocationModule } from '../driverLocation/driverLocation.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InspectionEntity,
            InspectionDetailsEntity,
            InspectionRepository,
            TripRepository,
            CarEntity,
            LocationEntity,
            OrderRepository,
        ]),
        AuthModule,
        HereModule,
        DriverLocationModule,
    ],
    providers: [InspectionService, LocationService],
    controllers: [InspectionController],
    exports: [InspectionService],
})
export class InspectionModule { }
