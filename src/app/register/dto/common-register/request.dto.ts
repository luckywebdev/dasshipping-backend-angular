import {ApiModelProperty} from '@nestjs/swagger';
import {IsOptional, IsString, Length} from 'class-validator';

export class CommonRegisterRequest {
    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    hash: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    password: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    token: string;
}
