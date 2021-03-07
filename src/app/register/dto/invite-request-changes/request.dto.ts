import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class InviteRequestChangesRequest {
    @ApiModelProperty()
    @IsArray()
    @IsString({ each: true })
    ids: string[];

    @ApiModelPropertyOptional()
    @IsString()
    @IsOptional()
    reason: string;
}
