import { ApiModelProperty } from '@nestjs/swagger';
import {IsEmail, IsString, Length} from 'class-validator';

export class VirtualAccountsRequestDTO {

    @ApiModelProperty()
    @IsEmail()
    @Length(1, 255)
    email: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    phoneNumber: string;
}
