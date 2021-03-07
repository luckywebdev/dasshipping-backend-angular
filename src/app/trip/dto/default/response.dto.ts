import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';


export class CalculateRoute {
    @ApiModelProperty()
    @IsString()
    route: string[];

    @ApiModelProperty()
    @IsNumber()
    totalPrice: number;

    @ApiModelProperty()
    @IsNumber()
    distance: number;

    @ApiModelProperty()
    @IsNumber()
    pickLocationId: number;

    @ApiModelProperty()
    @IsNumber()
    deliveryLocationId: number;
}
