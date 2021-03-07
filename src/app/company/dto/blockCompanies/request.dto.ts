import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumberString } from 'class-validator';

import { BlockCompanyRequest } from '../blockCompany/request.dto';

export class BlockCompaniesRequest extends BlockCompanyRequest {
    @ApiModelProperty()
    @IsArray()
    @IsNumberString({ each: true })
    ids: string[];
}
