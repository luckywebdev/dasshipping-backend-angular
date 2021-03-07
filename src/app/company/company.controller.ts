import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectEventEmitter } from 'nest-emitter';
import { IsNull, LessThan, Not } from 'typeorm';

import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { CompanyDTO } from '../../dto/company.dto';
import { GeneralReportDTO } from '../../dto/generalReport.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { OrderDTO } from '../../dto/order.dto';
import { OrderAttachmentDTO } from '../../dto/orderAttachment.dto';
import { OrderNoteDTO } from '../../dto/orderNote.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { TripDTO } from '../../dto/trip.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_SOURCE } from '../../entities/order.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { FileDTO } from '../../file/dto/upload/file.dto';
import { FileUploadResponse } from '../../file/dto/upload/response.dto';
import { Account } from '../account/account.decorator';
import { AccountService } from '../account/account.service';
import { BlockAccountRequest } from '../account/dto/blockAccount/request.dto';
import { GetAccountsListResponse } from '../account/dto/list/response.dto';
import { PatchUserRequest } from '../account/dto/patch/request.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { DriverLocationService } from '../driverLocation/driverLocation.service';
import { GetListLocations } from '../driverLocation/get/request.dto';
import { GetLocationsListResponse } from '../driverLocation/get/response.dto';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { InspectionService } from '../inspection/inspection.service';
import { OrderCreateRequest } from '../order/dto/create/request.dto';
import { EditOrderRequestDTO } from '../order/dto/edit-web-roles/request.dto';
import { GetOrdersRequest } from '../order/dto/list/request.dto';
import { GetOrdersListResponse } from '../order/dto/list/response.dto';
import { SearchOrdersRequestDTO } from '../order/dto/list/search.dto';
import { OrdersCustomReportFields } from '../order/dto/report/fields.dto';
import { OrdersCustomReportFilters } from '../order/dto/report/filters.dto';
import { ImportOrderService } from '../order/import.service';
import { OrderService } from '../order/order.service';
import { GetOrderAttachmentListResponse } from '../orderAttachment/dto/get/response.dto';
import { AddAttachmentToOrderRequest } from '../orderAttachment/dto/post/request.dto';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { GetOrderNotesRequest } from '../orderNote/dto/get/request.dto';
import { GetOrderNotesListResponse } from '../orderNote/dto/get/response.dto';
import { CreateOrderNoteDTO } from '../orderNote/dto/post/request.dto';
import { OrderNoteService } from '../orderNote/orderNote.service';
import { GetOrderTimelineListResponse } from '../orderTimeline/dto/get/response.dto';
import { OrderTimelineService } from '../orderTimeline/orderTimeline.service';
import { CompanyScope } from '../shared/scopes/company';
import { TripAssignOrderRequest } from '../trip/dto/assing-order/request.dto';
import { TripCreateRequest } from '../trip/dto/create/request.dto';
import { TripDeleteOrderRequest } from '../trip/dto/delete-order/request.dto';
import { GetTripsRequest } from '../trip/dto/list/request.dto';
import { GetTripsListResponse } from '../trip/dto/list/response.dto';
import { TripEditRequest } from '../trip/dto/patch/request.dto';
import { CalculateRouteTripRequestDTO } from '../trip/dto/save-route/request.dto';
import { TripService } from '../trip/trip.service';
import { CompanyService } from './company.service';
import { ApproveCompanyRequest } from './dto/approve/request.dto';
import { BlockCompaniesRequest } from './dto/blockCompanies/request.dto';
import { BlockCompanyRequest } from './dto/blockCompany/request.dto';
import { DowloadReportsRequestDTO } from './dto/download-reports.dto';
import { GetCompanyResponse } from './dto/get/response.dto';
import { GetCompanyListRequest } from './dto/list/request.dto';
import { GetCompanyListResponse } from './dto/list/response.dto';
import { PatchCompanyRequest } from './dto/patch/request.dto';
import { ReportsByShipperRequestDTO } from './dto/reports-by-shipper/request.dto';
import { GetReportsByShipperResponse } from './dto/reports-by-shipper/response.dto';
import { ReportsByUserRequestDTO } from './dto/reports-by-user/request.dto';
import { GetReportsByUserResponse } from './dto/reports-by-user/response.dto';
import { ChengesCompanyRequest } from './dto/requested-changes/request.dto';
import { SendInvoiceRequestDTO } from './dto/sendInvoiceRequest.dto';

@ApiUseTags('company')
@Controller('/company')
export class CompanyController {
    constructor(
        private readonly companyService: CompanyService,
        private readonly orderService: OrderService,
        private readonly tripService: TripService,
        private readonly inspectionService: InspectionService,
        private readonly accountService: AccountService,
        private readonly driverLocationService: DriverLocationService,
        private readonly orderNoteService: OrderNoteService,
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
        private readonly orderAttachmentService: OrderAttachmentService,
        private readonly orderTimelineService: OrderTimelineService,
        private readonly importOrderService: ImportOrderService,
    ) {
    }

    @Post('/block')
    @ApiOperation({ title: 'Block Companies' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    block(@Body() data: BlockCompaniesRequest) {
        return this.companyService.blockCompanies(data);
    }

    @Post('/approve')
    @ApiOperation({ title: 'Block Company' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    approve(@Body() data: ApproveCompanyRequest) {
        return this.companyService.approve(data);
    }

    @Post('/requested-changes')
    @ApiOperation({ title: 'Block Company' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    requestedChanges(@Body() data: ChengesCompanyRequest) {
        return this.companyService.requestedChanges(data);
    }

    @Get('/me')
    @ApiOperation({ title: 'Get My Company' })
    @ApiResponse({
        status: HttpStatus.OK,
        isArray: true,
        type: GetCompanyResponse,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getMy(@Account() account: AccountEntity) {
        return this.companyService.getCompany(account.companyId);
    }

    @Get('/:id')
    @ApiOperation({ title: 'Get Company By Id' })
    @ApiResponse({
        status: HttpStatus.OK,
        isArray: true,
        type: GetCompanyResponse,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    getById(@Param('id') id: number) {
        return this.companyService.getCompany(id);
    }

    @Get('/')
    @ApiOperation({ title: 'Get Companies List' })
    @ApiResponse({ status: HttpStatus.OK, type: GetCompanyListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    getList(@Query() query: GetCompanyListRequest, @Account() account: AccountEntity) {
        return this.companyService.getList(query, account.id);
    }

    @Patch('/me')
    @ApiOperation({ title: 'Patch My Company' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CompanyDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    patchMe(
        @Body() data: PatchCompanyRequest,
        @Account() account: AccountEntity,
    ) {
        return this.companyService.patch(data, account.companyId);
    }

    @Patch('/:id')
    @ApiOperation({ title: 'Patch Company' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CompanyDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    patch(@Body() data: PatchCompanyRequest, @Param('id') id: number) {
        return this.companyService.patch(data, id);
    }

    @Post('/block/:id')
    @ApiOperation({ title: 'Block Company' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    blockCompany(@Param('id') id: number, @Body() data: BlockCompanyRequest) {
        return this.companyService.blockCompany(id, data);
    }

    @Get('/me/orders')
    @ApiOperation({ title: 'Get all your orders' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrders(
        @Account() account: AccountEntity,
        @Query() query: SearchOrdersRequestDTO,
    ) {
        const { data, count } = await this.orderService.getCompanyOrders(
            account,
            query,
        );
        return { data: CompanyScope.orders(data), count };
    }

    @Get('/me/load-board/new-loads')
    @ApiOperation({ title: 'Get all your orders not assigned' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrdersNewLoads(
        @Account() account: AccountEntity,
        @Query() query: SearchOrdersRequestDTO,
    ) {
        const { data, count } = await this.orderService.getCompanyOrdersNewLoads(
            account,
            query,
        );

        const ordersList = query.grouped
            ? data.map(orders => CompanyScope.orders(orders))
            : CompanyScope.orders(data);

        return { data: ordersList, count };
    }

    @Get('/me/load-board/past-due')
    @ApiOperation({ title: 'Get all your orders past due' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrdersPastDue(
        @Account() account: AccountEntity,
        @Query() query: SearchOrdersRequestDTO,
    ) {
        const { data, count } = await this.orderService.getCompanyAssignedOrders(account.id,
            {
                ...query,
                where: {
                    companyId: account.companyId,
                    invoiceUrl: Not(IsNull()),
                    invoiceDueDate: LessThan('NOW()'),
                    status: Not(ORDER_STATUS.PAID),
                },
            });
        return { data: CompanyScope.orders(data), count };
    }

    @Get('/me/load-board/:condition')
    @ApiOperation({ title: 'Get all your orders' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrdersAssigned(
        @Account() account: AccountEntity,
        @Query() query: SearchOrdersRequestDTO,
        @Param('condition') condition: string,
    ) {
        const { data, count } = await this.orderService.getCompanyOrdersAssigned(
            account.id,
            { ...query, where: { companyId: account.companyId } },
            condition,
        );
        return { data: CompanyScope.orders(data), count };
    }

    @Get('/me/orders/available')
    @ApiOperation({ title: 'Get all your orders available' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    async getAvailable(
        @Account() account: AccountEntity,
        @Query() query: GetOrdersRequest,
    ) {
        query.where = {
            companyId: IsNull(),
        };
        const { data, count } = await this.orderService.getAvailableOrdersForBoard(
            account,
            query,
        );

        const ordersList = query.grouped
            ? data.map(orders => CompanyScope.orders(orders))
            : CompanyScope.orders(data);

        return { data: ordersList, count };
    }

    @Get('/me/orders/requested')
    @ApiOperation({ title: 'Get all your orders requested to dispatch' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    async getRequested(
        @Account() account: AccountEntity,
        @Query() query: GetOrdersRequest,
    ) {
        query.where = {
            companyId: IsNull(),
        };
        const { data, count } = await this.orderService.getRequestedOrdersForBoard(
            account,
            query,
        );
        return { data: CompanyScope.orders(data), count };
    }

    @Get('/me/orders/bids')
    @ApiOperation({ title: 'Get all your orders bids' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
    async getBids(
        @Account() account: AccountEntity,
        @Query() query: GetOrdersRequest,
    ) {
        return { data: [], count: 0 };
    }

    @Get('/me/orders/:id')
    @ApiOperation({ title: 'Get Order Details' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrder(
        @Account() account: AccountEntity,
        @Param('id') id: number,
        @Query('include') include: string,
    ) {
        const query = { where: { companyId: account.companyId, published: true, hiddenForCompnay: false } };
        const order = await this.orderService.getOrder(id, include, query);
        return CompanyScope.order(order);
    }

    @Patch('/me/orders/:id')
    @ApiOperation({ title: 'Edit Order' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async patchCompanyOrder(
        @Account() account: AccountEntity,
        @Param('id') id: number,
        @Body() data: EditOrderRequestDTO,
    ) {
        const query = { where: { companyId: account.companyId, source: Not(ORDER_SOURCE.INTERNAL) } };
        const resp = await this.orderService.patch(account, id, data, query);
        this.emitter.emit('order_timeline', {
            orderId: id,
            actionAccountId: account.id,
            description: `Order edit by ${account.firstName} ${account.lastName}`,
        });
        return resp;
    }

    @Get('/me/trips')
    @ApiOperation({ title: 'Get all trips for your company' })
    @ApiResponse({ status: HttpStatus.OK, type: GetTripsListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyTrips(
        @Account() account: AccountEntity,
        @Query() query: GetTripsRequest,
    ) {
        query = { ...query, where: { companyId: account.companyId } };
        return await this.tripService.getList(query);
    }

    @Get('/me/trips/:tripId/orders')
    @ApiOperation({ title: 'Get all orders assign to trip' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getCompanyOrdersTrip(
        @Account() account: AccountEntity,
        @Query() query: GetList,
        @Param('tripId') tripId: number,
    ) {
        query = { ...query, where: { tripId } };
        const { data, count } = await this.orderService.getOrders(account, query);
        return { data: CompanyScope.orders(data), count };
    }

    @Post('/me/trips')
    @ApiOperation({ title: 'Create Trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async createTrip(
        @Account() account: AccountEntity,
        @Body() data: TripCreateRequest,
    ) {
        data = { ...data, companyId: account.companyId, createdById: account.id };
        return await this.tripService.create(data);
    }

    @Patch('/me/trips/:id')
    @ApiOperation({ title: 'Edit Trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async patchTrip(
        @Account() account: AccountEntity,
        @Body() data: TripEditRequest,
        @Param('id') id: number,
    ) {
        const where = { companyId: account.companyId, id };
        return await this.tripService.patch(data, where);
    }

    @Patch('/me/trips/:id/route')
    @ApiOperation({ title: 'Edit Trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async patchTripRoute(
        @Account() account: AccountEntity,
        @Body() body: CalculateRouteTripRequestDTO,
        @Param('id') id: number,
    ) {
        const where = { companyId: account.companyId, id };
        return await this.tripService.calculateRoute(body, where);
    }

    @Get('/me/trips/:id')
    @ApiOperation({ title: 'Edit Trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getTrip(@Account() account: AccountEntity, @Param('id') id: number) {
        const where = { companyId: account.companyId, id };
        return await this.tripService.get(where);
    }

    @Delete('/me/trips')
    @ApiOperation({ title: 'Delete Trips' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async deleteTrip(
        @Account() account: AccountEntity,
        @Body('ids') ids: number[],
    ) {
        const where = { companyId: account.companyId };
        return await this.tripService.delete(where, ids);
    }

    @Patch('/me/trips/:tripId/assign-order')
    @ApiOperation({ title: 'Assign order to trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async assignOrderToTrip(
        @Account() account: AccountEntity,
        @Param('tripId') tripId: number,
        @Body() data: TripAssignOrderRequest,
    ) {
        const { orderId } = data;
        const resp = await this.orderService.assignOrder(orderId, {
            id: tripId,
            companyId: account.companyId,
        });
        this.emitter.emit('order_timeline', {
            orderId,
            actionAccountId: account.id,
            description: `Order added to Trip #${tripId} by ${account.firstName} ${account.lastName}`,
        });
        return resp;
    }

    @Delete('/me/trips/:tripId/orders')
    @ApiOperation({ title: 'Delete order from trip' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async deleteFromTrip(
        @Account() account: AccountEntity,
        @Param('tripId') tripId: number,
        @Body() data: TripDeleteOrderRequest,
    ) {
        const { orderIds } = data;
        return await this.orderService.deleteFromTrip(orderIds, {
            id: tripId,
            companyId: account.companyId,
        });
    }

    @Patch('/me/trips/:id/:action')
    @ApiOperation({ title: 'Change trip state' })
    @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async changeState(
        @Account() account: AccountEntity,
        @Param('id') id: number,
        @Param('action') action: string,
        @Body('driverId') driverId?: number,
    ) {
        const where = { companyId: account.companyId, id };
        return await this.tripService.doAction(action, where, driverId);
    }

    @Delete('/:id')
    @ApiOperation({ title: 'Delete Order' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    delete(@Account() account: AccountEntity, @Param('id') id: number) {
        const query = { where: { companyId: account.companyId, source: Not(ORDER_SOURCE.INTERNAL) } };
        return this.orderService.delete(account, id, query);
    }

    @Get('/me/cars/:carId/:inspectionType(delivery|pickup)-inspection')
    @ApiOperation({ title: 'Get car inspection for company' })
    @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getCarInspection(
        @Account() account: AccountEntity,
        @Param('carId') carId: number,
        @Param('inspectionType') inspectionType: number,
    ) {
        return this.inspectionService.getCarInspectionBasedOnOrder(carId, {
            where: {
                companyId: account.companyId,
                type: inspectionType,
            },
        });
    }

    @Get('/me/orders/:orderId/:inspectionType(delivery|pickup)-inspections')
    @ApiOperation({ title: 'Get order inspections for company' })
    @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.SUPER_ADMIN)
    getOrderInspections(
        @Account() account: AccountEntity,
        @Query() query: GetList,
        @Query('status') statusName: string,
        @Param('orderId') orderId: number,
        @Param('inspectionType') inspectionType: string,
    ) {
        query = {
            ...query,
            where: { companyId: account.companyId, type: inspectionType },
        };
        if (statusName) {
            query.where.status = statusName;
        }
        return this.inspectionService.getInspectionsBasedOnOrder(orderId, query);
    }

    @Get('/me/accounts/:id')
    @ApiOperation({ title: 'Get account for company' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getCompanyAccount(
        @Account() account: AccountEntity,
        @Param('id') accountId: number,
    ) {
        return this.accountService.getAccount(accountId, {
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/dispatchers/:dispatcherId/link-driver')
    @ApiOperation({ title: 'Link driver to dispatcher' })
    @ApiResponse({ status: HttpStatus.CREATED })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    linkDriver(
        @Account() account: AccountEntity,
        @Param('dispatcherId') dispatcherId: number,
        @Body('driverId') driverId: number,
    ) {
        return this.accountService.linkDriverToDispatcher(
            account,
            dispatcherId,
            driverId,
            true,
            {
                where: {
                    companyId: account.companyId,
                },
            },
        );
    }

    @Post('/me/dispatchers/:dispatcherId/unlink-driver')
    @ApiOperation({ title: 'Unlink driver from dispatcher' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    unlinkDriver(
        @Account() account: AccountEntity,
        @Param('dispatcherId') dispatcherId: number,
        @Body('driverId') driverId: number,
    ) {
        return this.accountService.linkDriverToDispatcher(
            account,
            dispatcherId,
            driverId,
            false,
            {
                where: {
                    companyId: account.companyId,
                },
            },
        );
    }

    @Post('/me/accounts/:id/block')
    @ApiOperation({ title: 'Block Account by Company Admin' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    blockAccount(
        @Account() account: AccountEntity,
        @Param('id') accountId: number,
        @Body() data: BlockAccountRequest,
    ) {
        return this.accountService.blockAccount(accountId, data, {
            where: { companyId: account.companyId },
        });
    }

    @Delete('/me/orders/:orderId')
    @ApiOperation({ title: 'Delete order for carrier' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async deleteOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        const query = { where: { companyId: account.companyId, status: ORDER_STATUS.CANCELED } };
        const resp = await this.orderService.deleteOrder(orderId, query);
        return resp;
    }

    @Post('/me/orders/:orderId/cancel')
    @ApiOperation({ title: 'Cancel order for carrier' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async cancelOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        const query = { where: { companyId: account.companyId } };
        const resp = await this.orderService.cancelOrder(account, orderId, query);
        return resp;
    }

    @Get('/dispatcher/:dispatcherId/drivers')
    @ApiOperation({ title: `Get dispatcher's drivers` })
    @ApiResponse({ status: HttpStatus.OK, type: GetAccountsListResponse })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getLinkedDrivers(
        @Account() account: AccountEntity,
        @Param('dispatcherId') dispatcherId: number,
        @Query() query: GetList,
    ) {
        query = { ...query, where: { companyId: account.companyId } };
        return this.accountService.getDispatcherDrivers(dispatcherId, query);
    }

    @Patch('me/accounts/:id')
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    @ApiOperation({ title: 'Edit Account Profile' })
    @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    patchAccount(
        @Account() account: AccountEntity,
        @Param('id') id: number,
        @Body() data: PatchUserRequest,
    ) {
        return this.accountService.patch(data, id, {
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/driver/:id/kick-out')
    @ApiOperation({ title: 'Kick out Driver' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    leaveCompany(@Account() account: AccountEntity, @Param('id') id: number) {
        return this.accountService.kickOut(account.companyId, id);
    }

    @Get('/me/drivers/:id/locations')
    @ApiOperation({ title: 'Get locations for a driver' })
    @ApiResponse({ status: HttpStatus.OK, type: GetLocationsListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getLocationsDriver(
        @Account() account: AccountEntity,
        @Query() query: GetListLocations,
        @Param('id') id: number,
    ) {
        return this.driverLocationService.getList(query, id, {
            companyId: account.companyId,
        });
    }

    @Post('/me/load-board/:orderId/cancel')
    @ApiOperation({ title: 'Cancel order for carrier' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async cancelLoadBoard(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        const resp = await this.orderService.cancelRequestDispatch(
            orderId,
            account.companyId,
        );
        this.emitter.emit('order_timeline', {
            orderId,
            actionAccountId: account.id,
            description: `Order request to dispatch canceled by ${account.company.name}`,
        });
        return resp;
    }

    @Get('/me/drivers-location')
    @ApiOperation({ title: 'Get last location for a drivers' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: AccountDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getLastLocationDrivers(@Account() account: AccountEntity) {
        return this.accountService.getDriversLastLocation({
            companyId: account.companyId,
            roleId: ROLES.DRIVER,
        });
    }

    @Get('/me/orders/:orderId/notes')
    @ApiOperation({ title: 'Get company order notes' })
    @ApiResponse({
        status: HttpStatus.OK,
        isArray: true,
        type: GetOrderNotesListResponse,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getOrderNotes(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Query() query: GetOrderNotesRequest,
    ) {
        query = { ...query, where: { companyId: account.companyId } };
        return this.orderNoteService.getOrderNotes(orderId, query);
    }

    @Post('/me/orders/:orderId/notes')
    @ApiOperation({ title: 'Create order note' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: OrderNoteDTO,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async createOrderNote(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Body() data: CreateOrderNoteDTO,
    ) {
        data = { orderId, accountId: account.id, ...data };
        const query = {
            id: orderId,
            companyId: account.companyId,
        };
        return this.orderNoteService.post(data, query);
    }

    @Post('/me/orders/:orderId/attachments')
    @ApiOperation({ title: 'Add attachment to order' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: OrderAttachmentDTO,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async addAttachmentOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Body() data: AddAttachmentToOrderRequest,
    ) {
        data = { orderId, ...data };
        const query = {
            id: orderId,
            companyId: account.companyId,
        };
        return this.orderAttachmentService.post({ ...data, createdById: account.id }, query);
    }

    @Delete('/me/orders/:orderId/attachments/:id')
    @ApiOperation({ title: 'Remove attachment to order' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: SuccessDTO,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async removeAttachmentOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Param('id') id: number,
    ) {
        return this.orderAttachmentService.delete(
            { id: orderId, companyId: account.companyId },
            { orderId, id },
        );
    }

    @Get('/me/orders/:orderId/attachments')
    @ApiOperation({ title: 'Get list attachments order' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: GetOrderAttachmentListResponse,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getAttachmentsOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Body() query: GetList,
    ) {
        return this.orderAttachmentService.get(orderId, {
            ...query,
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/orders/:orderId/timeline')
    @ApiOperation({ title: 'Get list timeline order' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: GetOrderTimelineListResponse,
    })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async getTimelineOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Body() query: GetList,
    ) {
        return this.orderTimelineService.get(orderId, {
            ...query,
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/orders/:orderId/send-bol')
    @ApiOperation({ title: 'Send Order BOL' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    sendBOL(
        @Account() account: AccountEntity,
        @Body('email') email: string,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.sendBOL(orderId, email, {
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/orders/:orderId/bol')
    @ApiOperation({ title: 'Get Order BOL' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getBOL(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.getBOLLink(orderId, {
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/orders/:orderId/invoice')
    @ApiOperation({ title: 'Get Order BOL' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getInvoice(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.getInvoiceLink(orderId, {
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/orders/:orderId/receipt')
    @ApiOperation({ title: 'Get Order Receipt' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getReceipt(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.getReceiptLink(orderId, {
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/orders/:orderId/send-receipt')
    @ApiOperation({ title: 'Send Order Receipt' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    sendReceipt(
        @Account() account: AccountEntity,
        @Body('email') email: string,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.sendReceipt(orderId, email, {
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/orders/:orderId/mark-paid')
    @ApiOperation({ title: 'Mark Order as paid' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async markPaid(
        @Account() account: AccountEntity,
        @Body('paymentMethod') paymentMethod: string,
        @Param('orderId') orderId: number,
    ) {
        const resp = await this.orderService.markPaid(orderId, paymentMethod, {
            where: {
                companyId: account.companyId,
                status: ORDER_STATUS.BILLED,
            },
        });
        this.emitter.emit('order_timeline', {
            orderId,
            actionAccountId: account.id,
            description: `Order marked as paid by ${account.firstName} ${account.lastName}`,
        });
        return resp;
    }

    @Post('/me/trips/:id/import')
    @UseInterceptors(FileInterceptor('order'))
    @ApiOperation({ title: 'Import single order' })
    @ApiResponse({ status: HttpStatus.OK, type: FileUploadResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async uploadOrderPdfTrip(
        @Account() account: AccountEntity,
        @Param('id') id: number,
        @UploadedFile() file: FileDTO,
    ) {
        const trip = await this.tripService.getTrip({
            id,
            companyId: account.companyId,
        });
        if (!trip) {
            throw new BadRequestException(`Trip not found for id ${id}`);
        }

        const orderParser = await this.importOrderService.import(file);

        return this.orderService.saveImportedOrder(
            account,
            file,
            orderParser,
            trip.id,
        );
    }

    @Post('/me/orders/:orderId/send-invoice')
    @ApiOperation({ title: 'Send Order Invoice' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    sendInvoice(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
        @Body() data: SendInvoiceRequestDTO,
    ) {
        return this.orderService.sendInvoice(orderId, data, {
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/orders/:orderId/archive')
    @ApiOperation({ title: 'Archive Order' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    archiveOrder(
        @Account() account: AccountEntity,
        @Param('orderId') orderId: number,
    ) {
        return this.orderService.archiveOrder(account, orderId, {
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/reports/general')
    @ApiOperation({ title: 'Get Company revenue general data' })
    @ApiResponse({ status: HttpStatus.OK, type: GeneralReportDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getGeneralReport(@Account() account: AccountEntity) {
        return this.orderService.getGeneralReport({ companyId: account.companyId });
    }

    @Post('me/reports/send-custom-report')
    @ApiOperation({ title: 'Send Custom Report' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    sendCustomReport(
        @Body() fieldsToExport: OrdersCustomReportFields,
        @Query() query: OrdersCustomReportFilters,
    ) {
        return this.orderService.sendCustomReport(fieldsToExport, query);
    }

    @Get('/me/reports/shipper')
    @ApiOperation({ title: 'Get Company revenue by shipper' })
    @ApiResponse({ status: HttpStatus.OK, type: GetReportsByShipperResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getByShipperReport(
        @Account() account: AccountEntity,
        @Query() query: ReportsByShipperRequestDTO,
    ) {
        return this.orderService.getByShipperReport({
            ...query,
            where: { companyId: account.companyId },
        });
    }

    @Get('/me/reports/user')
    @ApiOperation({ title: 'Get Company reports by user' })
    @ApiResponse({ status: HttpStatus.OK, type: GetReportsByUserResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    getByUserReport(
        @Account() account: AccountEntity,
        @Query() query: ReportsByUserRequestDTO,
    ) {
        return this.accountService.getByUserReport({
            ...query,
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/reports/user')
    @ApiOperation({ title: 'Download reports by user' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    dowloadReportsByUser(
        @Account() account: AccountEntity,
        @Body() body: DowloadReportsRequestDTO,
    ) {
        const { filter, email } = body;
        return this.accountService.dowloadReportsByUser(email, {
            ...filter,
            where: { companyId: account.companyId },
        });
    }

    @Post('/me/orders/import')
    @UseInterceptors(FileInterceptor('order'))
    @ApiOperation({ title: 'Import single order' })
    @ApiResponse({ status: HttpStatus.OK, type: FileUploadResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    async uploadOrderPdf(
        @Account() account: AccountEntity,
        @UploadedFile() file: FileDTO,
    ) {
        const orderParser = await this.importOrderService.import(file);

        return await this.orderService.saveImportedOrder(
            account,
            file,
            orderParser,
            null,
        );
    }

    @Post('/me/orders')
    @ApiOperation({ title: 'Create Order' })
    @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN)
    post(@Account() account: AccountEntity, @Body() data: OrderCreateRequest) {
        return this.orderService.createOrder(account, data);
    }
}
