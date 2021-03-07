import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Client, Server } from 'socket.io';

@WebSocketGateway()
export class EventsGateway implements OnGatewayDisconnect {
    @WebSocketServer() private server: Server;

    private identities: any = {};

    @SubscribeMessage('server-notification')
    notification(client: Client, data: number): string {
        return 'ok';
    }

    @SubscribeMessage('identity')
    identity(client: Client, accountId: number): string {
        if (!this.identities[accountId]) {
            this.identities[accountId] = {};
        }
        this.identities[accountId][client.id] = 'active';

        return 'success';
    }

    public sendMessage(accountId: number, data: any): void {
        if (!this.identities[accountId]) {
            return;
        }
        Object.keys(this.identities[accountId]).map(clientId => {
            this.server.in(clientId).emit('client-notification', data);
        });
    }

    async handleDisconnect(client: Client) {
        const accountId = Object.keys(this.identities).find(accId => this.identities[accId][client.id]);
        if (this.identities[accountId]) {
            delete this.identities[accountId][client.id];
        }

        if (this.identities && this.identities[accountId] && !Object.values(this.identities[accountId]).length) {
            delete this.identities[accountId];
        }
    }
}
