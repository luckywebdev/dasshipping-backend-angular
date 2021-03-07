import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { CarDTO } from '../../dto/car.dto';
import { AccountEntity } from '../../entities/account.entity';
import { FileDTO } from '../../file/dto/upload/file.dto';
import { Account } from '../account/account.decorator';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { CarService } from './car.service';
import { GetCarSpecsAutoCompleteRequest } from './dto/getCarSpecsAutoComplete/request.dto';
import { VinScanResponse } from './dto/vinScan/response.dto';
import { CarEditDTO } from './dto/edit/request.dto';
import { RolesGuard } from '../auth/guards/roles.guart';
import { Roles } from '../auth/guards/roles.decorator';
import { ROLES } from '../../constants/roles.constant';

@ApiUseTags('car')
@Controller('/car')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Get('/vin/:vin')
  @ApiOperation({ title: 'Find car by vin' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard())
  getAccount(@Account() account: AccountEntity, @Param('vin') vin: string) {
    return this.carService.findCarByVin(vin);
  }

  @Post('/vin/scan')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ title: 'Scan vin number' })
  @ApiResponse({ status: HttpStatus.OK, type: VinScanResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard())
  uploadFile(@UploadedFile() file: FileDTO) {
    return this.carService.scanVin(file);
  }

  @Get('/autocomplete')
  @ApiOperation({ title: 'Car Specs Autocompete' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard())
  getCarSpecsAutoComplete(
    @Query() searchParams: GetCarSpecsAutoCompleteRequest,
  ) {
    return this.carService.getCarSpecsAutoComplete(searchParams);
  }

  @Patch('/:id')
  @ApiOperation({ title: 'Edit car' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  editCar(@Param('id') id: number, @Body() data: CarEditDTO) {
    return this.carService.editCar(id, data);
  }
}
