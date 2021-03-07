import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { OrderDTO } from '../../../../dto/order.dto';
import {ResponseListDTO} from '../../../dto/responseList.dto';

export class GetOrdersListResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: OrderDTO })
    @IsArray()
    data: OrderDTO[];
}
