import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Length } from 'class-validator';

import { LanguageDTO } from '../../../../dto/language.dto';
import { transformFileUrl } from '../../../../utils/file.util';
import { RequestAccountFilesDTO } from './requestAccountFiles.dto';

export class PatchUserRequest {
    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @Transform(transformFileUrl)
    @IsString()
    avatarUrl?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    email?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    firstName: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    lastName: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsDateString()
    birthday: Date;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    address?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    city?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    state?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    zip?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    dlNumber: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    phoneNumber: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsNumber()
    genderId: number;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsArray()
    files?: RequestAccountFilesDTO[];

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsArray()
    languages?: LanguageDTO[];

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsNumber()
    payRate?: number;
}
