import {ApiModelProperty} from '@nestjs/swagger';
import {IsNumber, IsString, Length} from 'class-validator';

export class DriverLocationPartialDTO {

    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsNumber()
    lat: number;

    @ApiModelProperty()
    @IsNumber()
    lon: number;

    @ApiModelProperty()
    @IsString()
    avatarUrl: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    companyName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    phoneNumber: string;
}
