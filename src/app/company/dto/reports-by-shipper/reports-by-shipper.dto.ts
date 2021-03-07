import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ReportsByShipperDTO {

    @ApiModelProperty()
    @IsString()
    // tslint:disable-next-line: variable-name
    shipper_companyName: string;

    @ApiModelProperty()
    @IsNumber()
    totalRevenue: number;

    @ApiModelProperty()
    @IsNumber()
    totalPaid: number;

    @ApiModelProperty()
    @IsNumber()
    totalDue: number;

    @ApiModelProperty()
    @IsNumber()
    totalPastDue: number;
}
