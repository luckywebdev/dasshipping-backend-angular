import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class FileDeleteRequest {
    @ApiModelProperty({ isArray: true, type: String })
    @IsArray()
    @IsString({ each: true })
    files: string[];
}
