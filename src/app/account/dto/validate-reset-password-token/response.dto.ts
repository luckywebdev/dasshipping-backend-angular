import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { SuccessDTO } from '../../../../dto/success.dto';

export class ValidateResetPasswordTokenResponse extends SuccessDTO {
    @ApiModelProperty()
    @IsNumber()
    roleId: number;
}
