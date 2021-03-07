import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { OrderTimelineDTO } from '../../../../dto/orderTimeline.dto';
import { ResponseListDTO } from '../../../dto/responseList.dto';

export class GetOrderTimelineListResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: OrderTimelineDTO })
    @IsArray()
    data: OrderTimelineDTO[];
}
