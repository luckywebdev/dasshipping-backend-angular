import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as ejs from 'ejs';
import * as moment from 'moment';
import { path } from 'ramda';
import { LessThanOrEqual, Repository, UpdateResult } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { CONTACT_INFO } from '../../constants/contactInfo.constant';
import { LocationDTO } from '../../dto/location.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { CAR_CONDITION } from '../../entities/car.entity';
import { TRAILER_TYPE } from '../../entities/orderBase.entity';
import { LEAD_STATUSES, TemporaryLeadEntity } from '../../entities/temporaryLead.entity';
import { MailService } from '../../mail/mail.service';
import { TokenTypes } from '../auth/auth.service';
import { HereService } from '../here/here.service';
import { CalculatorService } from '../shared/calculator.service';
import { CreateLeadDTO } from './dto/requests/create.dto';

@Injectable()
export class TemporaryLeadService {
  constructor(
    private calcService: CalculatorService,
    private mailService: MailService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hereService: HereService,
    @InjectRepository(TemporaryLeadEntity)
    private readonly temporaryLeadRepository: Repository<TemporaryLeadEntity>,
  ) { }

  public async removeExpired(): Promise<void> {
    await this.temporaryLeadRepository.delete({ expirationDate: LessThanOrEqual(new Date()) });
  }

  public async create(data: CreateLeadDTO, ipAddress: string): Promise<TemporaryLeadEntity> {
    let tempLead = null;
    // const tempLeadsPerIp = await this.temporaryLeadRepository.count({ ipAddress });

    // if (tempLeadsPerIp >= 10) {
    //   throw new BadRequestException('You have exceeded maximum number of leads');
    // }

    try {
      const pickup = await this.hereService.findAddress(data.pickLocation);
      const delivery = await this.hereService.findAddress(data.deliveryLocation);
      const pickLocation = TemporaryLeadService.getAddress(pickup);
      const deliveryLocation = TemporaryLeadService.getAddress(delivery);
      const distance = await this.calcService.getDistance(pickLocation.zipCode, deliveryLocation.zipCode);
      const price = await this.calcService.getCarsDeliveryPrice(
        data.cars,
        distance,
        data.trailerType === TRAILER_TYPE.ENCLOSED,
      );
      const salePrice = await this.calcService.getSalePrice(price);
      const loadPrice = await this.calcService.getLoadPrice(price);

      const currentDate = new Date();
      const payload = {
        trailerType: data.trailerType,
        pickLocation,
        deliveryLocation,
        customer: {
          firstName: data.customerFirstName,
          lastName: data.customerLastName,
          email: data.customerEmail,
        },
        notes: data.notes,
        cars: data.cars,
        initialPrice: price,
        priceWithDiscount: price,
        createdAt: currentDate,
        updatedAt: currentDate,
        ipAddress,
        distance,
        salePrice,
        loadPrice,
        status: LEAD_STATUSES.CREATED,
        expirationDate: moment().add(3, 'days').toDate(),
      };

      tempLead = await this.temporaryLeadRepository.save(payload, { reload: true });
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    return tempLead;
  }

  public async send(tempLead: TemporaryLeadEntity): Promise<SuccessDTO> {
    try {
      const androidToken = this.jwtService.sign(
        { tempLeadId: tempLead.id, type: TokenTypes.ACCESS, platform: 'android' },
        { expiresIn: this.configService.leadTokenExpires },
      );
      const iosToken = this.jwtService.sign(
        { tempLeadId: tempLead.id, type: TokenTypes.ACCESS, platform: 'ios' },
        { expiresIn: this.configService.leadTokenExpires },
      );

      const androidUrl = `${this.configService.apiDomain}/leads/download-app/${androidToken}`;
      const iosUrl = `${this.configService.apiDomain}/leads/download-app/${iosToken}`;

      const pickUp = {
        address: tempLead.pickLocation.address,
        city: tempLead.pickLocation.city,
        state: tempLead.pickLocation.state,
        zipCode: tempLead.pickLocation.zipCode,
      };
      const delivery = {
        address: tempLead.deliveryLocation.address,
        city: tempLead.deliveryLocation.city,
        state: tempLead.deliveryLocation.state,
        zipCode: tempLead.deliveryLocation.zipCode,
      };

      await this.mailService.sendEmail({
        from: `no-reply@${this.configService.email.domain}`,
        to: tempLead.customer.email,
        subject: `New lead`,
        html: await ejs.renderFile('./src/views/emails/lead.ejs', {
          priceWithDiscount: tempLead.priceWithDiscount.toFixed(2),
          firstName: tempLead.customer.firstName.toUpperCase(),
          lastName: tempLead.customer.lastName.toUpperCase(),
          cars: tempLead.cars,
          notes: tempLead.notes,
          trailerType: tempLead.trailerType,
          operable: CAR_CONDITION.OPERABLE,
          inoperable: CAR_CONDITION.INOPERABLE,
          contactInfo: CONTACT_INFO,
          pickLocation: Object.values(pickUp).filter(value => !!value).join(', '),
          deliveryLocation: Object.values(delivery).filter(value => !!value).join(', '),
          domain: this.configService.apiDomain,
          androidUrl,
          iosUrl,
        }) as string,
      });

      await this.temporaryLeadRepository.update(tempLead.id, {
        updatedAt: new Date(),
        sentDate: new Date(),
        sentCount: tempLead.sentCount + 1,
        status: LEAD_STATUSES.SENT,
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    return { success: true };
  }

  private static getAddress(address: any): LocationDTO {
    const houseNumber = path(['Location', 'Address', 'HouseNumber'], address) as string || '';
    const street = path(['Location', 'Address', 'Street'], address) as string || '';
    return {
      address: houseNumber && street ? houseNumber + ', ' + street : houseNumber || street,
      city: path(['Location', 'Address', 'City'], address) || '',
      state: path(['Location', 'Address', 'State'], address) || '',
      zipCode: path(['Location', 'Address', 'PostalCode'], address) || '',
      lat: path(['Location', 'DisplayPosition', 'Latitude'], address),
      lon: path(['Location', 'DisplayPosition', 'Longitude'], address),
    };
  }

  public async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  public async getById(tmpLeadId: number): Promise<TemporaryLeadEntity> {
    const tmpLead = await this.temporaryLeadRepository.findOne({ id: tmpLeadId });
    if (!tmpLead || (tmpLead.expirationDate < (new Date()))) {
      throw new BadRequestException(`The quote is expired and you have to create a new one, or download the app and create it from app.`);
    }

    return tmpLead;
  }

  public async update(tmpLead: Partial<TemporaryLeadEntity>): Promise<UpdateResult> {
    return this.temporaryLeadRepository.update(tmpLead.id, tmpLead);
  }
}
