import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CompanyDTO } from './company.dto';
import { DispatchDTO } from './dispatch.dto';
import { InspectionDTO } from './inspection.dto';
import { OrderAttachmentDTO } from './orderAttachment.dto';
import { OrderBaseDTO } from './orderBase.dto';
import { OrderNoteDTO } from './orderNote.dto';
import { ShipperDTO } from './shipper.dto';
import { OrderToTripDTO } from './tripToOrder.dto';
import { VirtualAccountDTO } from './virtualAccount.dto';

export class OrderDTO extends OrderBaseDTO {
  @ApiModelProperty({ type: CompanyDTO })
  company: CompanyDTO;

  @ApiModelProperty()
  @IsNumber()
  companyId: number;

  @ApiModelProperty()
  orderTrips: OrderToTripDTO[];

  @ApiModelProperty()
  driver: AccountDTO;

  @ApiModelProperty()
  sender: VirtualAccountDTO;

  @ApiModelProperty()
  @IsNumber()
  senderId: number;

  @ApiModelProperty()
  receiver: VirtualAccountDTO;

  @ApiModelProperty()
  @IsNumber()
  receiverId: number;

  @ApiModelProperty()
  @IsArray()
  notes: OrderNoteDTO[];

  @ApiModelProperty()
  @IsArray()
  attachments: OrderAttachmentDTO[];

  @ApiModelProperty()
  @IsBoolean()
  published: boolean;

  @ApiModelProperty()
  @IsArray()
  dispatches: DispatchDTO[];

  @ApiModelProperty()
  @IsString()
  pickInstructions: string;

  @ApiModelProperty()
  @IsString()
  deliveryInstructions: string;

  @ApiModelProperty()
  @IsString()
  source: string;

  @ApiModelProperty()
  @IsString()
  bolUrl?: string;

  @ApiModelProperty()
  @IsString()
  invoiceUrl?: string;

  @ApiModelProperty()
  @IsString()
  receiptUrl?: string;

  @ApiModelProperty()
  @IsDate()
  invoiceDueDate?: Date;

  @ApiModelProperty()
  @IsDate()
  pickDate: Date;

  @ApiModelProperty()
  @IsDate()
  deliveryDate: Date;

  @ApiModelProperty()
  @IsNumber()
  exactDistance: number;

  @ApiModelProperty()
  @IsArray()
  inspections: InspectionDTO[];

  @ApiModelProperty()
  @IsBoolean()
  isVirtual: boolean;

  @ApiModelProperty()
  @IsNumber()
  driverId: number;

  @ApiModelProperty()
  dispatcher: AccountDTO;

  @ApiModelProperty()
  @IsNumber()
  dispatcherId: number;

  @ApiModelProperty()
  @IsNumber()
  quoteId: number;

  @ApiModelProperty()
  @IsNumber()
  shipperId: number;

  @ApiModelProperty()
  shipper: ShipperDTO;

  @ApiModelProperty()
  @IsString()
  brokerFee?: number;

  @ApiModelProperty()
  @IsString()
  paymentNote?: string;

  @ApiModelProperty()
  @IsString()
  paymentMethods?: string;

  @ApiModelProperty()
  @IsString()
  dispatchInstructions?: string;

  @ApiModelProperty()
  @IsString()
  clientPaymentStatus?: string;

  @ApiModelProperty()
  @IsString()
  uuid?: string;

}
