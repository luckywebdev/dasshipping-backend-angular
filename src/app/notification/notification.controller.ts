import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { NotificationDTO } from '../../dto/notification.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { NotificationRequestDTO } from './dto/create/notificationRequest.dto';
import { GetNotificationListResponse } from './dto/get/listResponse.dto';
import { NotificationService } from './notification.service';

@ApiUseTags('notifications')
@Controller('/notifications')
export class NotificationController {

    constructor(
        private readonly notificationService: NotificationService,
    ) { }

    @Post('/')
    @ApiOperation({ title: 'Create notification' })
    @ApiResponse({ status: HttpStatus.OK, type: NotificationDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard())
    createNotification(@Body() data: NotificationRequestDTO) {
        return this.notificationService.create(data);
    }

    @Post('/mark-all-as-read')
    @ApiOperation({ title: 'Create notification' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard())
    markAllAsRead(@Account() account: AccountEntity) {
        return this.notificationService.markAllAsRead(account);
    }

    @Get('/')
    @ApiOperation({ title: 'Get Notification List' })
    @ApiResponse({ status: HttpStatus.OK, type: GetNotificationListResponse })
    @UseGuards(AuthGuard())
    getNotifications(@Account() account: AccountEntity, @Query() query: GetList, @Query('status') status: string) {
        return this.notificationService.getList(account, query, status);
    }

    @Patch('/:id')
    @ApiOperation({ title: 'Mark notification as viewed' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @UseGuards(AuthGuard())
    markAsViewed(@Account() account: AccountEntity, @Param('id') notificationId: number) {
        return this.notificationService.markAsViewed(account, notificationId);
    }

    @Delete('/:id')
    @ApiOperation({ title: 'Remove notification' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @UseGuards(AuthGuard())
    delete(@Account() account: AccountEntity, @Param('id') notificationId: number) {
        return this.notificationService.delete(account, notificationId);
    }
}
