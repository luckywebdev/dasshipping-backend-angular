import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GeneralDTO {
    @ApiModelProperty()
    @IsNumber()
    id?: number;

    @ApiModelProperty()
    @IsNumber()
    minimumProfitPercentage: number;

    @ApiModelProperty()
    @IsNumber()
    recommendedProfitPercentage: number;

    @ApiModelProperty()
    @IsNumber()
    inopAdditionalPricePercentage: number;

    @ApiModelProperty()
    @IsNumber()
    enclosedAdditionalPricePercentage: number;

    @ApiModelProperty()
    @IsNumber()
    serviceAbsoluteFee: number;

    @ApiModelProperty()
    @IsNumber()
    minimalSalePrice: number;

    @ApiModelProperty()
    @IsNumber()
    creditCardPaymentFee: number;

    @ApiModelProperty()
    @IsNumber()
    achPaymentFee: number;

    @ApiModelProperty()
    @IsNumber()
    liftedPercentage: number;

    @ApiModelProperty()
    @IsNumber()
    headRackPercentage: number;

    @ApiModelProperty()
    @IsNumber()
    utilityBedPercentage: number;

    @ApiModelProperty()
    @IsNumber()
    handicapPercentage: number;
}
