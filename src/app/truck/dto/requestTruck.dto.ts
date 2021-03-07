import { ApiModelProperty} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import {AccountDTO} from '../../../dto/account.dto';

export class RequestTruckDTO {

    @ApiModelProperty()
    @IsNumber()
    public accountId: number;

    @ApiModelProperty()
    @IsString()
    public type: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public VINNumber?: string;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    public year?: number;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public make?: string;

    @ApiModelProperty()
    @IsOptional()
    public account?: AccountDTO;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public model?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    public fuelPerMile?: string;
}
