import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CalculateTripDTO {
    @ApiModelProperty()
    @IsString()
    origin: string;

    @ApiModelProperty()
    @IsString()
    destination: string;

    @ApiModelProperty()
    @IsBoolean()
    isStartPoint: boolean;

    @ApiModelProperty()
    @IsBoolean()
    @IsOptional()
    isEndPoint: boolean;

    @ApiModelProperty()
    @IsBoolean()
    @IsOptional()
    isVirtual: boolean;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    cost: number;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    originPoint: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    destinationPoint: string;


    @ApiModelProperty()
    @IsNumber()
    key: number;
}
