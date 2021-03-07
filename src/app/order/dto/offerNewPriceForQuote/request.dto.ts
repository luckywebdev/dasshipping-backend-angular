import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';

export class OfferNewPriceForQuoteRequest {
    @ApiModelProperty()
    @IsNumber()
    @IsValidId('order', { message: 'Invalid Order' })
    id: number;

    @ApiModelProperty()
    @IsNumber()
    @Min(1)
    @Max(1000000)
    price: number;
}
