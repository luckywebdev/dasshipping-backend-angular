import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { ApproveCompanyRequest } from '../approve/request.dto';

export class ChengesCompanyRequest extends ApproveCompanyRequest {
    @ApiModelProperty()
    @IsString()
    message: string;
}
