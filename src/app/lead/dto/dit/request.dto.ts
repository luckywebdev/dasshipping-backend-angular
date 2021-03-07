import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EditLeadRequest {
  @ApiModelProperty()
  @IsString()
  notes: string;
}
