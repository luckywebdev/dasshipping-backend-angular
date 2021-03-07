import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as csv from 'csvtojson';
import { Response } from 'express';
import * as fs from 'fs';
import { path } from 'ramda';
import { In, LessThan, Repository, Transaction, TransactionRepository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { LocationPointDTO } from '../../dto/locationPoint.dto';
import { QuoteDTO } from '../../dto/quote.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { CarEntity } from '../../entities/car.entity';
import { LocationEntity } from '../../entities/location.entity';
import { QUOTE_STATUS, TRAILER_TYPE } from '../../entities/orderBase.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { MailMessage } from '../../mail/dto/mail.dto';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { RandomString } from '../../utils/random.utils';
import { HereService } from '../here/here.service';
import { CalculatorService } from '../shared/calculator.service';
import { EditLeadRequest } from './dto/dit/request.dto';
import { GetLeadsRequest } from './dto/list/request.dto';
import { GetLeadsListResponse } from './dto/list/response.dto';
import Axios from 'axios';
import {QuoteEntity} from '../../entities/quote.entity';
import {TemporaryLeadEntity} from '../../entities/temporaryLead.entity';
import { CarRepository } from '../../repositories/car.repository';

const LEAD_KEY_HEADER = {
  car: 'Load Info',
  pickup_name: 'Pickup Name',
  email: 'Email',
  pickup_city: 'Pickup City',
  pickup_state: 'Pickup State',
  pickup_zip: 'Pickup ZIP',
  pickup_date: 'Pickup Date',
  delivery_city: 'Delivery City',
  delivery_state: 'Delivery State',
  delivery_zip: 'Delivery ZIP',
};

const HEADER_KEYS = [
  'Load Info',
  'Pickup Name',
  'Email',
  'Pickup City',
  'Pickup State',
  'Pickup ZIP',
  'Pickup Date',
  'Delivery City',
  'Delivery State',
  'Delivery ZIP',
];

@Injectable()
export class LeadService {
  constructor(
    private calcService: CalculatorService,
    private hereService: HereService,
    private configService: ConfigService,
    private mailService: MailService,
    @InjectRepository(CarEntity)
    private readonly carRepository: Repository<CarEntity>,
    @InjectRepository(QuoteRepository)
    private readonly quoteRepository: QuoteRepository,
    @InjectRepository(AccountRepository)
    private readonly accountRepository: AccountRepository,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
    @InjectRepository(VirtualAccountEntity)
    private readonly virtualAccountRepository: Repository<VirtualAccountEntity>,
  ) { }

  public async importCsv(
    account: AccountEntity,
    file: any,
  ): Promise<SuccessDTO> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    let leadArray = [];
    try {
      leadArray = await csv().fromFile(file.path);
    } catch (e) {
      throw new BadRequestException('Csv not correct');
    } finally {
      fs.unlinkSync(file.path);
    }
    if (leadArray && leadArray.length) {
      this.insertLeads(account, leadArray);
    }
    return { success: true };
  }

  @Transaction()
  private async insertLead(
      quote: any,
      @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
      @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
      @TransactionRepository(QuoteRepository) quoteRepository?: QuoteRepository,
      @TransactionRepository(CarRepository) carRepository?: CarRepository,
    ): Promise<QuoteEntity> {
    const pickup = await locationRepository.save(quote.pickLocation);
    const delivery = await locationRepository.save(quote.deliveryLocation);
    let customer = await virtualAccountRepository.findOne({
      email: quote.customer.email,
    });
    if (!customer) {
      customer = await virtualAccountRepository.save(quote.customer);
    }
    const from = path(['pickLocation', 'zipCode'], quote) as string;
    const to = path(['deliveryLocation', 'zipCode'], quote) as string;
    const distance = await this.calcService.getDistance(from, to);
    let price = 0;
    let salePrice = 0;
    let loadPrice = 0;

    if (quote.cars && quote.cars.length && quote.cars[0].type) {
      price = await this.calcService.getCarsDeliveryPrice(
        quote.cars,
        distance,
        TRAILER_TYPE.ENCLOSED === quote.trailerType,
      );
      salePrice = await this.calcService.getSalePrice(price);
      loadPrice = await this.calcService.getLoadPrice(price);
    }

    delete quote.pickLocation;
    delete quote.deliveryLocation;
    delete quote.customer;

    const payload = Object.assign({}, quote, {
      initialPrice: price,
      priceWithDiscount: price,
      distance,
      salePrice,
      loadPrice,
      pickLocationId: pickup.id,
      deliveryLocationId: delivery.id,
      customerId: customer.id,
    });
    const instance = await quoteRepository.save(payload);
    quote.cars = quote.cars.map(car => {
      return {
        ...car,
        quoteId: instance.id,
      };
    });

    await carRepository.save(quote.cars);

    return instance;
  }

  private validHeaders(lead) {
    const invalidHeader = Object.keys(lead).find(
      key => !HEADER_KEYS.find(item => item === key),
    );
    if (invalidHeader) {
      throw new BadRequestException(`Header ${invalidHeader} is not valid`);
    }
  }

  private async prepareQuote(item, accountId: number): Promise<QuoteDTO> {
    const keys = LEAD_KEY_HEADER;
    const fullName = item[keys.pickup_name].split(' ');
    const lastName = fullName.pop();
    const firstName = fullName.join(' ');
    const [year, make] = item[keys.car].split(' ', 2);
    const model = item[keys.car]
      .substring([year, make].join(' ').length, item[keys.car].length)
      .trim();
    let type = null;
    try {
      const carType = await Axios.get(`${this.configService.carTypeApi}/car-types?make=${make}&model=${model}`);
      type = carType.data && carType.data[0] && carType.data[0].type;
      // tslint:disable-next-line:no-empty
    } catch (e) {}

    const quote = {
      pickLocation: {
        zipCode: item[keys.pickup_zip],
        state: item[keys.pickup_state],
        city: item[keys.pickup_city],
      },
      deliveryLocation: {
        zipCode: item[keys.delivery_zip],
        state: item[keys.delivery_state],
        city: item[keys.delivery_city],
      },
      customer: {
        email: item[keys.email],
        firstName: firstName || '',
        lastName: lastName || '',
      },
      trailerType: TRAILER_TYPE.OPEN,
      external: true,
      createdById: accountId,
      status: QUOTE_STATUS.LEAD,
      cars: [{ year, make, model, type }],
      sentDate: new Date(Date.now() - 90000 * 1000).toISOString(),
      sentCount: 0,
    };
    return quote;
  }

  private validLead(lead) {
    const noValue = Object.keys(lead).find(key => !lead[key]);
    return !noValue;
  }

  private insertLeads(account: AccountEntity, leads: any) {
    this.validHeaders(leads[0]);
    leads.forEach(async item => {
      if (this.validLead(item)) {
        try {
          const quote = await this.prepareQuote(item, account.id);
          await this.insertLead(quote);
        } catch (e) {
          //
        }
      }
    });
    return leads.length;
  }

  private async getLocationFilter(
    location?: string,
  ): Promise<{
    point: LocationPointDTO;
    radius: number;
    unit?: string;
  } | null> {
    if (!location) {
      return null;
    }
    let locationObject = null;
    try {
      locationObject = JSON.parse(location);
    } catch (e) {
      throw new BadRequestException(`Invalid json at ${e.message}`);
    }
    const foundLocation = await this.hereService.geocode({
      searchtext: `${locationObject.city} ${locationObject.state}`,
    });
    return {
      point: {
        lat: path([0, 'lat'], foundLocation),
        lon: path([0, 'lon'], foundLocation),
      },
      radius: Number(locationObject.radius),
      unit: locationObject.unit,
    };
  }

  async getNewLeads(query: GetLeadsRequest): Promise<GetLeadsListResponse> {
    const originPoint = await this.getLocationFilter(query.origin);
    const destinationPoint = await this.getLocationFilter(query.destination);

    delete query.origin;
    delete query.destination;

    const queryCustom = Object.assign({}, query, {
      ...query,
      originPoint,
      destinationPoint,
      where: { status: QUOTE_STATUS.LEAD },
    });

    return this.quoteRepository.getLeads(queryCustom);
  }

  async getQuptedLeads(query: GetLeadsRequest): Promise<GetLeadsListResponse> {
    const originPoint = await this.getLocationFilter(query.origin);
    const destinationPoint = await this.getLocationFilter(query.destination);

    delete query.origin;
    delete query.destination;

    const queryCustom = Object.assign({}, query, {
      ...query,
      originPoint,
      destinationPoint,
      where: { status: QUOTE_STATUS.QUOTED },
    });

    return this.quoteRepository.getLeads(queryCustom);
  }

  async updateLead(id: number, data: EditLeadRequest): Promise<QuoteDTO> {
    const lead = await this.quoteRepository.findOne({ id });
    if (
      !lead &&
      ![QUOTE_STATUS.LEAD.toString(), QUOTE_STATUS.QUOTED.toString()].includes(
        lead.status,
      )
    ) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    await this.quoteRepository.update(id, { ...lead, ...data });
    return { ...lead, ...data };
  }

  async delete(ids: number[]): Promise<SuccessDTO> {
    const leads = await this.quoteRepository.getLeadsByQuery({ id: In(ids) });
    const pickupIds = leads.map(lead => lead.pickLocationId);
    const deliveryIds = leads.map(lead => lead.deliveryLocationId);
    const virtualAccounts = leads
      .map(lead => lead.customerId)
      .filter(item => item);
    try {
      await this.carRepository.delete({ quoteId: In(ids) });
      await this.quoteRepository.remove(leads);
      await this.locationRepository.delete({
        id: In([...pickupIds, ...deliveryIds]),
      });

      await this.virtualAccountRepository.delete({ id: In(virtualAccounts) });
    } catch (e) { }
    return { success: true };
  }

  private async sendEmail(lead: QuoteDTO, hash: string): Promise<MailMessage> {
    const { customer } = lead;
    const html = await this.mailService.clientInvitationTemplate({
      firstName: customer.firstName,
      lastName: customer.lastName,
      price: lead.priceWithDiscount.toFixed(),
      url: `${this.configService.apiDomain}/register/redirect/${
        ROLES.CLIENT
        }/${hash}`,
    });

    return {
      from: `no-reply@${this.configService.email.domain}`,
      to: customer.email,
      subject: 'Client registration',
      html,
    };
  }

  private async sendEmailNewLead(account: AccountEntity, lead: QuoteDTO): Promise<MailMessage> {
    const hash = RandomString(36);
    const html = await this.mailService.clientNewLeadTemplate({
      firstName: account.firstName,
      lastName: account.lastName,
      price: lead.priceWithDiscount.toFixed(),
      url: `${this.configService.apiDomain}/register/redirect/${
        ROLES.CLIENT
        }/${hash}`,
    });

    return {
      from: `no-reply@${this.configService.email.domain}`,
      to: account.email,
      subject: 'New lead',
      html,
    };
  }

  public async checkSendEmails(ids: number[]): Promise<SuccessDTO> {
    const leads = await this.quoteRepository.getLeadsForSend({
      id: In(ids),
      sentCount: LessThan(3),
    });

    const unikeyLeads: any = [];
    for (let lead of leads) {
      const { cars, customer } = lead;
      const [car] = cars;
      const existAccount = await this.accountRepository.findOne({
        email: customer.email,
      });
      if (existAccount) {
        try {
          await this.quoteRepository.update(lead.id, {
            createdById: existAccount.id,
            status: QUOTE_STATUS.NEW,
            customerId: null,
          });
          await this.virtualAccountRepository.delete(customer);
          const mail = await this.sendEmailNewLead(existAccount, lead);
          await this.mailService.sendEmail(mail);
        } catch (e) { }
      } else {
        if (!unikeyLeads.find(item => item.customer.email === customer.email)) {
          if (car && car.type) {
            unikeyLeads.push(lead);
            const hash = RandomString(36);
            try {
              const mail = await this.sendEmail(lead, hash);
              await this.mailService.sendEmail(mail);
              await this.virtualAccountRepository.update(lead.customerId, {
                hash,
              });
            } catch (e) {
              throw new BadRequestException('Error at sending email.');
            }
          }
        }
        if (car && car.type) {
          await this.quoteRepository.update(lead.id, {
            sentDate: new Date(),
            sentCount: lead.sentCount + 1,
            status: QUOTE_STATUS.QUOTED,
          });
        }
      }
    }

    return { success: true };
  }

  public async createFromTemporaryLead(tmpLead: TemporaryLeadEntity): Promise<QuoteEntity> {
    const quote = {
      pickLocation: tmpLead.pickLocation,
      deliveryLocation: tmpLead.deliveryLocation,
      customer: tmpLead.customer,
      trailerType: tmpLead.trailerType,
      external: true,
      status: QUOTE_STATUS.LEAD,
      cars: tmpLead.cars,
      sentDate: new Date(Date.now() - 90000 * 1000).toISOString(),
      sentCount: 1,
      notes: tmpLead.notes,
    };
    return await this.insertLead(quote);
  }

  public async redirectToDownloadApp(platform: string, lead: QuoteDTO, response: Response): Promise<void> {
    const hash = RandomString(36);
    await this.virtualAccountRepository.update(lead.customerId, {
      hash,
    });
    return response.redirect(`${this.configService.apiDomain}/register/redirect/${ROLES.CLIENT}/${hash}`);
  }

  public async getById(leadId: number): Promise<QuoteEntity> {
    const lead = await this.quoteRepository.findOne({ id: leadId });
    if (!lead) {
      throw new BadRequestException(`No lead found for id ${leadId}`);
    }

    return lead;
  }
}
