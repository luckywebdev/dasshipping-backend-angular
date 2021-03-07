import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GeneralReportDTO {
    @ApiModelProperty()
    @IsNumber()
    totalRevenue: number;

    @ApiModelProperty()
    @IsNumber()
    totalPastDue: number;

    @ApiModelProperty()
    @IsNumber()
    totalDue: number;

    @ApiModelProperty()
    @IsNumber()
    totalPaid: number;
}
