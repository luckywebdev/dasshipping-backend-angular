import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { ResponseListDTO } from '../../../dto/responseList.dto';
import { ReportsByShipperDTO } from './reports-by-shipper.dto';

export class GetReportsByShipperResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: ReportsByShipperDTO })
    @IsArray()
    data: ReportsByShipperDTO[];
}
