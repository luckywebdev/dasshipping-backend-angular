import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { PolicyDTO } from '../../../dto/policy.dto';

export class GetPolicyListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: PolicyDTO })
    @IsArray()
    data: PolicyDTO[];
}
