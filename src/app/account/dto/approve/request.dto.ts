import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class ApproveAccountsRequest {
    @ApiModelProperty()
    @IsBoolean()
    approved: boolean;

    @ApiModelProperty({ isArray: true, type: Number })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
}
