import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, Length } from 'class-validator';

export class ForgotPasswordRequest {
    @ApiModelProperty()
    @IsEmail()
    @Length(1, 255)
    email: string;
}
