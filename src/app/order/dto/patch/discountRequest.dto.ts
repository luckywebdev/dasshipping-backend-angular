import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min} from 'class-validator';

export class DiscountRequestDTO {
    @ApiModelProperty({ required: true })
    @IsNumber()
    @Min(0)
    @Max(100)
    discount: number;
}
