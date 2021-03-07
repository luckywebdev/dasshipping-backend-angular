import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

import { OrderDTO } from './order.dto';
import { url } from 'inspector';

export class OrderAttachmentDTO {
  @ApiModelProperty()
  @IsNumber()
  id: number;

  @ApiModelProperty()
  @IsString()
  path: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiModelProperty()
  @IsString()
  displayName: string;

  @ApiModelProperty()
  @IsNumber()
  orderId: number;

  @ApiModelProperty()
  order: OrderDTO;
}
