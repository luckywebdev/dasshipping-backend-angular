import { ApiModelProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';

export class TripEditRequest {
    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    name?: string;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    driverId: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsValidId('account', { message: 'Invalid Dispatcher' })
    @IsOptional()
    dispatcherId: number;

    @ApiModelProperty({ isArray: true })
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @IsOptional()
    orderIds: number[];
}
