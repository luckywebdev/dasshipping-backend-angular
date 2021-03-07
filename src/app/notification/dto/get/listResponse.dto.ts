import {ResponseListDTO} from '../../../dto/responseList.dto';
import {ApiModelProperty} from '@nestjs/swagger';
import {IsArray} from 'class-validator';
import {NotificationDTO} from '../../../../dto/notification.dto';

export class GetNotificationListResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: NotificationDTO })
    @IsArray()
    data: NotificationDTO[];
}
