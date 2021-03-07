import { OrderParserInterface } from './orderParser.interface';

export abstract class AbstractOrderParser implements OrderParserInterface {
    protected readonly templateText: string;

    constructor(templateText: string) {
        this.templateText = templateText;
    }

    getCondition(): string | null {
        return null;
    }

    getDeliveryAddress(): string | null {
        return null;
    }

    getDeliveryDate(): Date | null {
        return null;
    }

    getDeliveryInstructions(): string | null {
        return null;
    }

    getDispatchInstructions(): string | null {
        return null;
    }

    getPaymentTerms(): string | null {
        return null;
    }

    getPickUpAddress(): string | null {
        return null;
    }

    getPickUpDate(): Date | null {
        return null;
    }

    getPickUpInstructions(): string | null {
        return null;
    }

    getPriceOwesToCarrier(): string | null {
        return null;
    }

    getReceiver(): { firstName: string; lastName: string; phoneNumber: string } | null {
        return null;
    }

    getSender(): { firstName: string; lastName: string; phoneNumber: string } | null {
        return null;
    }

    getShipperAddress(): string | null {
        return null;
    }

    getShipperCompanyName(): string | null {
        return null;
    }

    getShipperEmail(): string | null {
        return null;
    }

    getShipperFullName(): string | null {
        return null;
    }

    getShipperPhone(): string | null {
        return null;
    }

    getTrailerType(): string | null {
        return null;
    }

    getVehicles(): Array<{ year: string; make: string; model: string; vin: string; type: string }> {
        return null;
    }

    getOrderId(): string | null {
        return null;
    }

    toJson(): any {
        return {
            pickUpAddress: this.getPickUpAddress(),
            deliveryAddress: this.getDeliveryAddress(),
            pickUpDate: this.getPickUpDate(),
            deliveryDate: this.getDeliveryDate(),
            vehicles: this.getVehicles(),
            dispatchInstructions: this.getDispatchInstructions(),
            paymentTerms: this.getPaymentTerms(),
            condition: this.getCondition(),
            priceOwesToCarrier: this.getPriceOwesToCarrier(),
            receiver: this.getReceiver(),
            sender: this.getSender(),
            shipperAddress: this.getShipperAddress(),
            shipperEmail: this.getShipperEmail(),
            shipperCompanyName: this.getShipperCompanyName(),
            shipperFullName: this.getShipperFullName(),
            shipperPhone: this.getShipperPhone(),
            trailerType: this.getTrailerType(),
            pickUpInstructions: this.getPickUpInstructions(),
            deliveryInstructions: this.getDeliveryInstructions(),
            externalId: this.getOrderId(),
        };
    }

}
