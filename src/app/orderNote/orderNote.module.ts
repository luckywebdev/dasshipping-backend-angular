import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'aws-sdk';

import { AccountEntity } from '../../entities/account.entity';
import { OrderNoteEntity } from '../../entities/orderNote.entity';
import { FileService } from '../../file/file.service';
import { AuthModule } from '../auth/auth.module';
import { OrderModule } from '../order/order.module';
import { OrderNoteController } from './orderNote.controller';
import { OrderNoteService } from './orderNote.service';
import {OrderNoteRepository} from '../../repositories/orderNote.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([AccountEntity, OrderNoteEntity, OrderNoteRepository]),
        AuthModule,
        OrderModule,
    ],
    providers: [OrderNoteService, ConfigService, FileService],
    controllers: [OrderNoteController],
    exports: [OrderNoteService],
})
export class OrderNoteModule { }
