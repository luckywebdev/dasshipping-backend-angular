import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsNumberString} from 'class-validator';

import {CompanyDTO} from './company.dto';

export class CompanyFilesDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    company: CompanyDTO;

    @ApiModelPropertyOptional()
    path: string;

    @ApiModelPropertyOptional()
    displayName: string;
}
