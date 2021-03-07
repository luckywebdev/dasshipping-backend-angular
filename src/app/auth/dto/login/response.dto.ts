import { ApiModelProperty } from '@nestjs/swagger';

export class LoginResponse {
    @ApiModelProperty()
    accessToken: string;

    @ApiModelProperty()
    expiresIn: number;

    @ApiModelProperty()
    refreshToken: string;
}
