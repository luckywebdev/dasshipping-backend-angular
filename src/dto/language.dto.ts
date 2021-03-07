import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsNumberString} from 'class-validator';

export class LanguageDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelPropertyOptional()
    name: string;

    @ApiModelPropertyOptional()
    iso2: string;
}
