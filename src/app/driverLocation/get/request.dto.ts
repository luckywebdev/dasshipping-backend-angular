import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max } from 'class-validator';

export class GetListLocations {
    @ApiModelPropertyOptional()
    @IsNumber()
    @Max(100)
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    limit?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    offset?: number;
}
