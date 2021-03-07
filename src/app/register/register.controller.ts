import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Next,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as deeplink from 'node-deeplink';

import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { CompanyDTO } from '../../dto/company.dto';
import { InviteDTO } from '../../dto/invite.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { AuthService } from '../auth/auth.service';
import { LoginResponse } from '../auth/dto/login/response.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GetAccountInvitesListRequest } from './dto/account-invite-list/request.dto';
import { GetAccountInvitesListResponse } from './dto/account-invite-list/response.dto';
import { AccountInviteRequest } from './dto/account-invite/request.dto';
import { CarrierEditRegisterRequest } from './dto/carrier-changes/request.dto';
import { CarrierInviteRequest } from './dto/carrier-invite/request.dto';
import { CarrierNewRegisterRequest } from './dto/carrier-new-register/request.dto';
import { CarrierNewRegisterResponse } from './dto/carrier-new-register/response.dto';
import { CarrierRegisterRequest } from './dto/carrier-register/request.dto';
import { CarrierRegisterResponse } from './dto/carrier-register/response.dto';
import { ClientRegisterRequest } from './dto/client-register/request.dto';
import { CommonRegisterRequest } from './dto/common-register/request.dto';
import { CommonRegisterResponse } from './dto/common-register/response.dto';
import { GetCompanyInvitesListRequest } from './dto/company-invite-list/request.dto';
import { GetCompanyInvitesListResponse } from './dto/company-invite-list/response.dto';
import { DeclineAccountInviteRequest } from './dto/decline-account-invite/request.dto';
import { DeclineAccountInviteResponse } from './dto/decline-account-invite/response.dto';
import { DriverRegisterRequest } from './dto/driver-register/request.dto';
import { EmailConfirmRedirect } from './dto/email-confirm-redirect/request.dto';
import { ExpireInviteRequest } from './dto/expire-invite/request.dto';
import { ExpireInviteResponse } from './dto/expire-invite/response.dto';
import { InviteRequestChangesRequest } from './dto/invite-request-changes/request.dto';
import { InviteRequestChangesResponse } from './dto/invite-request-changes/response.dto';
import { RegisterRedirect } from './dto/register-redirect/request.dto';
import { ResendConfirmationCodeRequest } from './dto/resend-confirmation-code/request.dto';
import { ResendInviteRequest } from './dto/resend-invite/request.dto';
import { ResendInviteResponse } from './dto/resend-invite/response.dto';
import { ValidateConfirmationCodeRequest } from './dto/validate-confirmation-code/request.dto';
import { ValidateTokenRequest } from './dto/validate-token/request.dto';
import { ValidateTokenResponse } from './dto/validate-token/response.dto';
import { RegisterService } from './register.service';
import { GetInviteRequest } from './dto/carrier-invite/get-invite.dto';

@ApiUseTags('register')
@Controller('register')
export class RegisterController {
    constructor(
        private readonly registerService: RegisterService,
        private readonly authService: AuthService,
    ) {
    }

    @Post('/carrier')
    @ApiOperation({ title: 'Carrier registration' })
    @ApiResponse({ status: HttpStatus.OK, type: CarrierRegisterResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    async carrier(@Body() data: CarrierRegisterRequest) {
        return await this.authService.recaptchaValidate(data.token)
            .then(() => {
                delete data.token;
                return this.registerService.carrier(data);
            });

    }

    @Patch('/carrier')
    @ApiOperation({ title: 'Carrier request changes' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    editCarrier(@Body() data: CarrierEditRegisterRequest) {
        return this.registerService.carrierEdit(data);
    }

    @Post('/carrier-new')
    @ApiOperation({ title: 'Carrier New registration' })
    @ApiResponse({ status: HttpStatus.OK, type: CarrierNewRegisterResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    async carrierNew(@Body() data: CarrierNewRegisterRequest) {
        return await this.authService.recaptchaValidate(data.token)
            .then(() => {
                delete data.token;
                return this.registerService.carrierNew(data);
            });
    }

    @Post('/client')
    @ApiOperation({ title: 'Client Registration' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    client(@Body() data: ClientRegisterRequest) {
        return this.registerService.client(data);
    }

    @Post('/common')
    @ApiOperation({ title: 'Common registration' })
    @ApiResponse({ status: HttpStatus.OK, type: CommonRegisterResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    async common(@Body() data: CommonRegisterRequest) {
        return await this.authService.recaptchaValidate(data.token)
            .then(() => {
                return this.registerService.common(data);
            });

    }

    @Post('/invite-account-decline')
    @ApiOperation({ title: 'Decline Invite account' })
    @ApiResponse({ status: HttpStatus.OK, type: DeclineAccountInviteResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    declineInviteAccount(@Body() data: DeclineAccountInviteRequest) {
        return this.registerService.declineInviteAccount(data);
    }

    @Post('/invite-carrier-decline')
    @ApiOperation({ title: 'Decline Invite carrier' })
    @ApiResponse({ status: HttpStatus.OK, type: DeclineAccountInviteResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    declineInviteCarrier(@Body() data: DeclineAccountInviteRequest) {
        return this.registerService.declineInviteAccount(data, true);
    }

    @Post('/driver')
    @ApiOperation({ title: 'Driver Registration' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    driver(@Body() data: DriverRegisterRequest) {
        return this.registerService.driver(data);
    }

    @Get('/invite')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    @ApiOperation({ title: 'Get account invites' })
    @ApiResponse({ status: HttpStatus.OK, type: GetAccountInvitesListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getAccountInvitesList(@Account() account: AccountEntity, @Query() query: GetAccountInvitesListRequest) {
        return this.registerService.getAccountInvitesList(account, query);
    }

    @Get('/invite-exists')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Get account invites' })
    @ApiResponse({ status: HttpStatus.OK, type: InviteDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getCarrierInvite(@Query() query: GetInviteRequest) {
        return this.registerService.getInvite(query);
    }

    @Get('/invite-company')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Get company invites' })
    @ApiResponse({ status: HttpStatus.OK, type: GetCompanyInvitesListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getCompanyInvitesList(@Account() account: AccountEntity, @Query() query: GetCompanyInvitesListRequest) {
        return this.registerService.getCompanyInviteList(account, query);
    }

    @Post('/invite-resend')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    @ApiOperation({ title: 'Resend invite' })
    @ApiResponse({ status: HttpStatus.OK, type: ResendInviteResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    invite(@Body() data: ResendInviteRequest, @Account() account: AccountEntity) {
        return this.registerService.resendInvite(data, account);
    }

    @Post('/invite-account')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Invite account' })
    @ApiResponse({ status: HttpStatus.OK, type: InviteDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    inviteAccount(@Body() data: AccountInviteRequest, @Account() account: AccountEntity) {
        return this.registerService.inviteAccount(data, account);
    }

    @Post('/invite-carrier')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Invite carrier' })
    @ApiResponse({ status: HttpStatus.OK, type: InviteDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    inviteCarrier(@Body() data: CarrierInviteRequest, @Account() account: AccountEntity) {
        return this.registerService.inviteCarrier(data, account);
    }

    @Post('/invite-expire')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    @ApiOperation({ title: 'Expire invite' })
    @ApiResponse({ status: HttpStatus.OK, type: ExpireInviteResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    inviteExpire(@Body() data: ExpireInviteRequest, @Account() account: AccountEntity) {
        return this.registerService.expireInvite(data, account);
    }

    @Post('/invite-retrieve/:id')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Retrieve invite' })
    @ApiResponse({ status: HttpStatus.OK, type: ExpireInviteResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    inviteRetrieve(@Param('id') id: number) {
        return this.registerService.retrieveInvite(id);
    }

    @Post('/invite-request-changes')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Request changes for invite' })
    @ApiResponse({ status: HttpStatus.OK, type: InviteRequestChangesResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    inviteRequestChanges(@Body() data: InviteRequestChangesRequest) {
        return this.registerService.inviteRequestChanges(data);
    }

    @Post('/validate-token')
    @ApiOperation({ title: 'Validate Register Token' })
    @ApiResponse({ status: HttpStatus.OK, type: ValidateTokenResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    validateToken(@Body() data: ValidateTokenRequest) {
        return this.registerService.validateToken(data);
    }

    @Post('/validate-confirmation-code')
    @ApiOperation({ title: 'Validate Email Confirmation Code' })
    @ApiResponse({ status: HttpStatus.OK, type: LoginResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    validateCode(@Body() data: ValidateConfirmationCodeRequest) {
        return this.registerService.validateCode(data);
    }

    @Post('/resend-confirmation-code')
    @ApiOperation({ title: 'Resend Email Confirmation Code' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    resendCode(@Body() data: ResendConfirmationCodeRequest) {
        return this.registerService.resendCode(data);
    }

    @Get('/company/:hash')
    @ApiOperation({ title: 'Get Company By Hash' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CompanyDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getByHash(@Param('hash') hash: string) {
        return this.registerService.getByHash(hash);
    }

    @Get('/email-confirm-redirect/:hash')
    async codeConfirmRedirect(@Param() data: EmailConfirmRedirect, @Req() req: Request, @Res() res: Response, @Next() next) {
        const resp = await this.registerService.codeConfirmRedirect(data);
        const fn = deeplink({
            url: resp.url,
            fallback: resp.fallback,
            android_package_name: resp.androidId,
            ios_store_link: resp.iosLink,
        });
        return fn(req, res, next);
    }

    @Get('/redirect/:role/:hash')
    async acceptInviteRedirect(@Param() data: RegisterRedirect, @Req() req: Request, @Res() res: Response, @Next() next) {
        const resp = await this.registerService.registerRedirect(data);
        const fn = deeplink({
            url: resp.url,
            fallback: resp.fallback,
            android_package_name: resp.androidId,
            ios_store_link: resp.iosLink,
        });
        return fn(req, res, next);
    }
}
