import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BlockAccountRequest {
    @ApiModelProperty()
    @IsBoolean()
    blocked: boolean;

    @ApiModelPropertyOptional()
    @IsString()
    @IsOptional()
    reason?: string;
}
