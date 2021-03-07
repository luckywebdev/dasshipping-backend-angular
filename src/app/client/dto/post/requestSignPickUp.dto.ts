import { ApiModelProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';
import {LocationDTO} from '../../../../dto/location.dto';
import {Type} from 'class-transformer';

export class SignPickUpRequest {
    @ApiModelProperty({required: true})
    @IsString()
    signatureUrl: string;

    @ApiModelProperty()
    @IsString()
    firstName: string;

    @ApiModelProperty()
    @IsString()
    lastName: string;

    @ApiModelProperty({ type: LocationDTO })
    @Type(() => LocationDTO)
    @IsNotEmpty()
    signLocation: LocationDTO;

    source: string;

    inspectionType: string;
}
