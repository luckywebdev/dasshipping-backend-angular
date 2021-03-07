import { ApiModelProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class SaveSignatureRequest {
    @ApiModelProperty({required: true})
    @IsNotEmpty()
    @IsString()
    signatureUrl: string;
}
