import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';

export class MarkOrderAsPaidRequest {
    @ApiModelProperty()
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsValidId('order', { message: 'Invalid Order' })
    id: number;
}
