import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { LocationDTO } from '../../dto/location.dto';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { AddressRequestDTO } from './dto/address/addressRequest.dto';
import { AddressValidationResponsetDTO } from './dto/address/addressValidationResponse.dto';
import { CalculateTripRequestDTO } from './dto/calculateTrip/request.dto';
import { DistanceResponseDTO } from './dto/calculateTrip/response.dto';
import { GeocodeRequest } from './dto/geocode/request.dto';
import { ReverseGeocodeRequest } from './dto/reversegeocode/request.dto';
import { HereService } from './here.service';

@ApiUseTags('here')
@Controller('/here')
export class HereController {
    constructor(
        private readonly hereService: HereService,
    ) { }

    @Get('/calculateroute')
    @ApiOperation({ title: 'Calculate Route' })
    @UseGuards(AuthGuard(), RolesGuard)
    calculateroute(@Query() query) {
        return this.hereService.calculateroute(query);
    }

    @Get('/geocode')
    @ApiOperation({ title: 'Geocode' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: LocationDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    geocode(@Query() query: GeocodeRequest) {
        return this.hereService.geocode(query);
    }

    @Get('/reversegeocode')
    @ApiOperation({ title: 'Reverse Geocode' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: LocationDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    reversegeocode(@Query() query: ReverseGeocodeRequest) {
        return this.hereService.reverseGeocode(query);
    }

    @Post('/validate-address')
    @ApiOperation({ title: 'Validate Address' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: AddressValidationResponsetDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    validateAddress(@Body() address: AddressRequestDTO) {
        return this.hereService.validateAddress(address);
    }

    @Post('/calculate-trip')
    @ApiOperation({ title: 'Calculate optimal distance' })
    @ApiResponse({ status: HttpStatus.OK, type: DistanceResponseDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    calculateTrip(@Body() body: CalculateTripRequestDTO) {
        return this.hereService.calculateTrip(body);
    }
}
