import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional } from 'class-validator';

import { ROLES } from '../../../../constants/roles.constant';
import { stringToBoolean } from '../../../../transformers/stringToBoolean.transformer';
import { stringToNumber } from '../../../../transformers/stringToNumber.transformer';
import { GetList } from '../../../dto/requestList.dto';

export class ReportsByUserRequestDTO extends GetList {
    @ApiModelProperty({ required: false })
    @IsIn([ROLES.DISPATCHER, ROLES.DRIVER])
    @Transform(stringToNumber)
    @IsOptional()
    @IsNumber()
    role?: number;

    @ApiModelProperty({ required: false })
    @Transform(stringToBoolean)
    @IsOptional()
    @IsBoolean()
    deliveredOnly?: boolean;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsDateString()
    fromDeliveryDate?: Date;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsDateString()
    toDeliveryDate?: Date;
}
