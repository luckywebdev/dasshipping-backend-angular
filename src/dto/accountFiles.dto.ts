import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsNumberString} from 'class-validator';

import { AccountDTO } from './account.dto';

export class AccountFilesDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    account: AccountDTO;

    @ApiModelPropertyOptional()
    path: string;

    @ApiModelPropertyOptional()
    displayName: string;
}
