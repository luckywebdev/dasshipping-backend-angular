import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import {QuoteDTO} from '../../../../dto/quote.dto';

export class QuotesListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: QuoteDTO })
    @IsArray()
    data: QuoteDTO[];
}
