import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GeneralPatchDTO {
    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    minimumProfitPercentage?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    recommendedProfitPercentage?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    inopAdditionalPricePercentage: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    enclosedAdditionalPricePercentage: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    serviceAbsoluteFee: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    creditCardPaymentFee: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    achPaymentFee: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    minimalSalePrice: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    liftedPercentage?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    headRackPercentage?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    utilityBedPercentage?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    handicapPercentage?: number;
}
