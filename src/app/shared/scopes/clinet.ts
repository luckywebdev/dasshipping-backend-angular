import { OrderDTO } from '../../../dto/order.dto';
import { QuoteDTO } from '../../../dto/quote.dto';
import { fileSign } from '../../../utils/fileSign.util';

export class ClientScope {
  public static order(data: OrderDTO): OrderDTO {
    delete data.salePrice;
    delete data.initialPrice;
    delete data.loadPrice;
    delete data.shipper;
    delete data.shipperId;
    delete data.brokerFee;
    delete data.paymentMethods;
    delete data.paymentNote;
    delete data.clientPaymentStatus;
    if (data.inspections && data.inspections.length) {
      data.inspections = data.inspections.map(inspection => {
        return {
          ...inspection,
          images: inspection.images.map(item => {
            return {
              ...item,
              signedUrl: fileSign(item.url),
            };
          }),
        };
      });
    }
    return data;
  }
  public static quote(data: QuoteDTO): QuoteDTO {
    delete data.salePrice;
    delete data.loadPrice;
    return data;
  }

  public static orders(data: OrderDTO[]): OrderDTO[] {
    return data.map(ClientScope.order);
  }

  public static quotes(data: QuoteDTO[]): QuoteDTO[] {
    return data.map(ClientScope.quote);
  }
}
