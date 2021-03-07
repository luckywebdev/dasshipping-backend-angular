import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ReportsByUserDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsNumber()
    payRate: number;

    @ApiModelProperty()
    @IsNumber()
    grossRevenue: number;

    @ApiModelProperty()
    @IsNumber()
    toPay: number;

    @ApiModelProperty()
    @IsString()
    firstName: string;

    @ApiModelProperty()
    @IsString()
    lastName: string;
}
