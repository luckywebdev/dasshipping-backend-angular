import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

import { AccountDTO } from '../../../../dto/account.dto';
import { transformFileUrl } from '../../../../utils/file.util';

export class RequestAccountFilesDTO {
    @ApiModelPropertyOptional()
    @Length(1, 255)
    @Transform(transformFileUrl)
    @IsString()
    path: string;

    @ApiModelPropertyOptional()
    @Length(1, 255)
    @IsString()
    displayName: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    account?: AccountDTO;

    @ApiModelPropertyOptional()
    @IsOptional()
    @Length(1, 255)
    @IsNumber()
    id?: number;
}
