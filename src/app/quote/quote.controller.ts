import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { OrderDTO } from '../../dto/order.dto';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GetList } from '../dto/requestList.dto';
import { GetOrdersListResponse } from '../order/dto/list/response.dto';
import { DiscountRequestDTO } from '../order/dto/patch/discountRequest.dto';
import { ClientScope } from '../shared/scopes/clinet';
import { QuoteCreateRequest } from './dto/requests/create.dto';
import { QuoteService } from './quote.service';

@ApiUseTags('quotes')
@Controller('/quotes')
export class QuoteController {
    constructor(
        private readonly quoteService: QuoteService,
    ) {
    }

    @Post('/')
    @ApiOperation({ title: 'Create Quote' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.CLIENT)
    async createQuote(@Account() account: AccountEntity, @Body() data: QuoteCreateRequest) {
        const quote = await this.quoteService.create(account, data);
        return ClientScope.quote(quote);
    }

    @Get('/')
    @ApiOperation({ title: 'Get Quotes List from the whole system' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    get(@Query() query: GetList, @Account() account: AccountEntity) {
        return this.quoteService.get(query, account.id);
    }

    @Get('/:id')
    @ApiOperation({ title: 'Get quote by id' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    async getById(@Account() account: AccountEntity, @Param('id') id: number) {
        return await this.quoteService.find(account, id);
    }

    @Patch('/:id/discount')
    @ApiOperation({ title: 'Add Quote Discount' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    addOrderDiscount(@Account() account: AccountEntity, @Param('id') id: number, @Body() data: DiscountRequestDTO) {
        return this.quoteService.addQuoteDiscount(account, id, data);
    }
}
