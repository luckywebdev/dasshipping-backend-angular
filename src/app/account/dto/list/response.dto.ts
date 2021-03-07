import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { AccountDTO } from '../../../../dto/account.dto';

export class GetAccountsListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: AccountDTO })
    @IsArray()
    data: AccountDTO[];
}
