import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class OrdersCustomReportGeneralFields {
    @ApiModelProperty({ required: true })
    @IsBoolean()
    importedOrderId: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    systemOrderId: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    cargo: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    vinNumbers: boolean;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    creationDate: boolean;
}
