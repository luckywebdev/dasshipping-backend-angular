import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '../../config/config.module';
import { OrderAttachmentEntity } from '../../entities/orderAttachment.entity';
import { FileService } from '../../file/file.service';
import { AuthModule } from '../auth/auth.module';
import { OrderAttachmentController } from './orderAttachment.controlle';
import { OrderAttachmentService } from './orderAttachment.service';
import { OrderModule } from '../order/order.module';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderAttachmentEntity,
      OrderAttachmentRepository,
    ]),
    AuthModule,
    ConfigModule,
    OrderModule,
  ],
  providers: [OrderAttachmentService, FileService],
  controllers: [OrderAttachmentController],
  exports: [OrderAttachmentService],
})
export class OrderAttachmentModule {}
