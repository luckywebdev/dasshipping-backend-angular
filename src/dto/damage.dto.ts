import { ApiModelProperty } from '@nestjs/swagger';
import {IsBoolean, IsString} from 'class-validator';

export class DamageDTO {
    @ApiModelProperty()
    @IsString()
    top: string;

    @ApiModelProperty()
    @IsString()
    left: string;

    @ApiModelProperty()
    @IsString()
    type: string;

    @ApiModelProperty({ default: false })
    @IsBoolean()
    isDeliveryDamage: boolean = false;
}
