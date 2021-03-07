import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RefreshTokenRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    refreshToken: string;
}
