import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';
import { CarrierNewRegisterRequest } from '../carrier-new-register/request.dto';

export class CarrierEditRegisterRequest extends CarrierNewRegisterRequest {
    @ApiModelProperty()
    @IsNumber()
    @IsValidId('company', { message: 'Invalid Company' })
    id: number;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    token: string;
}
