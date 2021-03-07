import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as mailgunjs from 'mailgun-js';

import { ConfigService } from '../config/config.service';
import { MailMessage } from './dto/mail.dto';
import { MailEnum } from './mail.enum';
import {
  BlockAccountTemplate,
  BlockCompanyTemplate,
  CarrierInvitationTemplate,
  CarrierInvitationTemplateOrder,
  ChangesCompanyTemplate,
  ClientEmailConfirmTemplate,
  ClientInvitationTemplate,
  CommonInvitationTemplate,
  ResetPasswordTemplate,
} from './mail.interface';

@Injectable()
export class MailService {
  private mailgun;

  constructor(private readonly config: ConfigService) {
    const { apiKey, domain } = this.config.email;
    this.mailgun = mailgunjs({ apiKey, domain });
  }
  public blockAccountTemplate = (items: BlockAccountTemplate) =>
    this.getTemplate(MailEnum.BLOCK_EMAIL, items);
  public blockCompanyTemplate = (items: BlockCompanyTemplate) =>
    this.getTemplate(MailEnum.BLOCK_COMPANY, items);
  public carrierInvitationTemplate = (items: CarrierInvitationTemplate) =>
    this.getTemplate(MailEnum.CARRIER_INVITATION, items);
  public carrierInvitationTemplateOrder = (items: CarrierInvitationTemplateOrder) =>
    this.getEmailTemplate(MailEnum.CARRIER_INVITATION_ORDER, items);
  public commonInvitationTemplate = (items: CommonInvitationTemplate) =>
    this.getTemplate(MailEnum.COMMON_INVITATION, items);
  public clientMailConfirmTemplate = (items: ClientEmailConfirmTemplate) =>
    this.getTemplate(MailEnum.CLIENT_MAIL_CONFIRM, items);
  public changesCompanyTemplate = (items: ChangesCompanyTemplate) =>
    this.getTemplate(MailEnum.REQUESTED_CHANGES, items);
  public clientInvitationTemplate = (items: ClientInvitationTemplate) =>
    this.getTemplate(MailEnum.CLIENT_INVITATION, items);
  public clientNewLeadTemplate = (items: ClientInvitationTemplate) =>
    this.getTemplate(MailEnum.CLIENT_NEW_LEAD, items);

  public resetPasswordTemplate = (items: ResetPasswordTemplate) =>
    this.getTemplate(MailEnum.RESET_PASSWORD, items);

  async sendEmail(data: MailMessage) {
    if (data.attachment) {
      data.attachment = data.attachment.map(attachment => {
        return new this.mailgun.Attachment({
          filename: attachment.fileName,
          data: attachment.data,
        });
      })
    }
    return new Promise((resolve, reject) => {
      this.mailgun.messages().send(data, (error, body) => {
        if (error) {
          reject(error);
        }
        resolve(body);
      });
    });
  }

  private generateTemplate(sheet: string, items: object): string {
    let template = sheet;
    Object.keys(items).forEach(
      key => (template = template.split(`{{${key}}}`).join(items[key])),
    );
    return template;
  }

  private getSheet(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(`${__dirname}/../../templates/${file}.html`, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data.toString());
      });
    });
  }

  private async getEmailTemplate(type: MailEnum, items: object) {
    return await ejs.renderFile(`./src/views/emails/${type}.ejs`, items) as string;
  }

  private async getTemplate(type: MailEnum, items: object) {
    const template = await this.getSheet(type);
    return this.generateTemplate(template, items);
  }
}
