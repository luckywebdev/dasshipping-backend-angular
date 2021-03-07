import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddressValidationResponsetDTO {
    @ApiModelProperty()
    matchLevel: string;

    @ApiModelProperty()
    relevance: number;
}
