import { ApiModelProperty } from '@nestjs/swagger';
import {IsIn, IsString} from 'class-validator';

export enum SOURCE_TYPE {
    DRIVER_APP = 'driver_app',
    CLIENT_APP = 'client_app',
}

export class SignedByDTO {
    @ApiModelProperty()
    @IsIn([SOURCE_TYPE.DRIVER_APP, SOURCE_TYPE.CLIENT_APP])
    @IsString()
    source: string;

    @ApiModelProperty()
    @IsString()
    firstName: string;

    @ApiModelProperty()
    @IsString()
    lastName: string;
}
