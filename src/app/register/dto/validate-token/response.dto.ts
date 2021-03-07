import { ApiModelProperty } from '@nestjs/swagger';

import { SuccessDTO } from '../../../../dto/success.dto';
import { InviteDTO } from '../../../../dto/invite.dto';

export class ValidateTokenResponse extends SuccessDTO {
    @ApiModelProperty()
    invite: InviteDTO;
}
