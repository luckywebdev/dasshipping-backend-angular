// the interface can be split into many small interfaces by some types
export interface OrderParserInterface {
    getOrderId(): string | null;
    getPickUpDate(): Date | null;
    getDeliveryDate(): Date | null;
    getTrailerType(): string | null;
    getCondition(): string | null;
    getDispatchInstructions(): string | null;
    getVehicles(): Array<{
        year: string;
        make: string;
        model: string;
        vin: string;
        type: string;
        inop?: boolean
    }>;
    getPickUpAddress(): string | null;
    getDeliveryAddress(): string | null;
    getSender(): {
        firstName: string;
        lastName: string;
        phoneNumber: string;
    } | null;
    getReceiver(): {
        firstName: string;
        lastName: string;
        phoneNumber: string;
    } | null;
    getPriceOwesToCarrier(): string | null;
    getShipperCompanyName(): string | null;
    getShipperAddress(): string | null;
    getShipperFullName(): string | null;
    getShipperPhone(): string | null;
    getShipperEmail(): string | null;
    getPaymentTerms(): string | null;
    getPickUpInstructions(): string | null;
    getDeliveryInstructions(): string | null;
    toJson(): any;
}
