import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DetailsWalletDTO {
    @ApiModelProperty()
    @IsString()
    @IsOptional()
    bin?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    last2?: string;

    @ApiModelProperty()
    @IsString()
    last4: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    cardType?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    routingNumber?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    expirationYear?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    expirationMonth?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    expirationDate?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    maskedNumber?: string;
}
