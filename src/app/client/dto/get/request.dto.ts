import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';

export const INTERVALS = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    LATEST: 'latest',
};

export class GetTransactionListRequest extends GetList {
    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsIn([INTERVALS.TODAY, INTERVALS.WEEK, INTERVALS.MONTH, INTERVALS.LATEST])
    @IsOptional()
    time?: string;

    clientId?: number;
}
