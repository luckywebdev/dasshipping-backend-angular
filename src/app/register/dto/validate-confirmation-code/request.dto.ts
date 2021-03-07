import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class ValidateConfirmationCodeRequest {
    @ApiModelProperty()
    @IsString()
    @Length(6)
    code: string;

    @ApiModelProperty()
    @IsEmail()
    email: string;
}
