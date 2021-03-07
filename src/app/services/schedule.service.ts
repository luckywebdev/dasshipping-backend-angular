import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';

import { OrderService } from '../order/order.service';
import { RegisterService } from '../register/register.service';
import { TemporaryLeadService } from '../temporaryLead/temporaryLead.service';

@Injectable()
export class ScheduleService extends NestSchedule {

    constructor(
        private orderService: OrderService,
        private temporaryLeadService: TemporaryLeadService,
        private registerService: RegisterService,
    ) {
        super();
    }

    // run once a day at 08:00
    @Cron('0 8 * * *')
    async removeExpiredTemporaryLeads() {
        await this.temporaryLeadService.removeExpired();
        await this.orderService.lateDate();
    }

    @Cron('00 47 * * * *')
    async checkExpiredInvite() {
        await this.registerService.checkExpiredInvitation();
    }
}
