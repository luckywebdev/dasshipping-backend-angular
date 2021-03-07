import { Controller } from '@nestjs/common';
import { ApiUseTags } from '@nestjs/swagger';

import { TripService } from './trip.service';

@ApiUseTags('trip')
@Controller('/trip')
export class TripController {
    constructor(
        private readonly tripService: TripService,
    ) { }
}
