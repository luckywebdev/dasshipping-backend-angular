import { ApiModelProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';

export class ReportsByShipperRequestDTO extends GetList {
    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsDateString()
    fromDeliveryDate?: Date;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsDateString()
    toDeliveryDate?: Date;

    @ApiModelProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    searchText?: string;
}
