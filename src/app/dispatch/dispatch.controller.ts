import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectEventEmitter } from 'nest-emitter';

import { ROLES } from '../../constants/roles.constant';
import { DispatchDTO } from '../../dto/dispatch.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { AppEventEmitter } from '../event/app.events';
import { DispatchService } from './dispatch.service';
import { DispatchRequestDTO } from './dto/dispatchRequest.dto';
import { DispatchListResponseDTO } from './dto/list/dispatchListResponse.dto';
import { DispatchListRequest } from './dto/list/requestList.dto';
import { DispatchUpdateDTO } from './dto/update.dto';

@ApiUseTags('dispatch')
@Controller('/dispatch')
export class DispatchController {
    constructor(
        private readonly dispatcherService: DispatchService,
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    ) { }

    @Post('/')
    @ApiOperation({ title: 'Create Dispatch' })
    @ApiResponse({ status: HttpStatus.OK, type: DispatchDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    async create(@Account() account, @Body() data: DispatchRequestDTO) {
        const resp = await this.dispatcherService.create(account, data);
        this.emitter.emit('order_timeline', {
            orderId: data.orderId,
            actionAccountId: account.id,
            description: `Order request to dispatch sent by ${account.firstName} ${account.lastName}`,
        });
        return resp;
    }

    @Get('/')
    @ApiOperation({ title: 'Get Dispatches list' })
    @ApiResponse({ status: HttpStatus.OK, type: DispatchListResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.SUPER_ADMIN, ROLES.DISPATCHER)
    getList(@Account() account, @Query() query: DispatchListRequest) {
        return this.dispatcherService.getList(account, query);
    }

    @Patch('/:id')
    @ApiOperation({ title: 'Cancel Dispatches' })
    @ApiResponse({ status: HttpStatus.OK, type: DispatchDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    update(@Account() account: AccountEntity, @Param('id') id: number, @Body() data: DispatchUpdateDTO) {
        return this.dispatcherService.update(account, id, data);
    }

    @Post('/:id/cancel')
    @ApiOperation({ title: 'Cancel Dispatches' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    cancel(@Account() account, @Param('id') id: number) {
        return this.dispatcherService.cancel(account, id);
    }

    @Post('/:id/accept')
    @ApiOperation({ title: 'Accept a request dispatch by id' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    accept(@Param('id') id: number) {
        return this.dispatcherService.accept(id);
    }
}
