import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max } from 'class-validator';

export enum ACCOUNT_INVITES_ORDER_BY_FIELDS {
    ROLE = 'role',
    CREATED_AT = 'createdAt',
    EXPIRE = 'expire',
    STATUS = 'status',
}

export class GetCompanyInvitesListRequest {
    @ApiModelProperty({ required: false })
    @IsNumber()
    @Max(10)
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    limit?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    offset?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    orderByDirection?: 'ASC' | 'DESC';

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsIn([
        ACCOUNT_INVITES_ORDER_BY_FIELDS.ROLE,
        ACCOUNT_INVITES_ORDER_BY_FIELDS.CREATED_AT,
        ACCOUNT_INVITES_ORDER_BY_FIELDS.EXPIRE,
        ACCOUNT_INVITES_ORDER_BY_FIELDS.STATUS,
    ])
    @IsOptional()
    orderByField?: string;
}
