import { CarDTO } from '../dto/car.dto';

export interface ResetPasswordTemplate {
  firstName: string;
  lastName: string;
  url: string;
}

export interface BlockAccountTemplate {
  firstName: string;
  lastName: string;
  reason: string;
  status: string;
}

export interface BlockCompanyTemplate {
  contactPersonFirstName: string;
  contactPersonLastName: string;
  reason: string;
  status: string;
}
export interface ChangesCompanyTemplate {
  contactPersonFirstName: string;
  contactPersonLastName: string;
  message: string;
  changeUrl: string;
}

export interface CarrierInvitationTemplate {
  acceptUrl: string;
  denyUrl: string;
  firstName: string;
  lastName: string;
}

export interface CarrierInvitationTemplateOrder {
  domain: string;
  acceptUrl: string;
  denyUrl: string;
  orderUuid?: string;
  cars?: CarDTO[];
  firstName: string;
  lastName: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickDate: string;
  deliveryDate: string;
  distance: string;
  condition: string;
  companyName?: string;
  price: string;
  contactInfo?: { PHONE: string; EMAIL: string; LANDING: string; }
}

export interface CommonInvitationTemplate {
  acceptUrl: string;
  carrierName: string;
  denyUrl: string;
  firstName: string;
  lastName: string;
  roleName: string;
}

export interface ClientEmailConfirmTemplate {
  firstName: string;
  lastName: string;
  code: string;
  url: string;
}

export interface ClientInvitationTemplate {
  firstName: string;
  lastName: string;
  price: string;
  url: string;
}

export interface ClientNewLeadTemplate {
  firstName: string;
  lastName: string;
}
