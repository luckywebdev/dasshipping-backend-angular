import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { ResponseListDTO } from '../../../dto/responseList.dto';
import { ReportsByUserDTO } from './reports-by-user.dto';

export class GetReportsByUserResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: ReportsByUserDTO })
    @IsArray()
    data: ReportsByUserDTO[];
}
