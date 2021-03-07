import { ApiModelProperty } from '@nestjs/swagger';
import { ValidateNested, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class TripDeleteOrderRequest {
    @ApiModelProperty({ isArray: true })
    @ValidateNested({ each: true })
    @IsNotEmpty()
    @ArrayMinSize(1)
    orderIds: number[];
}
