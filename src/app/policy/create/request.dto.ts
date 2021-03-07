import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PolicyCreateRequest {
    @ApiModelProperty()
    @IsNumber()
    price: number;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    type: string;
}
