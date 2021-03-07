import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guart';
import { Roles } from '../auth/guards/roles.decorator';
import { ROLES } from '../../constants/roles.constant';
import { Account } from '../account/account.decorator';
import { AccountEntity } from '../../entities/account.entity';
import { CreateInspectionDTO } from './dto/create/createInspection.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { InspectionService } from './inspection.service';
import { EditInspectionDTO } from './dto/edit/patchInspection.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { GetList } from '../dto/requestList.dto';

@ApiUseTags('inspection')
@Controller('/inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post('/')
  @ApiOperation({ title: 'Create inspection' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  create(@Account() account: AccountEntity, @Body() data: CreateInspectionDTO) {
    return this.inspectionService.create(account, data);
  }

  @Patch('/:id')
  @ApiOperation({ title: 'Edit inspection' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  edit(
    @Account() account: AccountEntity,
    @Body() data: EditInspectionDTO,
    @Param('id') id: number,
  ) {
    return this.inspectionService.edit(account, id, data);
  }

  @Get('/cars/:carId')
  @ApiOperation({ title: 'Get car inspection' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getCarInspection(@Param('carId') carId: number) {
    return this.inspectionService.getCarInspection(carId);
  }

  @Get('/orders/:orderId')
  @ApiOperation({ title: 'Get order inspections' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrderInspections(
    @Query() query: GetList,
    @Query('status') statusName: string,
    @Param('orderId') orderId: number,
  ) {
    if (statusName) {
      query.where = {
        status: statusName,
      };
    }
    return this.inspectionService.getOrderInspections(orderId, query);
  }
}
