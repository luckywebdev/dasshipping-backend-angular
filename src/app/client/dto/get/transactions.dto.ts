import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { TransactionDTO } from '../../../../dto/transaction.dto';

export class GetTransactionListResponse {
    @ApiModelProperty()
    @IsNumber()
    totalMonth: number;

    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: TransactionDTO })
    @IsArray()
    data: TransactionDTO[];
}
