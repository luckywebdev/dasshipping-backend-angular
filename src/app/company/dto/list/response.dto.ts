import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { CompanyDTO } from '../../../../dto/company.dto';

export class GetCompanyListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: CompanyDTO })
    @IsArray()
    data: CompanyDTO[];
}
