import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FileSignResponse {
    @ApiModelProperty()
    @IsString()
    filename: string;

    @ApiModelProperty()
    @IsString()
    url: string;
}
