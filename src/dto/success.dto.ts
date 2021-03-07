import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SuccessDTO {
    @ApiModelProperty()
    @IsBoolean()
    success: boolean;
}
