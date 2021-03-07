import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumberString} from 'class-validator';

import { AccountDTO } from './account.dto';
import { CompanyDTO } from './company.dto';

export class JoinRequestDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelPropertyOptional()
    company: CompanyDTO;

    @ApiModelProperty()
    account: AccountDTO;

    @ApiModelPropertyOptional()
    status: string;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsDate()
    updatedAt: Date;
}
