import {ApiModelProperty} from '@nestjs/swagger';
import {IsIn, IsOptional, IsString} from 'class-validator';
export enum OrderRelations {
    pickLocation = 'pickLocation',
    deliveryLocation = 'deliveryLocation',
    company = 'company',
    sender = 'sender',
    receiver = 'receiver',
    driver = 'driver',
}
export class IncludeOrderRelationsDTO {
    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    @IsIn([...Object.keys(OrderRelations).map(key => OrderRelations[key])])
    vehicleType: string;
}
