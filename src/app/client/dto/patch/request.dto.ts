import {ApiModelProperty} from '@nestjs/swagger';
import {IsOptional, ValidateNested} from 'class-validator';
import { Type} from 'class-transformer';
import {CarDTO} from '../../../../dto/car.dto';

export class PatchQuoteRequest {
    @ApiModelProperty({isArray: true, type: CarDTO})
    @ValidateNested({each: true})
    @Type(() => CarDTO)
    @IsOptional()
    cars?: CarDTO[];
}
