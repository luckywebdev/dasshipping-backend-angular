import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { ResponseListDTO } from '../../../dto/responseList.dto';
import { QuoteDTO } from '../../../../dto/quote.dto';

export class GetLeadsListResponse extends ResponseListDTO {
  @ApiModelProperty({ isArray: true, type: QuoteDTO })
  @IsArray()
  data: QuoteDTO[];
}
