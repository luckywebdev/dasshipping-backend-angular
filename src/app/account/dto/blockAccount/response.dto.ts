import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { SuccessDTO } from '../../../../dto/success.dto';

export class BlockAccountResponse extends SuccessDTO {
    @ApiModelProperty()
    @IsString()
    message: string;
}
