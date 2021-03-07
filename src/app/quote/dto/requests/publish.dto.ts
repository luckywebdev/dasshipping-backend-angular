import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Length, ValidateNested, IsBoolean } from 'class-validator';

import { LocationDTO } from '../../../../dto/location.dto';
import { VirtualAccountsRequestDTO } from '../../../account/dto/virtual/request.dto';
import { AddAttachmentToOrderRequest } from '../../../orderAttachment/dto/post/request.dto';

export class QuotePublishRequest {
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
    pickInstructions: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    deliveryInstructions: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    paymentDelivery?: boolean;

    @ApiModelProperty()
    @IsDateString()
    pickDate: Date;

    @ApiModelProperty()
    @IsDateString()
    deliveryDate: Date;

    @ApiModelProperty({ required: false })
    @Type(() => LocationDTO)
    @IsOptional()
    pickLocation?: LocationDTO;

    @ApiModelProperty({ required: false })
    @Type(() => LocationDTO)
    @IsOptional()
    deliveryLocation?: LocationDTO;

    @ApiModelProperty({ isArray: true, type: AddAttachmentToOrderRequest })
    @ValidateNested({ each: true })
    @Type(() => AddAttachmentToOrderRequest)
    @IsOptional()
    attachments?: AddAttachmentToOrderRequest[];
}
