import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class CarrierInviteRequest {
    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    address?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    city?: string;

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
    @Length(1, 255)
    contactPersonPhone?: string;

    @ApiModelProperty()
    @IsNumberString()
    dotNumber: string;

    @ApiModelProperty()
    @IsEmail()
    email: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    insuranceUrl?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    mcCertificateUrl?: string;

    @ApiModelProperty()
    @IsNumberString()
    msNumber: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    name: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    officePhone?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    state?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    zip?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsNumber()
    orderId?: number;
}
