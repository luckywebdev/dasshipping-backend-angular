import { ApiModelProperty} from '@nestjs/swagger';
import { IsDate, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';

export class TrailerDTO {

    @ApiModelProperty()
    @IsNumberString()
    public id: number;

    @ApiModelProperty()
    public account: AccountDTO;

    @ApiModelProperty()
    @IsString()
    public type: string;

    @ApiModelProperty()
    @IsString()
    public VINNumber: string;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    public year?: number;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public make?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public model?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public fuelPerMile?: string;

    @ApiModelProperty()
    @IsDate()
    public createdAt: Date;

    @ApiModelProperty()
    @IsDate()
    public updatedAt: Date;
}
