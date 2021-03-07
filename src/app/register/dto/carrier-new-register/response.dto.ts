import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { SuccessDTO } from '../../../../dto/success.dto';

export class CarrierNewRegisterResponse extends SuccessDTO {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;
}
