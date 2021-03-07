import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WalletRequestDTO {
    @ApiModelProperty()
    @IsString()
    token: string;
}
