import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { OrderAttachmentDTO } from '../../../../dto/orderAttachment.dto';
import { ResponseListDTO } from '../../../dto/responseList.dto';

export class GetOrderAttachmentListResponse extends ResponseListDTO {
  @ApiModelProperty({ isArray: true, type: OrderAttachmentDTO })
  @IsArray()
  data: OrderAttachmentDTO[];
}
