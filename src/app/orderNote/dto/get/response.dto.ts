import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import {ResponseListDTO} from '../../../dto/responseList.dto';
import {OrderNoteDTO} from '../../../../dto/orderNote.dto';

export class GetOrderNotesListResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: OrderNoteDTO })
    @IsArray()
    data: OrderNoteDTO[];
}
