import {Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { PolicyDTO } from '../../dto/policy.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { PolicyCreateRequest } from './create/request.dto';
import { GetPolicyListResponse } from './list/response.dto';
import { PolicyService } from './policy.service';
import {RequestPolicyDTO} from './list/request.dto';

@ApiUseTags('policy')
@Controller('policy')
export class PolicyController {
    constructor(
        private readonly policyService: PolicyService,
    ) { }

    @Delete('/:id')
    @ApiOperation({ title: 'Delete Price Policy' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    delete(@Param('id') id: number) {
        return this.policyService.delete(id);
    }

    @Get('/')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.CLIENT)
    @ApiOperation({ title: 'Get policy list' })
    @ApiResponse({ status: HttpStatus.OK, type: GetPolicyListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getPolicyList(@Query() query: RequestPolicyDTO) {
        return this.policyService.get(query);
    }

    @Patch('/:id')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Edit Price Policy' })
    @ApiResponse({ status: HttpStatus.OK, type: PolicyDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    patch(@Body() data: PolicyCreateRequest, @Param('id') id: number) {
        return this.policyService.patch(id, data);
    }

    @Post('/')
    @ApiOperation({ title: 'Create Price Policy' })
    @ApiResponse({ status: HttpStatus.OK, type: PolicyDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    post(@Body() data: PolicyCreateRequest) {
        return this.policyService.post(data);
    }

    @Post('/sync')
    @ApiOperation({ title: 'Sync car type list' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    syncCarTypes() {
        return this.policyService.sync();
    }

}
