import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { GetList } from '../../../dto/requestList.dto';
import { TRAILER_TYPE } from '../../../../entities/orderBase.entity';

export class GetLeadsRequest extends GetList {
  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  minimumNumberOfVehiclesPerLoad?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsIn([TRAILER_TYPE.ENCLOSED, TRAILER_TYPE.OPEN])
  @IsOptional()
  trailerType?: string;
}
