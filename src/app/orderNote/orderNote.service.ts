import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OrderNoteDTO } from '../../dto/orderNote.dto';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderNoteRepository } from '../../repositories/orderNote.repository';
import { fileSign } from '../../utils/fileSign.util';
import { GetOrderNotesRequest } from './dto/get/request.dto';
import { GetOrderNotesListResponse } from './dto/get/response.dto';
import { CreateOrderNoteDTO } from './dto/post/request.dto';

@Injectable()
export class OrderNoteService {
  constructor(
    @InjectRepository(OrderNoteRepository)
    private readonly orderNoteRepository: OrderNoteRepository,
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
  ) { }

  public async post(data: CreateOrderNoteDTO, query): Promise<OrderNoteDTO> {
    const order = await this.orderRepository.findOne(query);

    if (!order) {
      const { orderId } = data;
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    const orderNote = await this.orderNoteRepository.save({
      ...data,
    });

    const note = await this.orderNoteRepository
      .createQueryBuilder('orderNote')
      .leftJoinAndSelect('orderNote.account', 'account')
      .where('orderNote.id = :id', { id: orderNote.id })
      .getOne();

    note.account.avatarUrl = fileSign(note.account.avatarUrl);
    return note;
  }

  public async getOrderNotes(
    orderId: number,
    query?: GetOrderNotesRequest,
  ): Promise<GetOrderNotesListResponse> {
    return this.orderNoteRepository.getOrderNotes(orderId, query);
  }
}
