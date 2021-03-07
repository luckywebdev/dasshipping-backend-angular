import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class DeleteAccountsRequest {
    @ApiModelProperty()
    @IsBoolean()
    deleted: boolean;

    @ApiModelProperty({ isArray: true, type: Number })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
}
