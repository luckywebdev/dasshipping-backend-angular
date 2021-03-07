import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { JoinRequestDTO } from '../../dto/joinRequest.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { JoinCompanyRequest } from './dto/joinRequest.dto';
import { GetJoinedRequests } from './dto/requestList.dto';
import { JoinRequestService } from './joinRequest.service';
import {NotFoundDTO} from '../dto/notFound.dto';

@ApiUseTags('joinRequest')
@Controller('/join-request')
export class JoinRequestController {
    constructor(
        private readonly joinRequestService: JoinRequestService,
    ) { }

    @Post('/')
    @ApiOperation({ title: 'Join Company Request' })
    @ApiResponse({ status: HttpStatus.OK, type: JoinRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    joinRequest(@Body() data: JoinCompanyRequest, @Account() account: AccountEntity) {
        return this.joinRequestService.createJoinRequest(data, account);
    }

    @Get('/:status?')
    @ApiOperation({ title: 'Get Join Requests list' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: JoinRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getJoinRequest(@Query() query: GetJoinedRequests, @Account() account: AccountEntity, @Param('status') status: string) {
        return this.joinRequestService.getJoinedRequests(account, query, status);
    }

    @Post('/:id/:action(accept|decline)')
    @ApiOperation({ title: 'Accept/Decline Join Request' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.OK, type: JoinRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    acceptDeclineJoinRequest(@Param('id') id: number, @Param('action') action: string) {
        return this.joinRequestService.joinRequestAction(id, action);

    }

    @Post('/:id/cancel')
    @ApiOperation({ title: 'Cancel Join Request' })
    @ApiResponse({ status: HttpStatus.OK, type: JoinRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    cancelJoinRequest(@Param('id') id: number) {
        return this.joinRequestService.joinRequestAction(id, 'cancel');
    }
}
