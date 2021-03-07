import { Body, Controller, Get, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { TrailerDTO } from '../../dto/trailer.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { RequestTrailerDTO } from './dto/requestTrailer.dto';
import { TrailerService } from './trailer.service';

@ApiUseTags('trailer')
@Controller('/trailer')
export class TrailerController {
    constructor(
        private readonly trailerService: TrailerService,
    ) { }

    @Post('/me')
    @ApiOperation({ title: 'Create Account trailer' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TrailerDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    createAccountTrack(@Account() account: AccountEntity, @Body() data: RequestTrailerDTO) {
        return this.trailerService.createAccountTrailer(account, data);
    }

    @Get('/me')
    @ApiOperation({ title: 'Get Account trailer' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    getAccountTrailer(@Account() account: AccountEntity) {
        return this.trailerService.getAccountTrailer(account);
    }

    @Put('/me')
    @ApiOperation({ title: 'Update Account trailer' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TrailerDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    updateAccountTrailer(@Account() account: AccountEntity, @Body() data: RequestTrailerDTO) {
        return this.trailerService.updateAccountTrailer(account, data);
    }

    @Post('/')
    @ApiOperation({ title: 'Create trailer' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TrailerDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER, ROLES.DISPATCHER, ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    createTrailer(@Body() data: RequestTrailerDTO) {
        return this.trailerService.createTrailer(data);
    }

    @Put('/:id')
    @ApiOperation({ title: 'Update trailer' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TrailerDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.DISPATCHER, ROLES.COMPANY_ADMIN)
    updateTrailer(@Param('id') id: number, @Body() data: RequestTrailerDTO) {
        return this.trailerService.updateTrailer(id, data);
    }

    @Get('/:id')
    @ApiOperation({ title: 'Get trailer' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TrailerDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    getTrailer(@Param('id') id: number) {
        return this.trailerService.getTrailer(id);
    }
}
