import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsString, Length } from 'class-validator';

import { ROLES } from '../../../../constants/roles.constant';

export class AccountInviteRequest {
    @ApiModelProperty()
    @IsEmail()
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
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsIn([ROLES.DISPATCHER, ROLES.DRIVER, ROLES.ACCOUNTANT, ROLES.AGENT])
    roleId: ROLES.DISPATCHER | ROLES.DRIVER | ROLES.ACCOUNTANT;
}
