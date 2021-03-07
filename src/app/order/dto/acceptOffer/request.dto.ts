import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';

import { LocationDTO } from '../../../../dto/location.dto';

export class AcceptOfferRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    pickContactPersonFirstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    pickContactPersonLastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    pickContactPersonPhone: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    pickContactPersonEmail: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    deliveryContactPersonFirstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    deliveryContactPersonLastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    deliveryContactPersonPhone: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    deliveryContactPersonEmail: string;

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    deliveryLocation: LocationDTO;

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    pickLocation: LocationDTO;
}
