import {OrderParserInterface} from './orderParser.interface';
import {AbstractOrderParser} from './abstractOrderParser';

export class RPMTemplateParser extends AbstractOrderParser implements OrderParserInterface {

    public getPickUpAddress(): string | null {
        let pickUpAddress = null;
        const pickUpAddressInfo = /(Apt|FCFS)\n.*\n(?<pickUpAddress>.*)\n/gm.exec(this.templateText);
        if (pickUpAddressInfo) {
            pickUpAddress = pickUpAddressInfo.groups.pickUpAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return pickUpAddress;
    }

    public getDeliveryAddress(): string | null {
        let deliveryAddress = null;
        const deliveryAddressInfo = /Delivery\n.*\n.*(Apt|FCFS)\n.*\n(?<deliveryAddress>.*)\n/gm.exec(this.templateText);
        if (deliveryAddressInfo) {
            deliveryAddress = deliveryAddressInfo.groups.deliveryAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return deliveryAddress;
    }

    public getPickUpDate(): Date | null {
        let pickUpDate = null;
        const pickUpDateInfo = /Pickup\n(?<pickUpDate>.*)\n/gm.exec(this.templateText);
        if (pickUpDateInfo) {
            pickUpDate = new Date(
                pickUpDateInfo.groups.pickUpDate.replace(/\n/g, ' ')
                    .trim(),
            );
        }

        return pickUpDate;
    }

    public getDeliveryDate(): Date | null {
        let deliveryDate = null;
        const deliveryDateInfo = /Delivery\n(?<deliveryDate>.*)\n/gm.exec(this.templateText);
        if (deliveryDateInfo) {
            deliveryDate = new Date(
                deliveryDateInfo.groups.deliveryDate.replace(/\n/g, ' ')
                    .trim(),
            );
        }

        return deliveryDate;
    }

    public getVehicles(): Array<{ year: string; make: string; model: string; vin: string; type: string }> {
        let vehicles = [];
        const vehiclesInfo = this.templateText.match(/(Items\n([A-Z,0-9]{17}))|(vehicles\n([A-Z,0-9]{17}))/gms);
        if (vehiclesInfo) {
            vehicles = vehiclesInfo.map(vin => {
                return {
                    vin: vin
                        .replace('Items', '')
                        .replace('vehicles', '')
                        .replace(/[\n,\s,\t,\r]/g, ''),
                    year: '',
                    make: '',
                    model: '',
                    type: '',
                };
            });
        } else {
            const regex = /VIN:\s(?<vin>[A-Z,0-9]{17})\s-\s(?<year>[0-9]{4})\s-\s(?<make>[A-Z,a-z,-]+)\s-\s(?<model>.*)/gm;
            let match;
            while ((match = regex.exec(this.templateText)) !== null) {
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                vehicles.push({
                    ...match.groups,
                    type: '',
                });
            }
        }

        return vehicles;

    }

    public getShipperAddress(): string | null {
        let shipperAddress = null;
        const shipperAddressInfo = /Shipment ID\n(.*)\n(?<shipperAddress>.*)\n/gm.exec(this.templateText);
        if (shipperAddressInfo) {
            shipperAddress = shipperAddressInfo.groups.shipperAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return shipperAddress;
    }

    public getShipperEmail(): string | null {
        let shipperEmail = null;
        const shipperAddress = this.getShipperAddress();
        const regex = new RegExp(shipperAddress + '\\n.*\\s(?<email>.*)E-Mail', 'gm');
        const shipperEmailInfo = regex.exec(this.templateText);
        if (shipperEmailInfo) {
            shipperEmail = shipperEmailInfo.groups.email
                .replace(/\n/g, ' ')
                .trim();
        }

        return shipperEmail;
    }

    public getShipperFullName(): string | null {
        let name = null;
        const nameInfo = /Contact: (?<name>[A-Z,a-z]+\s[A-Z,a-z]+)/gm.exec(this.templateText);
        if (nameInfo) {
            name = nameInfo.groups.name
                .replace(/\n/g, ' ')
                .trim();
        }

        return name;
    }

    public getShipperPhone(): string | null {
        let phone = null;
        let phoneInfo = /Contact: (?<name>[A-Z,a-z]+\s[A-Z,a-z]+)(?<phone>.*)•Phone/gm.exec(this.templateText);
        if (!phoneInfo) {
            phoneInfo = /Phone: (?<phone>[0-9,(,),\s,-]+)/gm.exec(this.templateText);
        }
        if (phoneInfo) {
            phone = phoneInfo.groups.phone
                .replace(/\n/g, ' ')
                .trim();
        }

        return phone;
    }

    public getShipperCompanyName(): string | null {
        return 'RPM';
    }

    public getPickUpInstructions(): string | null {
        const pickUpAddress = this.getPickUpAddress();
        let pickUpInstructions = null;
        const regex = new RegExp(pickUpAddress + '(?<pickUpInstructions>.*)Delivery$', 'gms');
        const pickUpInstructionsInfo = regex.exec(this.templateText);
        if (pickUpInstructionsInfo) {
            pickUpInstructions = pickUpInstructionsInfo.groups.pickUpInstructions;

            const hasPhoneNumber = /(?<hasNumber>(\([0-9]+\)).*)\n/.exec(pickUpInstructions);
            if (hasPhoneNumber) {
                const numberPhone = hasPhoneNumber.groups.hasNumber;
                if (pickUpInstructions.indexOf(numberPhone) < 2) {
                    pickUpInstructions = pickUpInstructions.replace(numberPhone, '');
                }
            }

            pickUpInstructions = pickUpInstructions.replace(/\n/g, ' ')
                .trim();
        }

        return pickUpInstructions;
    }

    public getDeliveryInstructions(): string | null {
        const deliveryAddress = this.getDeliveryAddress();
        let deliveryInstructions = null;
        const regex = new RegExp(deliveryAddress + '(?<deliveryInstructions>.*)Items', 'gms');
        const deliveryInstructionsInfo = regex.exec(this.templateText);

        if (deliveryInstructionsInfo) {
            deliveryInstructions = deliveryInstructionsInfo.groups.deliveryInstructions;
            const hasPhoneNumber = /(?<hasNumber>(\([0-9]+\)).*)\n/.exec(deliveryInstructions);
            if (hasPhoneNumber) {
                const numberPhone = hasPhoneNumber.groups.hasNumber;
                if (deliveryInstructions.indexOf(numberPhone) < 2) {
                    deliveryInstructions = deliveryInstructions.replace(numberPhone, '');
                }
            }

            deliveryInstructions = deliveryInstructions.replace(/\n/g, ' ')
                .trim();
        }

        return deliveryInstructions;
    }
}
