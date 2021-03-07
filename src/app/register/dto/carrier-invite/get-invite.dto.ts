import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class GetInviteRequest {
    @ApiModelProperty()
    @IsNumberString()
    dotNumber: string;

    @ApiModelProperty()
    @IsNumberString()
    msNumber: string;
}
