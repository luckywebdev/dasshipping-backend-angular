import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class AddAttachmentToOrderRequest {
  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  path: string;

  @ApiModelProperty()
  @Length(1, 255)
  @IsString()
  @IsOptional()
  displayName?: string;

  orderId: number;
  createdById: number;
}
