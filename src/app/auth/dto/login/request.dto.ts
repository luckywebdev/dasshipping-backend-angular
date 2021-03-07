import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class LoginRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    email: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    password: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    token: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    mobile?: boolean;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    noCheckRecapcha?: boolean;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    deviceId?: string;
}
