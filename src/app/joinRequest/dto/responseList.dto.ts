import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import {JoinRequestDTO} from '../../../dto/joinRequest.dto';

export class GetJoinedRequestsResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: JoinRequestDTO })
    @IsArray()
    data: JoinRequestDTO[];
}
