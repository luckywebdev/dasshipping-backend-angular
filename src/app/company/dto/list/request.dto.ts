import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

import { COMPANY_STATUSES } from '../../../../entities/company.entity';
import { GetList } from '../../../dto/requestList.dto';

export class GetCompanyListRequest extends GetList {
    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsIn([COMPANY_STATUSES.ACTIVE, COMPANY_STATUSES.REQUESTED])
    @IsOptional()
    status?: string;
}
