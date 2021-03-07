import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { GeneralDTO } from '../../dto/general.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GeneralPatchDTO } from './dto/patch/request.dto';
import { GeneralService } from './general.service';

@ApiUseTags('general')
@Controller('/general')
export class GeneralController {
    constructor(
        private readonly generalService: GeneralService,
    ) { }

    @Get('/')
    @ApiOperation({ title: 'Get General Settings' })
    @ApiResponse({ status: HttpStatus.OK, type: GeneralDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    find() {
        return this.generalService.find();
    }

    @Patch('/')
    @ApiOperation({ title: 'Patch General Settings' })
    @ApiResponse({ status: HttpStatus.OK, type: GeneralDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    patch(@Body() body: GeneralPatchDTO) {
        return this.generalService.patch(body);
    }
}
