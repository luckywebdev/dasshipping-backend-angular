import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ValidateResetPasswordTokenRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;
}
