import { ApiModelProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsBoolean,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';
import moment = require('moment');

import { CarDTO } from '../../../../dto/car.dto';
import { LocationDTO } from '../../../../dto/location.dto';

export class OrderPatchClientRequest {
    @ApiModelProperty({ isArray: true, type: CarDTO })
    @ValidateNested({ each: true })
    @Type(() => CarDTO)
    @IsNotEmpty()
    @ArrayMinSize(1)
    @ArrayMaxSize(5)
    cars: CarDTO[];

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    pickLocation: LocationDTO;

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    deliveryLocation: LocationDTO;

    @ApiModelProperty({ required: false })
    @Transform(date => moment(date).toISOString())
    @IsDateString()
    @IsOptional()
    endDate: Date;

    @ApiModelProperty({ required: false })
    @Transform(date => moment(date).toISOString())
    @IsDateString()
    @IsOptional()
    startDate: Date;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    pickContactPersonFirstName: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    pickContactPersonLastName: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    pickContactPersonPhone: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    pickContactPersonEmail: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryContactPersonFirstName: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryContactPersonLastName: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryContactPersonPhone: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryContactPersonEmail: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    pickInstructions: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryInstructions: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    enclosed: boolean;
}
