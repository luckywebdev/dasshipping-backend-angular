import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';

export class GetOrderNotesRequest extends GetList {
  @ApiModelProperty()
  @IsString()
  @IsOptional()
  eventKey?: boolean;

  companyId?: number;
}
