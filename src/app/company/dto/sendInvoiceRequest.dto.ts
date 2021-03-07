import {ApiModelProperty} from '@nestjs/swagger';
import {IsDateString, IsEmail, IsNotEmpty, IsOptional, Length} from 'class-validator';

export class SendInvoiceRequestDTO {

    @ApiModelProperty({  required: true })
    @IsNotEmpty()
    @IsEmail()
    @Length(1, 255)
    email: string;

    @ApiModelProperty({ required: true })
    @IsDateString()
    @IsOptional()
    dueDate?: Date;
}
