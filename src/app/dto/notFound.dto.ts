import { ApiModelProperty } from '@nestjs/swagger';

export class NotFoundDTO {
    @ApiModelProperty({ default: 'Not Found' })
    error: 'string';

    @ApiModelProperty()
    message: string;

    @ApiModelProperty({ default: 404 })
    statusCode: number;
}
