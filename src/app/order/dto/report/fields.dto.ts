import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

import { OrdersCustomReportDeliveryFields } from './fieldsDTO/delivery.dto';
import { OrdersCustomReportGeneralFields } from './fieldsDTO/general.dto';
import { OrdersCustomReportPaymentFields } from './fieldsDTO/payment.dto';
import { OrdersCustomReportShipperFields } from './fieldsDTO/shipper.dto';

export class OrdersCustomReportFields {
    @ApiModelProperty({ required: false })
    @IsOptional()
    general?: OrdersCustomReportGeneralFields;

    @ApiModelProperty({ required: false })
    @IsOptional()
    pickupInfo?: OrdersCustomReportDeliveryFields;

    @ApiModelProperty({ required: false })
    @IsOptional()
    deliveryInfo?: OrdersCustomReportDeliveryFields;

    @ApiModelProperty({ required: false })
    @IsOptional()
    shipperInfo?: OrdersCustomReportShipperFields;

    @ApiModelProperty({ required: false })
    @IsOptional()
    paymentInfo?: OrdersCustomReportPaymentFields;

    @ApiModelProperty({ required: true })
    @IsEmail()
    emailAddress: string;
}
