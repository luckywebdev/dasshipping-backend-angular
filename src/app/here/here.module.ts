import { Module } from '@nestjs/common';

import { ConfigModule } from '../../config/config.module';
import { AuthModule } from '../auth/auth.module';
import { HereController } from './here.controller';
import { HereService } from './here.service';

@Module({
    imports: [
        AuthModule,
        ConfigModule,
    ],
    providers: [HereService],
    controllers: [HereController],
    exports: [HereService],
})
export class HereModule { }
