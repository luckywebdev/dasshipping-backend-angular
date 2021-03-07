import { ApiModelProperty } from '@nestjs/swagger';

export class SuccessResponseDTO {
    @ApiModelProperty({ default: 'success' })
    status?: string = 'success';

    @ApiModelProperty()
    message: string;

    @ApiModelProperty({ default: 200 })
    statusCode?: number = 200;
}
