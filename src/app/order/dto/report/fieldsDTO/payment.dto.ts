import { ApiModelProperty } from '@nestjs/swagger';
import {IsBoolean, IsOptional, IsString} from 'class-validator';

export class OrdersCustomReportPaymentFields {
    @ApiModelProperty({ required: true })
    @IsBoolean()
    terms: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    status: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    amount: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    BrokerFee: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    method: boolean;
}
