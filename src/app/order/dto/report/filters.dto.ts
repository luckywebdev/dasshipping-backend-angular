import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, Length } from 'class-validator';

import { ORDER_STATUS } from '../../../../entities/orderBase.entity';

export class OrdersCustomReportFilters {
    @ApiModelProperty({ required: false })
    @IsString()
    @IsIn([ORDER_STATUS.ARCHIVED, 'active'])
    @IsOptional()
    include?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsIn(['all', 'all drivers', 'all dispatchers', 'no drivers', 'no dispatcher'])
    @IsOptional()
    assignedTo?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    fromCreatedDate?: Date;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    toCreatedDate?: Date;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    fromDeliveryDate?: Date;

    @ApiModelProperty({ required: false })
    @IsDateString()
    @IsOptional()
    toDeliveryDate?: Date;

    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    orderByDirection?: 'ASC' | 'DESC';

    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsOptional()
    orderByField?: string;
}
