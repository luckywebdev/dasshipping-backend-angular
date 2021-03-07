import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class NotificationRequestDTO {
    @ApiModelProperty()
    @IsString()
    type: string;

    @ApiModelProperty({ isArray: true })
    @IsArray()
    actions: string[];

    @ApiModelProperty()
    @IsString()
    title: string;

    @ApiModelProperty()
    @IsString()
    content: string;

    @ApiModelProperty()
    @IsNumber()
    targetUserId: number;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    additionalInfo?: string;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    orderId?: number;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    companyId?: number;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    accountId?: number;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    inviteId?: number;
}
