import { Body, Controller, Get, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { TruckDTO } from '../../dto/truck.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { RequestTruckDTO } from './dto/requestTruck.dto';
import { TruckService } from './truck.service';

@ApiUseTags('truck')
@Controller('/truck')
export class TruckController {
    constructor(
        private readonly truckService: TruckService,
    ) { }

    @Post('/me')
    @ApiOperation({ title: 'Create Account truck' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TruckDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    createAccountTrack(@Account() account: AccountEntity, @Body() data: RequestTruckDTO) {
        return this.truckService.createAccountTruck(account, data);
    }

    @Get('/me')
    @ApiOperation({ title: 'Get Account truck' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    getAccountTruck(@Account() account: AccountEntity) {
        return this.truckService.getAccountTruck(account);
    }

    @Put('/me')
    @ApiOperation({ title: 'Update Account truck' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TruckDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    updateAccountTrack(@Account() account: AccountEntity, @Body() data: RequestTruckDTO) {
        return this.truckService.updateAccountTruck(account, data);
    }

    @Post('/')
    @ApiOperation({ title: 'Create truck' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TruckDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    createTrack(@Body() data: RequestTruckDTO) {
        return this.truckService.createTruck(data);
    }

    @Put('/:id')
    @ApiOperation({ title: 'Update truck' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TruckDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.DISPATCHER, ROLES.COMPANY_ADMIN)
    updateTrack(@Param('id') id: number, @Body() data: RequestTruckDTO) {
        return this.truckService.updateTruck(id, data);
    }

    @Get('/:id')
    @ApiOperation({ title: 'Get truck' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TruckDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    getTrack(@Param('id') id: number) {
        return this.truckService.getTruck(id);
    }
}
