import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max } from 'class-validator';

export class GetJoinedRequests {
    @ApiModelPropertyOptional()
    @IsNumber()
    @Max(10)
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    limit?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    offset?: number;

    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    orderByDirection?: 'ASC' | 'DESC';

    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsOptional()
    orderByField?: string;
}
