import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export enum CarSpecs {
  make = 'make',
  model = 'model',
  year = 'year',
  type = 'type',
}

export class GetCarSpecsAutoCompleteRequest {
  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  year?: string;

  @ApiModelProperty({
    enum: [CarSpecs.make, CarSpecs.model, CarSpecs.year, CarSpecs.type],
  })
  @IsString()
  @IsIn([CarSpecs.make, CarSpecs.model, CarSpecs.year, CarSpecs.type])
  @Transform(type => (type === CarSpecs.type ? 'body_type' : type))
  @IsOptional()
  field?: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  input?: string;
}
