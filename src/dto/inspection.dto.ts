import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CarDTO } from './car.dto';
import { InspectionDetailsDTO } from './inspectionDetails.dto';
import { InspectionImagesDTO } from './inspectionImages.dto';
import { LocationDTO } from './location.dto';
import { OrderDTO } from './order.dto';
import { SignedByDTO } from './signedBy.dto';

export class InspectionDTO {
    @ApiModelProperty({ required: true })
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsString()
    type: string;

    @ApiModelProperty()
    @IsBoolean()
    vinNumberConfirmed: boolean;

    @ApiModelProperty({ type: AccountDTO })
    driver: AccountDTO;

    @ApiModelProperty({ type: AccountDTO })
    client: AccountDTO;

    @ApiModelProperty({ type: AccountDTO })
    createdBy: AccountDTO;

    @ApiModelProperty({ type: LocationDTO })
    createdLocation: LocationDTO;

    @ApiModelProperty({ type: LocationDTO })
    signLocation: LocationDTO;

    @ApiModelProperty({ type: CarDTO })
    car: CarDTO;

    @ApiModelProperty({ type: InspectionDetailsDTO })
    details: InspectionDetailsDTO[];

    @ApiModelProperty()
    @IsString()
    signatureUrl: string;

    @ApiModelProperty()
    @IsDate()
    signedAt: Date;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty({ type: OrderDTO })
    order: OrderDTO;

    @ApiModelProperty({ type: InspectionImagesDTO })
    images: InspectionImagesDTO[];

    @ApiModelProperty({ type: SignedByDTO })
    signedBy: SignedByDTO;

    @ApiModelProperty()
    @IsString()
    driverNotes: string;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsDate()
    updatedAt: Date;

    @ApiModelProperty()
    @IsNumber()
    driverId?: number;

    @ApiModelProperty()
    @IsNumber()
    clientId?: number;

    @ApiModelProperty()
    @IsNumber()
    createdById?: number;

    @ApiModelProperty()
    @IsNumber()
    createdLocationId?: number;

    @ApiModelProperty()
    @IsNumber()
    signLocationId?: number;

    @ApiModelProperty()
    @IsNumber()
    carId?: number;

    @ApiModelProperty()
    @IsNumber()
    orderId?: number;
}
