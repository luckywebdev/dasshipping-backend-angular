import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { CompanyDTO } from '../../../../dto/company.dto';

export class GetCompanyResponse extends CompanyDTO {
    @ApiModelProperty()
    @IsNumber()
    driversCount: number;

    @ApiModelProperty()
    @IsNumber()
    dispatchersCount: number;
}
