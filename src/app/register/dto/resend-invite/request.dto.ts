import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ResendInviteRequest {
    @ApiModelProperty()
    @IsArray()
    @IsString({ each: true })
    ids: string[];
}
