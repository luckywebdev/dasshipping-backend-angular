import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

import { transformFileUrl } from '../../../../utils/file.util';
import { RequestAccountFilesDTO } from '../../../account/dto/patch/requestAccountFiles.dto';

export class PatchCompanyRequest {
    @ApiModelProperty()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(transformFileUrl)
    avatarUrl?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    contactPersonFirstName?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    contactPersonLastName?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    contactPersonPhone?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Transform(transformFileUrl)
    insuranceUrl?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Transform(transformFileUrl)
    mcCertificateUrl?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    officePhone?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    zip?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsArray()
    files?: RequestAccountFilesDTO[];
}
