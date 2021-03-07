import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';

export class RoleDTO {
    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    @IsString()
    name: string;
}
