import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsOptional, IsString, Length } from 'class-validator';

import { stringToBoolean } from '../../../../transformers/stringToBoolean.transformer';

export class CarrierRegisterRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    address: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    city: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)

    contactPersonPhone: string;
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    insuranceUrl: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    mcCertificateUrl: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    officePhone: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    state: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    zip: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    token: string;

    @ApiModelProperty({ required: true })
    @Transform(stringToBoolean)
    @IsBoolean()
    @Equals(true, { message: 'Agree terms of service is required' })
    termsOfServiceAccepted: boolean;
}
