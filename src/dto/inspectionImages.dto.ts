import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InspectionImagesDTO {
    @ApiModelProperty()
    @IsString()
    type: string;

    @ApiModelProperty()
    @IsString()
    url: string;
}
