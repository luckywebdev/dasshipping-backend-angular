import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsDate, IsDateString, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CompanyDTO } from './company.dto';
import { InviteStatusDTO } from './inviteStatus.dto';
import { NotificationDTO } from './notification.dto';
import { OrderDTO } from './order.dto';
import { RoleDTO } from './role.dto';

export class InviteDTO {
  @ApiModelPropertyOptional()
  @IsOptional()
  company?: CompanyDTO;

  @ApiModelProperty()
  @IsNumberString()
  companyId?: number;

  @ApiModelProperty()
  @IsDate()
  createdAt: Date;

  @ApiModelProperty()
  createdBy?: AccountDTO;

  @ApiModelProperty()
  @IsNumber()
  createdById?: number;

  @ApiModelProperty()
  @IsString()
  email: string;

  @ApiModelProperty()
  @IsDateString()
  expire?: Date;

  @ApiModelProperty()
  @IsBooleanString()
  extended?: boolean;

  @ApiModelProperty()
  @IsString()
  firstName: string;

  @ApiModelProperty()
  @IsString()
  hash: string;

  @ApiModelProperty()
  @IsNumberString()
  id: number;

  @ApiModelProperty()
  @IsString()
  lastName: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  role?: RoleDTO;

  @ApiModelProperty()
  @IsNumberString()
  roleId: number;

  @ApiModelPropertyOptional()
  status?: InviteStatusDTO;

  @ApiModelPropertyOptional()
  notifications?: NotificationDTO[];

  @ApiModelProperty()
  @IsNumber()
  statusId?: number;

  @ApiModelProperty()
  @IsOptional()
  order?: OrderDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  orderId?: number;

  @ApiModelProperty()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;

  @ApiModelProperty()
  @IsBooleanString()
  @IsOptional()
  offerExpired?: boolean;
}
