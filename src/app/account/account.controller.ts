import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Next,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitQuery, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as deeplink from 'node-deeplink';

import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { Account } from './account.decorator';
import { AccountService } from './account.service';
import { ApproveAccountsRequest } from './dto/approve/request.dto';
import { ApproveAccountsResponse } from './dto/approve/response.dto';
import { BlockAccountRequest } from './dto/blockAccount/request.dto';
import { BlockAccountResponse } from './dto/blockAccount/response.dto';
import { BlockAccountsRequest } from './dto/blockAccounts/request.dto';
import { DeleteAccountsRequest } from './dto/delete/request.dto';
import { DeleteAccountsResponse } from './dto/delete/response.dto';
import { AccountEditRequest } from './dto/edit/request.dto';
import { FileSignResponse } from './dto/file-sign/response.dto';
import { ForgotPasswordRequest } from './dto/forgot-password/request.dto';
import { ForgotPasswordResponse } from './dto/forgot-password/response.dto';
import { GetAccountsListRequest } from './dto/list/request.dto';
import { GetAccountsListResponse } from './dto/list/response.dto';
import { PatchUserRequest } from './dto/patch/request.dto';
import { ResetPasswordRequest } from './dto/reset-password/request.dto';
import { ResetPasswordResponse } from './dto/reset-password/response.dto';
import { SaveSignatureRequest } from './dto/saveSignature.dto';
import { ValidateResetPasswordTokenRequest } from './dto/validate-reset-password-token/request.dto';
import { ValidateResetPasswordTokenResponse } from './dto/validate-reset-password-token/response.dto';

@ApiUseTags('account')
@Controller('/account')
export class AccountController {
    constructor(
        private readonly accountService: AccountService,
    ) {
    }

    @Post('/approve')
    @ApiOperation({ title: 'Approve Accounts' })
    @ApiResponse({ status: HttpStatus.OK, type: ApproveAccountsResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    approve(@Account() account: AccountEntity, @Body() data: ApproveAccountsRequest) {
        return this.accountService.approve(account, data);
    }

    @Post('/block')
    @ApiOperation({ title: 'Block Accounts' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    block(@Account() account: AccountEntity, @Body() data: BlockAccountsRequest) {
        return this.accountService.blockAccounts(account, data);
    }

    @Post('/delete')
    @ApiOperation({ title: 'Delete Accounts' })
    @ApiResponse({ status: HttpStatus.OK, type: DeleteAccountsResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    delete(@Account() account: AccountEntity, @Body() data: DeleteAccountsRequest) {
        return this.accountService.delete(account, data);
    }

    @Patch('/me')
    @UseGuards(AuthGuard())
    @ApiOperation({ title: 'Edit Current Account Profile' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    editMyProfile(@Account() account: AccountEntity, @Body() data: AccountEditRequest) {
        return this.accountService.editMyProfile(account, data);
    }

    @Get('/me')
    @ApiOperation({ title: 'Get Current Account Profile' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiBearerAuth()
    @UseGuards(AuthGuard())
    get(@Account() account: AccountEntity) {
        return this.accountService.getMyProfile(account);
    }

    @Post('/me/signature')
    @ApiOperation({ title: 'Save account signature' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER, ROLES.CLIENT)
    saveSignature(@Account() account: AccountEntity, @Body() data: SaveSignatureRequest) {
        return this.accountService.saveSignature(account, data);
    }

    @Get('/me/dispatcher')
    @ApiOperation({ title: 'Get assigned dispatcher' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiBearerAuth()
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    getDispatcher(@Account() account: AccountEntity) {
        return this.accountService.getDispatcherProfile(account);
    }

    @Get('/')
    @ApiOperation({ title: 'Get Accounts List' })
    @ApiResponse({ status: HttpStatus.OK, type: GetAccountsListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    @ApiImplicitQuery({ name: 'GetAccountsListRequest', type: GetAccountsListRequest })
    getAccountsList(@Account() account: AccountEntity, @Query() query: GetAccountsListRequest) {
        return this.accountService.getAccountsList(account, query);
    }

    @Post('/forgot-password')
    @ApiOperation({ title: 'Forgot Password' })
    @ApiResponse({ status: HttpStatus.OK, type: ForgotPasswordResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    getToken(@Body() data: ForgotPasswordRequest) {
        return this.accountService.forgotPassword(data);
    }

    @Patch('/:id')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperation({ title: 'Edit Account Profile' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    patch(@Param('id') id: number, @Body() data: PatchUserRequest) {
        return this.accountService.patch(data, id, {});
    }

    @Post('/reset-password')
    @ApiOperation({ title: 'Reset Password' })
    @ApiResponse({ status: HttpStatus.OK, type: ResetPasswordResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    resetPassword(@Body() data: ResetPasswordRequest) {
        return this.accountService.resetPassword(data);
    }

    @Get('/file/:filename')
    @ApiOperation({ title: 'Get Url Sign' })
    @ApiResponse({ status: HttpStatus.OK, type: FileSignResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    getFileSign(@Param('filename') filename: string) {
        return this.accountService.getFileSign(filename);
    }

    @Get('/reset-password/:hash')
    async resetPasswordRedirect(@Param() data: ValidateResetPasswordTokenRequest, @Req() req: Request, @Res() res: Response, @Next() next) {
        const resp = await this.accountService.resetPasswordRedirect(data);
        const fn = deeplink({
            url: resp.url,
            fallback: resp.fallback,
            android_package_name: resp.androidId,
            ios_store_link: resp.iosLink,
        });
        return fn(req, res, next);
    }

    @Post('/validate-reset-password-token')
    @ApiOperation({ title: 'Validate reset password token' })
    @ApiResponse({ status: HttpStatus.OK, type: ValidateResetPasswordTokenResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    validateResetPasswordToken(@Body() data: ValidateResetPasswordTokenRequest) {
        return this.accountService.validateResetPasswordToken(data);
    }

    @Delete('/me/leave-company')
    @ApiOperation({ title: 'Leave Company' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    leaveCompany(@Account() account: AccountEntity) {
        return this.accountService.leaveCompany(account);
    }

    @Get('/me/company')
    @ApiOperation({ title: 'Get Linked Company' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    getLinkedCompany(@Account() account: AccountEntity) {
        return account.company;
    }

    @Get('/me/join-request')
    @ApiOperation({ title: 'Get Joined Request' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.DRIVER)
    getJoinedRequest(@Account() account: AccountEntity) {
        return this.accountService.getActiveJoinedRequest(account);
    }

    @Post('/:dispatcherId/link-driver')
    @ApiOperation({ title: 'Link driver to dispatcher' })
    @ApiResponse({ status: HttpStatus.CREATED })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    linkDriver(@Account() account: AccountEntity, @Param('dispatcherId') dispatcherId: number, @Body('driverId') driverId: number) {
        return this.accountService.linkDriverToDispatcher(account, dispatcherId, driverId, true);
    }

    @Post('/:dispatcherId/unlink-driver')
    @ApiOperation({ title: 'Unlink driver to dispatcher' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    unlinkDriver(@Account() account: AccountEntity, @Param('dispatcherId') dispatcherId: number, @Body('driverId') driverId: number) {
        return this.accountService.linkDriverToDispatcher(account, dispatcherId, driverId, false);
    }

    @Get('/dispatcher/:dispatcherId/drivers')
    @ApiOperation({ title: 'Get dispatcher\'s drivers' })
    @ApiResponse({ status: HttpStatus.OK, type: GetAccountsListResponse })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    getLinkedDrivers(@Param('dispatcherId') dispatcherId: number, @Query() query: GetList) {
        return this.accountService.getDispatcherDrivers(dispatcherId, query);
    }

    @Get('/:id')
    @ApiOperation({ title: 'Get By Id Profile' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN)
    getAccount(@Param('id') id: number) {
        return this.accountService.getAccount(id);
    }

    @Post('/:id/block')
    @ApiOperation({ title: 'Block Account by Super Admin' })
    @ApiResponse({ status: HttpStatus.OK, type: BlockAccountResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    blockAccount(@Param('id') accountId: number, @Body() data: BlockAccountRequest) {
        return this.accountService.blockAccount(accountId, data);
    }
}
