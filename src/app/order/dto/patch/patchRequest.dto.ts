import { ApiModelProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';

import { LocationDTO } from '../../../../dto/location.dto';
import {Type} from 'class-transformer';
import {CarDTO} from '../../../../dto/car.dto';
import {VirtualAccountDTO} from '../../../../dto/virtualAccount.dto';

export class PatchOrderRequestDTO {
    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    id?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    trailerType?: string;

    @ApiModelProperty({ required: false })
    @Type(() => LocationDTO)
    @IsOptional()
    pickLocation?: LocationDTO;

    @ApiModelProperty({ isArray: true, type: CarDTO })
    @ValidateNested({ each: true })
    @Type(() => CarDTO)
    @IsOptional()
    cars?: CarDTO[];

    @ApiModelProperty({ required: false })
    @Type(() => LocationDTO)
    @IsOptional()
    deliveryLocation?: LocationDTO;

    @ApiModelProperty({ required: false })
    @Type(() => VirtualAccountDTO)
    @IsOptional()
    sender?: VirtualAccountDTO;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    senderId?: number;

    @ApiModelProperty({ required: false })
    @Type(() => VirtualAccountDTO)
    @IsOptional()
    receiver?: VirtualAccountDTO;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    receiverId?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    companyId?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    tripId?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    driverId?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    pickInstructions?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    deliveryInstructions?: string;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    pickDate?: Date;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    deliveryDate?: Date;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    hash?: string;
}
