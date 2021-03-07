import { TokenTypes } from '../../auth.service';

export class JwtPayload {
    email: string;
    id?: number;
    orderId?: number;
    type: TokenTypes;
}
