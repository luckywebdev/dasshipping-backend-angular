import { ApiModelProperty } from '@nestjs/swagger';

export class RefreshTokenResponse {
    @ApiModelProperty()
    accessToken: string;

    @ApiModelProperty()
    expiresIn: number;

    @ApiModelProperty()
    refreshToken: string;
}
