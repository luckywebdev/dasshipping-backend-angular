import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DeclineAccountInviteRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;
}
