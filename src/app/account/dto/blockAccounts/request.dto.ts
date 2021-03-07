import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { BlockAccountRequest } from '../blockAccount/request.dto';

export class BlockAccountsRequest extends BlockAccountRequest {
    @ApiModelProperty({ isArray: true, type: Number })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
}
