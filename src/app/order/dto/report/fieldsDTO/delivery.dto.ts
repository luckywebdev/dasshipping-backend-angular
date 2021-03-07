import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class OrdersCustomReportDeliveryFields {
    @ApiModelProperty({ required: true })
    @IsBoolean()
    date: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    name: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    address: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    city: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    state: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    zipCode: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    phone: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    email: boolean;
}
