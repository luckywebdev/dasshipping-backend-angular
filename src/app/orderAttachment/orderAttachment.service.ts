import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OrderAttachmentDTO } from '../../dto/orderAttachment.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';
import { fileSign } from '../../utils/fileSign.util';
import { GetList } from '../dto/requestList.dto';
import { GetOrderAttachmentListResponse } from './dto/get/response.dto';
import { AddAttachmentToOrderRequest } from './dto/post/request.dto';

@Injectable()
export class OrderAttachmentService {
  constructor(
    @InjectRepository(OrderAttachmentRepository)
    private readonly orderAttachmentRepository: OrderAttachmentRepository,
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
  ) { }

  public async get(
    orderId: number,
    query: GetList,
  ): Promise<GetOrderAttachmentListResponse> {
    return this.orderAttachmentRepository.getOrderAttachments(orderId, query);
  }

  public async delete(queryOrder: any, query: any): Promise<SuccessDTO> {
    const order = await this.orderRepository.findOne(queryOrder);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${query.orderId}`);
    }

    const attachment = await this.orderAttachmentRepository.findOne(query);

    if (!attachment) {
      throw new BadRequestException(`Attachment not found for id ${query.id}`);
    }
    await this.orderAttachmentRepository.delete(attachment.id);
    return { success: true };
  }

  public async post(
    data: AddAttachmentToOrderRequest,
    query,
  ): Promise<OrderAttachmentDTO> {
    const order = await this.orderRepository.findOne(query);

    if (!order) {
      const { orderId } = data;
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    const attachment = await this.orderAttachmentRepository.save(
      data,
      {
        reload: true,
      },
    );
    return {
      ...attachment,
      url: fileSign(attachment.path),
    };
  }
}
