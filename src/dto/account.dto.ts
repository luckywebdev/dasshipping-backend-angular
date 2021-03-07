import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Length } from 'class-validator';

import { AccountFilesDTO } from './accountFiles.dto';
import { CompanyDTO } from './company.dto';
import { DispatchDTO } from './dispatch.dto';
import { DriverLocationDTO } from './driverLocation.dto';
import { GenderDTO } from './gender.dto';
import { LanguageDTO } from './language.dto';
import { NotificationDTO } from './notification.dto';
import { OrderDTO } from './order.dto';
import { ResetTokenDTO } from './resetToken.dto';
import { RoleDTO } from './role.dto';
import { TrailerDTO } from './trailer.dto';
import { TruckDTO } from './truck.dto';

export class AccountDTO {

    @ApiModelProperty()
    @IsString()
    address: string;

    @ApiModelProperty()
    @IsBoolean()
    approved: boolean;

    @ApiModelProperty()
    @IsString()
    avatarUrl: string;

    @ApiModelProperty()
    @IsBoolean()
    blocked: boolean;

    @ApiModelProperty()
    @IsString()
    city: string;

    @ApiModelPropertyOptional()
    @IsOptional()
    company?: CompanyDTO;

    @ApiModelProperty()
    @IsNumber()
    companyId: number;

    @ApiModelProperty()
    @IsBoolean()
    deleted: boolean;

    @ApiModelProperty()
    @IsString()
    dlNumber: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    email: string;

    @ApiModelProperty()
    @IsBoolean()
    emailConfirmed: boolean;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiModelProperty()
    @IsNumber()
    gender: GenderDTO;

    @ApiModelProperty()
    @IsNumber()
    genderId: number;

    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsOptional()
    notifications?: NotificationDTO[];

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    notificationsCount?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    notificationOrders?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    notificationCompanies?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    notificationUsers?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    notificationQuotes?: number;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiModelProperty()
    @IsString()
    @Length(1, 255)
    phoneNumber: string;

    @ApiModelProperty()
    @IsDateString()
    birthday: Date;

    @ApiModelProperty()
    @IsBoolean()
    receiveNotifications: boolean;

    @ApiModelPropertyOptional()
    @IsOptional()
    role?: RoleDTO;

    @ApiModelProperty()
    @IsNumber()
    roleId: number;

    @ApiModelProperty()
    @IsOptional()
    @IsNumber()
    truck?: TruckDTO;

    @ApiModelProperty()
    @IsOptional()
    @IsNumber()
    trailer?: TrailerDTO;

    @ApiModelProperty()
    @IsString()
    state: string;

    @ApiModelProperty()
    @IsString()
    zip: string;

    @ApiModelProperty()
    dispatcher: AccountDTO;

    @ApiModelProperty()
    files: AccountFilesDTO[];

    @ApiModelProperty()
    languages: LanguageDTO[];

    @ApiModelProperty()
    @IsString()
    signatureUrl: string;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    dispatcherId?: number;

    @ApiModelProperty()
    @IsOptional()
    orders?: OrderDTO[];

    @ApiModelProperty()
    @IsOptional()
    tokens?: ResetTokenDTO[];

    @ApiModelProperty()
    @IsOptional()
    dispatches?: DispatchDTO[];

    @ApiModelProperty()
    @IsOptional()
    locations?: DriverLocationDTO[];

    @ApiModelProperty()
    @IsString()
    companyName: string;

    @ApiModelProperty()
    @IsBoolean()
    termsOfServiceAccepted: boolean;
}
