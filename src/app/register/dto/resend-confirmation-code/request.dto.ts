import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendConfirmationCodeRequest {
    @ApiModelProperty()
    @IsEmail()
    email: string;
}
