import { AbstractOrderParser } from './abstractOrderParser';
import { OrderParserInterface } from './orderParser.interface';

export class DispatchContractTemplateParser extends AbstractOrderParser
  implements OrderParserInterface {
  public getPickUpAddress(): string | null {
    let pickUpAddress = null;
    const pickUpAddressInfo = /ORIGIN\nCompany.*\n*?.*\nAddress(?<pickUpAddress>.*)/gm.exec(
      this.templateText,
    );
    if (pickUpAddressInfo) {
      pickUpAddress = pickUpAddressInfo.groups.pickUpAddress
        .replace(/\n/g, ' ')
        .trim();
    }

    return pickUpAddress;
  }

  public getDeliveryAddress(): string | null {
    let deliveryAddress = null;
    const deliveryAddressInfo = /DESTINATION\nCompany.*\n*?.*\nAddress(?<deliveryAddress>.*)/gm.exec(
      this.templateText,
    );
    if (deliveryAddressInfo) {
      deliveryAddress = deliveryAddressInfo.groups.deliveryAddress
        .replace(/\n/g, ' ')
        .trim();
    }

    return deliveryAddress;
  }

  public getPickUpDate(): Date | null {
    let pickUpDate = null;
    const pickUpDateInfo = /Pickup No Later Than(?<pickUpDate>.*)/gm.exec(
      this.templateText,
    );
    if (pickUpDateInfo) {
      pickUpDate = new Date(
        pickUpDateInfo.groups.pickUpDate.replace(/\n/g, ' ').trim(),
      );
    }

    return pickUpDate;
  }

  public getDeliveryDate(): Date | null {
    let deliveryDate = null;
    const deliveryDateInfo = /Delivery No Later Than(?<deliveryDate>.*)/gm.exec(
      this.templateText,
    );
    if (deliveryDateInfo) {
      deliveryDate = new Date(
        deliveryDateInfo.groups.deliveryDate.replace(/\n/g, ' ').trim(),
      );
    }

    return deliveryDate;
  }

  public getTrailerType(): string | null {
    let trailerType = null;
    const trailerTypeInfo = /Ship Via\n.*\n.*\n.*\n(?<trailerType>.*)/gm.exec(
      this.templateText,
    );
    if (trailerTypeInfo) {
      trailerType = trailerTypeInfo.groups.trailerType
        .replace(/\n/g, ' ')
        .trim();
    }

    return trailerType;
  }

  public getPriceOwesToCarrier(): string | null {
    let price = null;
    const priceInfo = /Total Carrier Pay\nCustomer to Carrier\nBroker to Carrier\nShip Via\n\$(?<price>.*)/gm.exec(
      this.templateText,
    );
    if (priceInfo) {
      price = priceInfo.groups.price.replace(/,/g, '').trim();
    }

    return price;
  }

  public getPaymentTerms(): string | null {
    let paymentTerms = null;
    const paymentTermsInfo = /Ship Via\n\$\d+\n\$\d+\n\$\d+\n([A-Z,a-z]+)\n(?<paymentTerms>.*)ORIGIN/gms.exec(
      this.templateText,
    );
    if (paymentTermsInfo) {
      paymentTerms = paymentTermsInfo.groups.paymentTerms
        .replace(/\n/g, ' ')
        .trim();
    }

    return paymentTerms;
  }

  public getSender(): {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null {
    let sender = null;
    const senderInfoName = /ORIGIN\nCompany.*\nName\s(?<firstName>.*)/gm.exec(
      this.templateText,
    );
    const senderInfoPhone = /ORIGIN\nCompany.*\n*?.*\n*?.*\nPhone\s(?<phoneNumber>.*)/gm.exec(
      this.templateText,
    );

    if (senderInfoPhone) {
      const phoneNumber = senderInfoPhone.groups.phoneNumber
        ? senderInfoPhone.groups.phoneNumber.replace(/\n/g, ' ').trim()
        : '';

      sender = {
        firstName: '',
        lastName: '',
        phoneNumber,
      };
    }
    if (senderInfoName) {
      const firstName = senderInfoName.groups.firstName
        ? senderInfoName.groups.firstName.replace(/\n/g, ' ').trim()
        : '';

      const fullName = firstName.split(' ');
      sender = {
        ...sender,
        firstName: fullName[0],
        lastName: firstName.substring(fullName[0].length).trim(),
      };
    }

    return sender;
  }

  public getReceiver(): {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null {
    let receiver = null;
    const receiverInfoName = /DESTINATION\nCompany.*\nName\s(?<firstName>.*)/gm.exec(
      this.templateText,
    );
    const receiverInfoPhone = /DESTINATION\nCompany.*\n*?.*\n*?.*\nPhone\s(?<phoneNumber>.*)/gm.exec(
      this.templateText,
    );

    if (receiverInfoPhone) {
      const phoneNumber = receiverInfoPhone.groups.phoneNumber
        ? receiverInfoPhone.groups.phoneNumber.replace(/\n/g, ' ').trim()
        : '';

      receiver = {
        firstName: '',
        lastName: '',
        phoneNumber,
      };
    }
    if (receiverInfoName) {
      const firstName = receiverInfoName.groups.firstName
        ? receiverInfoName.groups.firstName.replace(/\n/g, ' ').trim()
        : '';

      const fullName = firstName.split(' ');
      receiver = {
        ...receiver,
        firstName: fullName[0],
        lastName: firstName.substring(fullName[0].length).trim(),
      };
    }
    return receiver;
  }

  public getShipperCompanyName(): string | null {
    let shipperCompanyName = null;
    const shipperCompanyNameInfo = /(?<companyName>.*)\saccepted order/gm.exec(
      this.templateText,
    );
    if (shipperCompanyNameInfo) {
      shipperCompanyName = shipperCompanyNameInfo.groups.companyName
        .replace(/\n/g, ' ')
        .trim();
    }

    return shipperCompanyName;
  }

  public getVehicles(): Array<{
    year: string;
    make: string;
    model: string;
    vin: string;
    type: string;
  }> {
    let vehicles = [];
    const vehicleInfoText = /VehicleVINTypeOperableColorBuyer#Lot#(?<vehicleInfo>.*)\s\nDispatch Contract/gms.exec(
      this.templateText,
    );
    if (vehicleInfoText) {
      const vehicleInfo = vehicleInfoText.groups.vehicleInfo.trim();
      const vehicleVinRegex = new RegExp(
        /(?<vin>[A-Z,0-9]{17}).*(?<inop>Yes|No)/,
        'gm',
      );
      let match;
      while ((match = vehicleVinRegex.exec(vehicleInfo)) !== null) {
        if (match.index === vehicleVinRegex.lastIndex) {
          vehicleVinRegex.lastIndex++;
        }
        vehicles.push({
          vin: match.groups.vin,
          inop: match.groups.inop === 'No',
          make: '',
          model: '',
          year: '',
        });
      }
      const additionalInfo = vehicleInfo.split(/[A-Z,0-9]{17}.*Yes|No/gm);
      for (const index of vehicles.keys()) {
        const additionalInfoMatch = /(?<year>\d{4})\s(?<make>[A-Z,a-z]+)\s(?<model>.*)/gms.exec(
          additionalInfo[index],
        );
        if (additionalInfoMatch) {
          vehicles[index].make = additionalInfoMatch.groups.make
            .replace(/\n/g, ' ')
            .trim();
          vehicles[index].model = additionalInfoMatch.groups.model
            .replace(/\n/g, ' ')
            .trim();
          vehicles[index].year = additionalInfoMatch.groups.year
            .replace(/\n/g, ' ')
            .trim();
        }
      }
    }

    return vehicles;
  }
}
