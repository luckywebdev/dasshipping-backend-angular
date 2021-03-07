import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VinScanResponse {
    @ApiModelProperty()
    @IsString()
    urlVin: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    height: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    length: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    width: string;

    @ApiModelProperty()
    @IsString()
    make: string;

    @ApiModelProperty()
    @IsString()
    model: string;

    @ApiModelProperty()
    @IsString()
    type: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    weight: string;

    @ApiModelProperty()
    @IsString()
    year: string;

    @ApiModelProperty()
    @IsString()
    vin: string;
}
