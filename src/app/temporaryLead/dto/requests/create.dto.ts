import {ApiModelProperty} from '@nestjs/swagger';
import {ArrayMaxSize, ArrayMinSize, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, ValidateNested} from 'class-validator';
import {TRAILER_TYPE} from '../../../../entities/orderBase.entity';
import {Type} from 'class-transformer';
import {CreateCarDTO} from './car.dto';

export class CreateLeadDTO {
    @ApiModelProperty({required: true})
    @IsString()
    @Length(1, 100)
    @IsIn([TRAILER_TYPE.ENCLOSED, TRAILER_TYPE.OPEN])
    trailerType: string;

    @ApiModelProperty({isArray: true, type: CreateCarDTO})
    @ValidateNested({each: true})
    @Type(() => CreateCarDTO)
    @IsNotEmpty()
    @ArrayMinSize(1)
    @ArrayMaxSize(20)
    cars: CreateCarDTO[];

    @ApiModelProperty()
    @IsString()
    pickLocation: string;

    @ApiModelProperty()
    @IsString()
    deliveryLocation: string;

    @ApiModelProperty()
    @IsString()
    customerFirstName: string;

    @ApiModelProperty()
    @IsString()
    customerLastName: string;

    @ApiModelProperty()
    @IsEmail()
    @IsString()
    customerEmail: string;

    @ApiModelProperty()
    @IsString()
    notes: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    token: string;
}
