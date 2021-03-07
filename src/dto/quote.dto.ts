import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsString, IsDate } from 'class-validator';
import { OrderBaseDTO } from './orderBase.dto';
import { VirtualAccountDTO } from './virtualAccount.dto';

export class QuoteDTO extends OrderBaseDTO {
  @ApiModelProperty()
  @IsNumber()
  orderId?: number;

  @ApiModelProperty()
  customer?: VirtualAccountDTO;

  @ApiModelProperty()
  @IsNumber()
  customerId?: number;

  @ApiModelProperty()
  @IsDate()
  available?: Date;

  @ApiModelProperty()
  @IsString()
  notes?: string;

  @ApiModelProperty()
  @IsBoolean()
  external?: boolean;

  @ApiModelProperty()
  @IsNumber()
  sentCount?: number;
}
