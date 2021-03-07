import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';

export class SendOrderDocumentRequest {
    @ApiModelProperty()
    @IsNumber()
    @IsValidId('order', { message: 'Invalid Order' })
    orderId: number;
}
