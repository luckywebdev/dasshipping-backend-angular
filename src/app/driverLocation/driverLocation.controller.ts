import { Controller } from '@nestjs/common';
import { ApiUseTags } from '@nestjs/swagger';
import {DriverLocationService} from './driverLocation.service';

@ApiUseTags('driverLocation')
@Controller('/driver-location')
export class DriverLocationController {
    constructor(
        private readonly driverLocationService: DriverLocationService,
    ) { }
}
