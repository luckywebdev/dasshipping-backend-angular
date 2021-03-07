import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { InspectionImagesDTO } from '../../../../dto/inspectionImages.dto';
import { LocationDTO } from '../../../../dto/location.dto';
import { INSPECTION_TYPE } from '../../../../entities/inspection.entity';
import { CreateInspectionDetailsDTO } from './createInspectionDetails.dto';

export class CreateInspectionDTO {
    @ApiModelProperty({ required: true })
    @IsString()
    @IsIn([INSPECTION_TYPE.DELIVERY, INSPECTION_TYPE.PICKUP])
    type: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    vinNumberConfirmed?: boolean;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    clientId?: number;

    @ApiModelProperty({ required: true })
    @IsNumber()
    carId: number;

    @ApiModelProperty({ required: true })
    @IsNumber()
    orderId: number;

    @ApiModelProperty({ isArray: true, type: CreateInspectionDetailsDTO })
    @ValidateNested({ each: true })
    @Type(() => CreateInspectionDetailsDTO)
    @IsOptional()
    details?: CreateInspectionDetailsDTO[];

    @ApiModelProperty({ isArray: true, type: InspectionImagesDTO })
    @ValidateNested({ each: true })
    @Type(() => InspectionImagesDTO)
    @IsOptional()
    images?: InspectionImagesDTO[];

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    driverNotes: string;

    @ApiModelProperty({ type: LocationDTO })
    @Type(() => LocationDTO)
    @IsOptional()
    createdLocation: LocationDTO;
}
