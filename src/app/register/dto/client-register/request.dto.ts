import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsOptional, IsString, Length } from 'class-validator';

import { stringToBoolean } from '../../../../transformers/stringToBoolean.transformer';

export class ClientRegisterRequest {
    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    address: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    city: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    state: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    zip: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    email: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    password: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    phoneNumber: string;

    @ApiModelProperty({ required: true })
    @Transform(stringToBoolean)
    @IsBoolean()
    @Equals(true, { message: 'Agree terms of service is required' })
    termsOfServiceAccepted: boolean;
}
