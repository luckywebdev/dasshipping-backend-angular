import { ApiModelProperty } from '@nestjs/swagger';

export class BadRequestDTO {
    @ApiModelProperty({ default: 'Bad Request' })
    error: 'string';

    @ApiModelProperty()
    message: string;

    @ApiModelProperty({ default: 400 })
    statusCode: number;
}
