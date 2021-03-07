import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindCarByVinRequest {
    @ApiModelProperty()
    @IsString()
    vin: string;
}
