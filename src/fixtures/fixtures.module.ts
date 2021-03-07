import { Module } from '@nestjs/common';

import { FixturesService } from './fixtures.service';

@Module({
    imports: [],
    providers: [
        FixturesService,
    ],
})
export class FixturesModule {}
