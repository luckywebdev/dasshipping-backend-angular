import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinCompanyRequest {
    @ApiModelProperty()
    @IsString()
    dotNumber: string;
}
