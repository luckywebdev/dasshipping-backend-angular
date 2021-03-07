import { OrderDTO } from '../../../dto/order.dto';

export class CompanyScope {
    public static order(data: OrderDTO): OrderDTO {
        delete data.discount;
        delete data.initialPrice;
        delete data.clientPaymentStatus;
        return data;
    }

    public static orders(data: any): OrderDTO[] {
        return data.map(CompanyScope.order);
    }
}
