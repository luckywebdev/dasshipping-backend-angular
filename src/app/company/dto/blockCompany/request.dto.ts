import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class BlockCompanyRequest {
    @ApiModelProperty()
    @IsBoolean()
    blocked: boolean;

    @ApiModelPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    reason: string;
}
