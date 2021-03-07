import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { InviteEntity } from '../../../../entities/invite.entity';

export class GetCompanyInvitesListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: InviteEntity })
    @IsArray()
    data: InviteEntity[];
}
