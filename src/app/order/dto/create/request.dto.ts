import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { CarDTO } from '../../../../dto/car.dto';
import { LocationDTO } from '../../../../dto/location.dto';
import { ShipperDTO } from '../../../../dto/shipper.dto';
import { TRAILER_TYPE } from '../../../../entities/orderBase.entity';
import { VirtualAccountsRequestDTO } from '../../../account/dto/virtual/request.dto';

export class OrderCreateRequest {
  @ApiModelProperty({ isArray: true, type: CarDTO })
  @ValidateNested({ each: true })
  @Type(() => CarDTO)
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  cars: CarDTO[];

  @ApiModelProperty({ type: LocationDTO })
  @Type(() => LocationDTO)
  @IsNotEmpty()
  deliveryLocation: LocationDTO;

  @ApiModelProperty({ type: LocationDTO })
  @Type(() => LocationDTO)
  @IsNotEmpty()
  pickLocation: LocationDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  initialPrice?: number;

  @ApiModelProperty({ type: VirtualAccountsRequestDTO })
  @Type(() => VirtualAccountsRequestDTO)
  @IsNotEmpty()
  sender: VirtualAccountsRequestDTO;

  @ApiModelProperty({ type: VirtualAccountsRequestDTO })
  @Type(() => VirtualAccountsRequestDTO)
  @IsNotEmpty()
  receiver: VirtualAccountsRequestDTO;

  @ApiModelProperty({ required: false })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  pickInstructions?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  deliveryInstructions?: string;

  @ApiModelProperty({ required: true })
  @IsString()
  @Length(1, 255)
  @IsIn([TRAILER_TYPE.ENCLOSED, TRAILER_TYPE.OPEN])
  trailerType?: string;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  quoteId?: number;

  @ApiModelProperty()
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiModelProperty()
  @IsBoolean()
  @IsOptional()
  isVirtual?: boolean = false;

  @ApiModelProperty({ required: false })
  @IsDateString()
  @IsOptional()
  pickDate?: Date;

  @ApiModelProperty({ required: false })
  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @ApiModelProperty({ type: ShipperDTO, required: false })
  @Type(() => ShipperDTO)
  @IsOptional()
  shipper?: ShipperDTO;

  companyId?: number;
  dispatcherId?: number;
  status?: string;
  source?: string;
}
