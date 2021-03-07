import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, Length } from 'class-validator';

import { ReportsByUserRequestDTO } from './reports-by-user/request.dto';

export class DowloadReportsRequestDTO {
    @ApiModelProperty({ type: ReportsByUserRequestDTO })
    @Type(() => ReportsByUserRequestDTO)
    @IsOptional()
    filter?: ReportsByUserRequestDTO;

    @ApiModelProperty({ required: true })
    @IsEmail()
    @Length(1, 255)
    email: string;

}
