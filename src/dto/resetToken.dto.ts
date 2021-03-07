import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsDateString, IsNumberString, IsOptional, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';

export class ResetTokenDTO {
    @ApiModelPropertyOptional()
    @IsOptional()
    account?: AccountDTO;

    @ApiModelProperty()
    @IsNumberString()
    accountId: number;

    @ApiModelProperty()
    @IsDateString()
    createdAt: Date;

    @ApiModelProperty()
    @IsDateString()
    expire: Date;

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    @IsString()
    token: string;

    @ApiModelProperty()
    @IsBooleanString()
    used: boolean;
}
