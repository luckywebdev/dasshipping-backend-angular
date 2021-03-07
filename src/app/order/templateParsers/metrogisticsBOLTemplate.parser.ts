import {OrderParserInterface} from './orderParser.interface';
import {AbstractOrderParser} from './abstractOrderParser';

export class MetrogisticsBOLTemplate extends AbstractOrderParser implements OrderParserInterface {

    public getPickUpAddress(): string | null {
        let pickUpAddress = null;
        const pickUpAddressInfo = /P\ni\nc\nk\nU\np\n.*ID: [0-9]*(?<pickUpAddress>.*)D\ne\nl\ni\nv\ne\nr/gms.exec(this.templateText);
        if (pickUpAddressInfo) {
            pickUpAddress = pickUpAddressInfo.groups.pickUpAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return pickUpAddress;
    }

    public getDeliveryAddress(): string | null {
        let deliveryAddress = null;
        const deliveryAddressInfo = /D\ne\nl\ni\nv\ne\nr.*ID: [0-9]*(?<deliveryAddress>.*)\n[0-9]+\sVehicle\(s\)/gms.exec(this.templateText);
        if (deliveryAddressInfo) {
            deliveryAddress = deliveryAddressInfo.groups.deliveryAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return deliveryAddress;
    }

    public getPickUpDate(): Date | null {
        let pickUpDate = null;
        const pickUpDateInfo = /P\ni\nc\nk\nU\np\n(?<pickUpDate>[A-Z,a-z,0-9,-]*)/gm.exec(this.templateText);
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
        const deliveryDateInfo = /D\ne\nl\ni\nv\ne\nr\n(?<deliveryDate>[A-Z,a-z,0-9,-]*)/gm.exec(this.templateText);
        if (deliveryDateInfo) {
            deliveryDate = new Date(
                deliveryDateInfo.groups.deliveryDate.replace(/\n/g, ' ')
                    .trim(),
            );
        }

        return deliveryDate;
    }

    public getDispatchInstructions(): string | null {
        let dispatchInstructions = null;
        const dispatchInstructionsInfo = /Special Instructions:\n(?<dispatchInstructions>.*)P\ni\nc\nk\nU\np/gms.exec(this.templateText);
        if (dispatchInstructionsInfo) {
            dispatchInstructions = dispatchInstructionsInfo.groups.dispatchInstructions
                .replace(/\n/g, ' ')
                .trim();
        }

        return dispatchInstructions;
    }

    public getDeliveryInstructions(): string | null {
        let deliveryInstructions = null;
        const deliveryInstructionsInfo = /UnitInfo \/ BayDamage Survey.*(?<vin>[A-Z,0-9]{17})\n(?<info>.*)}\n(?<deliveryInstructions>.*)\nDriver\sSignature/gms.exec(this.templateText);

        if (deliveryInstructionsInfo) {
            deliveryInstructions = deliveryInstructionsInfo.groups.deliveryInstructions
                .replace(/\n/g, ' ')
                .trim();
        }

        return deliveryInstructions;
    }

    public getShipperAddress(): string | null {
        let shipperAddress = null;
        const shipperAddressInfo = /Metrogistics\n(?<shipperAddress>.*)/gm.exec(this.templateText);
        if (shipperAddressInfo) {
            shipperAddress = shipperAddressInfo.groups.shipperAddress
                .replace(/\n/g, ' ')
                .trim();
        }

        return shipperAddress;
    }

    public getShipperPhone(): string | null {
        let phone = null;
        const phoneInfo = /Tel: (?<phone>[\(,\),\-,0-9,\s]*)/gm.exec(this.templateText);
        if (phoneInfo) {
            phone = phoneInfo.groups.phone
                .replace(/\n/g, ' ')
                .trim();
        }

        return phone;
    }

    public getShipperCompanyName(): string | null {
        return 'MetroGistics';
    }

    public getVehicles(): Array<{ year: string; make: string; model: string; vin: string; type: string }> {
        const vehicles = [];
        const regex = /\n(?<vin>[A-Z,0-9]{17})\n/gms;
        let match;
        while ((match = regex.exec(this.templateText)) !== null) {
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            vehicles.push({
                vin: match.groups.vin,
                year: '',
                make: '',
                model: '',
                type: '',
            });
        }

        return vehicles;
    }
}
