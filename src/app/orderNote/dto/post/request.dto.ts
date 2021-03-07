import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOrderNoteDTO {
  @ApiModelProperty()
  @IsString()
  note: string;

  orderId: number;
  accountId: number;
}
