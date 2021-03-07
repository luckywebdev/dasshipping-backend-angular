import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ApproveCompanyRequest {
    @ApiModelProperty()
    @IsNumber()
    id: number;
}
