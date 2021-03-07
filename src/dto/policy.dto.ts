import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsNumberString } from 'class-validator';

export class PolicyDTO {
    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    @IsNumber()
    price: number;

    @ApiModelProperty()
    type: string;

    @ApiModelProperty()
    @IsBoolean()
    isNew: boolean;
}
