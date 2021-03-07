import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import {TrailerService} from './trailer.service';
import {TrailerController} from './trailer.controller';
import {TrailerEntity} from '../../entities/trailer.entity';
import {AccountModule} from '../account/account.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TrailerEntity]),
        AuthModule,
        AccountModule,
    ],
    providers: [TrailerService],
    controllers: [TrailerController],
})
export class TrailerModule { }
