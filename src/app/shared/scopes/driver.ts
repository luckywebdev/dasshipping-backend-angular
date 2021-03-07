import { OrderDTO } from '../../../dto/order.dto';

export class DriverScope {
    public static order(data: OrderDTO): OrderDTO {
        delete data.discount;
        delete data.initialPrice;
        delete data.brokerFee;
        delete data.paymentNote;
        delete data.clientPaymentStatus;
        return data;
    }

    public static orders(data: any): OrderDTO[] {
        return data.map(DriverScope.order);
    }
}
