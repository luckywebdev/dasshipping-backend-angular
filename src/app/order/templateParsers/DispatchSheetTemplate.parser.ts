import {OrderParserInterface} from './orderParser.interface';
import {AbstractOrderParser} from './abstractOrderParser';

export class DispatchSheetTemplateParser extends AbstractOrderParser implements OrderParserInterface {

  public getOrderId(): string | null {
    let orderId = null;
    const orderInfo = this.templateText.match(/Order ID: (.*)/g);
    if (orderInfo) {
      orderId = orderInfo[0].replace('Order ID: ', '').trim();
    }
    return orderId;
  }

  public getCarrierInfo(): string | null {
    let carrier = null;
    const carrierInfo = this.templateText.match(/^(Carrier: )(.*)Driver:/gms);
    if (carrierInfo) {
      carrier = carrierInfo[0]
        .replace('Carrier: ', '')
        .replace('Driver:', '')
        .replace(/\n/gms, ' ')
        .trim();
    }
    return carrier;
  }

  public getDriverName(): string | null {
    let driverName = null;
    const driverInfo = this.templateText.match(/Driver: (.*)/g);
    if (driverInfo) {
      driverName = driverInfo[0].replace('Driver: ', '').trim();
    }
    return driverName;
  }

  public getDriverPhone(): string | null {
    let driverPhone = null;
    const driverPhoneInfo = this.templateText.match(/Driver Phone: (.*)/g);
    if (driverPhoneInfo) {
      driverPhone = driverPhoneInfo[0].replace('Driver Phone: ', '').trim();
    }
    return driverPhone;
  }

  public getDispatchDate(): Date | null {
    let dispatchDate = null;
    const dispatchDateInfo = this.templateText.match(/Dispatch Date: (.*)/g);
    if (dispatchDateInfo) {
      dispatchDate = new Date(
        dispatchDateInfo[0].replace('Dispatch Date: ', '').trim(),
      );
    }
    return dispatchDate;
  }

  public getPickUpDate(): Date | null {
    let pickUpDate = null;
    const pickUpDateInfo = this.templateText.match(/Pickup Estimated: (.*)/g);
    if (pickUpDateInfo) {
      pickUpDate = new Date(
        pickUpDateInfo[0].replace('Pickup Estimated: ', '').trim(),
      );
    }
    return pickUpDate;
  }

  public getDeliveryDate(): Date | null {
    let deliveryDate = null;
    const deliveryDateInfo = this.templateText.match(
      /Delivery Estimated: (.*)/g,
    );
    if (deliveryDateInfo) {
      deliveryDate = new Date(
        deliveryDateInfo[0].replace('Pickup Estimated: ', '').trim(),
      );
    }
    return deliveryDate;
  }

  public getTrailerType(): string | null {
    let trailerType = null;
    const trailerTypeInfo = this.templateText.match(/Ship Via: (.*)/g);
    if (trailerTypeInfo) {
      trailerType = trailerTypeInfo[0].replace('Ship Via: ', '').trim();
    }
    return trailerType;
  }

  public getCondition(): string | null {
    let condition = null;
    const conditionInfo = this.templateText.match(/Condition: (.*)/g);
    if (conditionInfo) {
      condition = conditionInfo[0].replace('Condition: ', '').trim();
    }
    return condition;
  }

  public getDispatchInstructions(): string | null {
    let instructions = null;
    const instructionsInfo = this.templateText.match(
      /^(DISPATCH INSTRUCTIONS)(.*)CONTRACT TERMS/gms,
    );
    if (instructionsInfo) {
      instructions = instructionsInfo[0]
        .replace('DISPATCH INSTRUCTIONS', '')
        .replace('CONTRACT TERMS', '')
        .trim();
    }
    return instructions;
  }

  public getVehicles(): Array<{
    year: string;
    make: string;
    model: string;
    vin: string;
    type: string;
  }> {
    let vehicles = [];
    const regex = /(?<year>\d+)(?<makeModel>.*)Type:(?<type>.*)Color.*VIN:(?<vin>.*)Lot/gms;
    const vehiclesInfo = this.templateText.match(
      /^(Vehicle Information)(.*)Pickup Information/gms,
    );
    if (vehiclesInfo) {
      vehicles = vehiclesInfo[0]
        .replace('Vehicle Information', '')
        .replace('\nPickup Information', '')
        .split(/\n\d+\s/gms)
        .reduce((accumulator, vehicle) => {
          const vehicleResult = regex.exec(vehicle);
          if (vehicleResult) {
            const makeModel = vehicleResult.groups.makeModel.trim();
            accumulator.push({
              year: vehicleResult.groups.year.trim(),
              make: makeModel
                .substr(0, makeModel.indexOf(' '))
                .replace(/\n/g, ' ')
                .trim(),
              model: makeModel
                .substr(makeModel.indexOf(' ') + 1)
                .replace(/\n/g, ' ')
                .trim(),
              vin: vehicleResult.groups.vin.trim(),
              type: vehicleResult.groups.type.trim(),
            });
          }
          return accumulator;
        }, vehicles);
    }

    return vehicles;
  }

  public getPickUpAddress(): string | null {
    const pickUpAddressInfo = this.templateText.match(
      /^(Pickup Information.*)Delivery Information/gms,
    );
    if (pickUpAddressInfo) {
      const pickUpAddress = /Name: .*?\n(?<address>.*?)Phone:/gms.exec(
        pickUpAddressInfo[0],
      );
      if (pickUpAddress) {
        return pickUpAddress.groups.address.replace(/\n/g, '').trim();
      }
    }

    return null;
  }

  public getDeliveryAddress(): string | null {
    const deliveryAddressInfo = this.templateText.match(
      /^(Delivery Information.*)Phone/gms,
    );

    if (deliveryAddressInfo) {
      const deliveryAddress = /Name: .*?\n(?<address>.*?)Phone/gms.exec(
        deliveryAddressInfo[0],
      );
      if (deliveryAddress) {
        return deliveryAddress.groups.address.replace(/\n/g, '').trim();
      }
    }

    return null;
  }

  public getSender(): {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null {
    const senderInfo = this.templateText.match(
      /^(Pickup Information.*)Delivery Information/gms,
    );

    if (senderInfo) {
      const sender = /Name: (?<name>.*?\n)(?<address>.*?)Phone: (?<phoneNumber>.*)Delivery Information/gms.exec(
        senderInfo[0],
      );
      if (sender) {
        const name = sender.groups.name.replace(/\n/g, '').trim();
        return {
          firstName: name.substr(0, name.indexOf(' ')),
          lastName: name.substr(name.indexOf(' ') + 1),
          phoneNumber: sender.groups.phoneNumber.replace(/\n/g, '').trim(),
        };
      }
    }

    return null;
  }

  public getReceiver(): {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null {
    const receiverInfo = this.templateText.match(
      /^(Delivery Information.*)Phone: .*DISPATCH INSTRUCTIONS/gms,
    );
    if (receiverInfo) {
      const sender = /Name: (?<name>.*?\n)(?<address>.*?)Phone: (?<phoneNumber>.*)DISPATCH INSTRUCTIONS/gms.exec(
        receiverInfo[0],
      );
      if (sender) {
        const name = sender.groups.name.replace(/\n/g, '').trim();
        return {
          firstName: name.substr(0, name.indexOf(' ')),
          lastName: name.substr(name.indexOf(' ') + 1),
          phoneNumber: sender.groups.phoneNumber.replace(/\n/g, '').trim(),
        };
      }
    }

    return null;
  }

  public getPriceOwesToCarrier(): string | null {
    let price = null;
    const priceInfo = /owes Carrier: \D(?<price>(\d+|\.+|,+)+)/g.exec(
      this.templateText,
    );
    if (priceInfo) {
      price = priceInfo.groups.price.replace(/,/g, '').trim();
    }

    return price;
  }

  public getShipperCompanyName(): string | null {
    let companyName = null;
    const companyInfo = /^(Dispatch Sheet)\n(?<companyName>.*?\n)\d+/gms.exec(
      this.templateText,
    );
    if (companyInfo) {
      companyName = companyInfo.groups.companyName.replace(/\n/g, ' ').trim();
    }

    return companyName;
  }

  public getShipperAddress(): string | null {
    let shipperAddress = null;
    const shipperAddressInfo = /^(Dispatch Sheet)\n(?<companyName>.*?\n)(?<address>\d+.*)Co.\sPhone/gms.exec(
      this.templateText,
    );
    if (shipperAddressInfo) {
      shipperAddress = shipperAddressInfo.groups.address
        .replace(/\n/g, ' ')
        .trim();
    }

    return shipperAddress;
  }

  public getShipperFullName(): string | null {
    let shipperName = null;
    const shipperNameInfo = /^(Dispatch Info).*Contact:\s(?<shipperName>.*?)\nPhone:/gms.exec(
      this.templateText,
    );
    if (shipperNameInfo) {
      shipperName = shipperNameInfo.groups.shipperName
        .replace(/\n/g, ' ')
        .trim();
    }

    return shipperName;
  }

  public getShipperPhone(): string | null {
    let shipperPhone = null;
    const shipperPhoneInfo = /^(Contact:.*)(Phone:\s)(?<phone>.*?)\nFax/gms.exec(
      this.templateText,
    );
    if (shipperPhoneInfo) {
      shipperPhone = shipperPhoneInfo.groups.phone.replace(/\n/g, ' ').trim();
    }

    return shipperPhone;
  }

  public getPaymentTerms(): string | null {
    let paymentTerms = null;
    const paymentTermsInfo = /owes Carrier: \D(?<price>(\d+|\.+|,+)+)(?<paymentTerms>.*?\n\*)/gms.exec(
      this.templateText,
    );
    if (paymentTermsInfo) {
      paymentTerms = paymentTermsInfo.groups.paymentTerms
        .replace(/\n/g, ' ')
        .trim()
        .slice(0, -1)
        .trim();
    }

    return paymentTerms;
  }
}
