import { path } from 'ramda';

import { CAR_CONDITION, CarEntity } from '../../entities/car.entity';
import { LocationEntity } from '../../entities/location.entity';
import { ORDER_SOURCE, OrderEntity } from '../../entities/order.entity';
import { ShipperEntity } from '../../entities/shipper.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { HereService } from '../here/here.service';
import { OrderParserInterface } from './templateParsers/orderParser.interface';

export class ImportOrderBuilder {
  protected order: OrderEntity;

  public constructor(
    protected readonly hereService: HereService,
    protected readonly parser: OrderParserInterface,
  ) {
    this.order = new OrderEntity();
  }

  public async setPickUpLocation(): Promise<void> {
    let address;
    try {
      address = await this.createLocation(
        this.parser.getPickUpAddress(),
      );
    } catch (e) { }
    this.order.pickLocation = address;
  }

  public async setDispatchInstructions(): Promise<void> {
    this.order.dispatchInstructions = await this.parser.getDispatchInstructions();
  }

  public async setPickUpInstructions(): Promise<void> {
    this.order.pickInstructions = await this.parser.getPickUpInstructions();
  }

  public async setDeliveryInstructions(): Promise<void> {
    this.order.deliveryInstructions = await this.parser.getDeliveryInstructions();
  }

  public async setExternalId(): Promise<void> {
    this.order.externalId = await this.parser.getOrderId();
  }

  public async setDeliveryLocation(): Promise<void> {
    let address;
    try {
      address = await this.createLocation(
        this.parser.getDeliveryAddress(),
      );
    } catch (e) { }
    this.order.deliveryLocation = address;
  }

  public async setShipper(): Promise<void> {
    const shipper = new ShipperEntity();

    const shipperAddress = this.parser.getShipperAddress();
    if (shipperAddress) {
      const address = await this.hereService.findAddress(
        this.parser.getShipperAddress(),
      );
      shipper.address =
        path(['Location', 'Address', 'HouseNumber'], address) +
        ', ' +
        path(['Location', 'Address', 'Street'], address);
      shipper.city = path(['Location', 'Address', 'City'], address);
      shipper.state = path(['Location', 'Address', 'State'], address);
      shipper.zipCode = path(['Location', 'Address', 'PostalCode'], address);
    }

    shipper.phone = this.parser.getShipperPhone();
    shipper.companyName = this.parser.getShipperCompanyName();
    shipper.fullName = this.parser.getShipperFullName();
    shipper.email = this.parser.getShipperEmail();

    this.order.shipper = shipper;
  }

  public async setCars() {
    this.order.cars = this.parser.getVehicles().map(car => {
      const carEntity = new CarEntity();
      carEntity.make = car.make;
      carEntity.model = car.model;
      carEntity.vin = car.vin;
      carEntity.year = car.year;
      carEntity.type = car.type;
      if (this.parser.getCondition()) {
        carEntity.inop =
          this.parser.getCondition().toLowerCase() ===
          CAR_CONDITION.INOPERABLE.toString().toLowerCase();
      } else {
        carEntity.inop = car.inop || false;
      }

      return carEntity;
    });
  }

  public getOrder(): OrderEntity {
    return this.order;
  }

  public setSender(): void {
    this.order.sender = this.parser.getSender() as VirtualAccountEntity;
  }

  public setReceiver(): void {
    this.order.receiver = this.parser.getReceiver() as VirtualAccountEntity;
  }

  public build(companyId: number): void {
    this.order.pickDate = this.parser.getPickUpDate();
    this.order.deliveryDate = this.parser.getDeliveryDate();
    this.order.trailerType = this.parser.getTrailerType();
    this.order.source = ORDER_SOURCE.PDF;
    this.order.salePrice = parseFloat(this.parser.getPriceOwesToCarrier());
    this.order.initialPrice = this.order.salePrice;
    this.order.priceWithDiscount = this.order.salePrice;
    this.order.discount = 0;
    this.order.published = true;
    this.order.companyId = companyId;
    this.order.paymentNote = this.parser.getPaymentTerms();
  }

  private async createLocation(address: string): Promise<LocationEntity> {
    if (address) {
      const location = await this.hereService.findAddress(address);
      const houseNumber = path(
        ['Location', 'Address', 'HouseNumber'],
        location,
      );
      const street = path(['Location', 'Address', 'Street'], location);
      const locationEntity = new LocationEntity();
      locationEntity.address =
        houseNumber && street
          ? `${houseNumber}, ${street}`
          : `${houseNumber || ''}${street || ''}`;
      locationEntity.city = path(['Location', 'Address', 'City'], location);
      locationEntity.state = path(['Location', 'Address', 'State'], location);
      locationEntity.zipCode = path(
        ['Location', 'Address', 'PostalCode'],
        location,
      );
      locationEntity.lat = path(
        ['Location', 'DisplayPosition', 'Latitude'],
        location,
      );
      locationEntity.lon = path(
        ['Location', 'DisplayPosition', 'Longitude'],
        location,
      );

      return locationEntity;
    }
  }
}
