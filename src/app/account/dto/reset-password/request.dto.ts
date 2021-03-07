import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ResetPasswordRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;

    @ApiModelProperty()
    @IsString()
    password: string;
}
