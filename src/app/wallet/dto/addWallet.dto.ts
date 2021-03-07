import { ApiModelProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

import { PAYMENT_METHOD_TYPE } from '../../payment/payment.service';

export class WalletRequestDTO {
    @ApiModelProperty()
    @IsString()
    token: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    @IsIn([PAYMENT_METHOD_TYPE.CREDIT_CARD, PAYMENT_METHOD_TYPE.ACH])
    type: string;
}
