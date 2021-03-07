import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsNumberString, IsOptional, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CompanyFilesDTO } from './companyFiles.dto';
import { DispatchDTO } from './dispatch.dto';
import { InviteDTO } from './invite.dto';
import { JoinRequestDTO } from './joinRequest.dto';
import { NotificationDTO } from './notification.dto';
import { OrderDTO } from './order.dto';

export class CompanyDTO {
    @ApiModelProperty()
    @IsString()
    address: string;

    @ApiModelProperty()
    @IsString()
    avatarUrl: string;

    @ApiModelProperty()
    @IsBoolean()
    blocked: boolean;

    @ApiModelProperty()
    @IsString()
    city: string;

    @ApiModelProperty()
    @IsString()
    contactPersonFirstName: string;

    @ApiModelProperty()
    @IsString()
    contactPersonLastName: string;

    @ApiModelProperty()
    @IsString()
    contactPersonPhone: string;

    @ApiModelProperty()
    @IsString()
    dotNumber: string;

    @ApiModelProperty()
    @IsEmail()
    email: string;

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelProperty()
    @IsString()
    insuranceUrl: string;

    @ApiModelProperty()
    @IsString()
    mcCertificateUrl: string;

    @ApiModelProperty()
    @IsString()
    msNumber: string;

    @ApiModelProperty()
    @IsString()
    name: string;

    @ApiModelProperty()
    @IsString()
    officePhone: string;

    @ApiModelProperty()
    @IsString()
    state: string;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty()
    @IsString()
    zip: string;

    @ApiModelPropertyOptional()
    notifications?: NotificationDTO[];

    @ApiModelPropertyOptional()
    accounts: AccountDTO[];

    @ApiModelPropertyOptional()
    invites: InviteDTO[];

    @ApiModelPropertyOptional()
    joinRequests: JoinRequestDTO[];

    @ApiModelPropertyOptional()
    orders: OrderDTO[];

    @ApiModelPropertyOptional()
    dispatches: DispatchDTO[];

    @ApiModelProperty()
    @IsDateString()
    @IsOptional()
    createdAt: Date;

    @ApiModelProperty()
    @IsDateString()
    @IsOptional()
    updatedAt: Date;

    @ApiModelPropertyOptional()
    files: CompanyFilesDTO[];
}
