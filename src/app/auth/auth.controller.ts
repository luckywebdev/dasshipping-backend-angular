import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { BadRequestDTO } from '../dto/badRequest.dto';
import { AuthService } from './auth.service';
import { LoginRequest } from './dto/login/request.dto';
import { LoginResponse } from './dto/login/response.dto';
import { RefreshTokenRequest } from './dto/refresh-token/request.dto';
import { RefreshTokenResponse } from './dto/refresh-token/response.dto';

@ApiUseTags('auth')
@Controller('/auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) {
    }

    @Post('/login')
    @ApiOperation({ title: 'Account Login' })
    @ApiResponse({ status: HttpStatus.OK, type: LoginResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    async login(@Body() credentials: LoginRequest) {
        // if (!credentials.mobile && !credentials.noCheckRecapcha) {
        //     return await this.authService.recaptchaValidate(credentials.token)
        //         .then(() => {
        //             return this.authService.login(credentials);
        //         });
        // }

        return this.authService.login(credentials);
    }

    @Post('/refresh-token')
    @ApiOperation({ title: 'Refresh token' })
    @ApiResponse({ status: HttpStatus.OK, type: RefreshTokenResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    refreshToken(@Body() data: RefreshTokenRequest) {
        return this.authService.refresh(data);
    }
}
