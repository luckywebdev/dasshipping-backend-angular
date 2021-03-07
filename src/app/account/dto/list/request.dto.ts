import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';

export enum ACCOUNTS_ORDER_BY_FIELDS {
    BLOCKED = 'blocked',
    FULL_NAME = 'fullName',
    ROLE = 'role',
}

export class GetAccountsListRequest extends GetList {
    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    textFilter?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    role?: string;
}
