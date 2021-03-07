import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {Equals, IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUrl, Length} from 'class-validator';

import {stringToBoolean} from '../../../../transformers/stringToBoolean.transformer';

export class CarrierNewRegisterRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    address: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    city: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    contactPersonFirstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    contactPersonLastName: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    contactPersonPhone: string;

    @ApiModelProperty()
    @IsNumber()
    dotNumber: string;

    @ApiModelProperty()
    @IsEmail()
    @Length(1, 255)
    email: string;

    @ApiModelProperty()
    @IsUrl()
    @Length(1, 255)
    insuranceUrl: string;

    @ApiModelProperty()
    @IsUrl()
    @Length(1, 255)
    mcCertificateUrl: string;

    @ApiModelProperty()
    @IsNumber()
    msNumber: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    name: string;

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

    @ApiModelProperty({required: true})
    @Transform(stringToBoolean)
    @IsBoolean()
    @Equals(true, {message: 'Agree terms of service is required'})
    termsOfServiceAccepted: boolean;
}
