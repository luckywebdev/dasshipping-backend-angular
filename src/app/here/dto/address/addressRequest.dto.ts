import { ApiModelProperty } from '@nestjs/swagger';
import {IsOptional, IsString} from 'class-validator';

export class AddressRequestDTO {
    @ApiModelProperty()
    @IsString()
    address: string;

    @ApiModelProperty()
    @IsString()
    state: string;

    @ApiModelProperty()
    @IsString()
    zipCode: string;

    @ApiModelProperty()
    @IsString()
    city: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    country: string;
}
