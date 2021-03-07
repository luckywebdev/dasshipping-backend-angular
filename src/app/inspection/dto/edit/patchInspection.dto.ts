import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { InspectionDetailsDTO } from '../../../../dto/inspectionDetails.dto';
import { InspectionImagesDTO } from '../../../../dto/inspectionImages.dto';
import { INSPECTION_TYPE } from '../../../../entities/inspection.entity';

export class EditInspectionDTO {
    @ApiModelProperty({ required: true })
    @IsString()
    @IsIn([INSPECTION_TYPE.DELIVERY, INSPECTION_TYPE.PICKUP])
    type: string;

    @ApiModelProperty({ required: true })
    @IsBoolean()
    @IsOptional()
    vinNumberConfirmed?: boolean;

    @ApiModelProperty({ required: true })
    @IsNumber()
    clientId: number;

    @ApiModelProperty({ required: true })
    @IsNumber()
    carId: number;

    @ApiModelProperty({ required: true })
    @IsNumber()
    orderId: number;

    @ApiModelProperty({ isArray: true, type: InspectionDetailsDTO })
    @ValidateNested({ each: true })
    @Type(() => InspectionDetailsDTO)
    @IsOptional()
    details?: InspectionDetailsDTO[];

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    driverNotes: string;

    @ApiModelProperty({ isArray: true, type: InspectionImagesDTO })
    @ValidateNested({ each: true })
    @Type(() => InspectionImagesDTO)
    @IsOptional()
    images?: InspectionImagesDTO[];
}
