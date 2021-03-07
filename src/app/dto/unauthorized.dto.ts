import { ApiModelProperty } from '@nestjs/swagger';

export class UnauthorizedDTO {
    @ApiModelProperty({ default: 'Invalid access token' })
    message: string;

    @ApiModelProperty({ default: 401 })
    statusCode: number;
}
