import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeneralEntity } from '../../entities/general.entity';
import { AuthModule } from '../auth/auth.module';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([GeneralEntity]),
        AuthModule,
    ],
    providers: [GeneralService],
    controllers: [GeneralController],
    exports: [GeneralService],
})
export class GeneralModule { }
