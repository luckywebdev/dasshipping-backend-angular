import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DeclineCarrierInviteRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;
}
