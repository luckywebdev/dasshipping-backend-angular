import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Length } from 'class-validator';

import { LanguageDTO } from '../../../../dto/language.dto';
import { transformFileUrl } from '../../../../utils/file.util';
import { RequestAccountFilesDTO } from '../patch/requestAccountFiles.dto';

export class AccountEditRequest {
    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    address?: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    @Transform(transformFileUrl)
    avatarUrl?: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    city?: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsNumber()
    genderId: number;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    receiveNotifications?: boolean;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    state?: string;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    zip?: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsDateString()
    birthday: Date;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    phoneNumber: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsString()
    dlNumber: string;

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
    @Length(1, 255)
    @IsString()
    companyName?: string;

    payRate?: number;
}
