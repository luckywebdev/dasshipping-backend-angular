import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Axios from 'axios';
import { path } from 'ramda';
import { Tesseract } from 'tesseract.ts';
import { IsNull, Not, Transaction, TransactionRepository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { CarDTO } from '../../dto/car.dto';
import { CarEntity } from '../../entities/car.entity';
import { TRAILER_TYPE } from '../../entities/orderBase.entity';
import { FileDTO } from '../../file/dto/upload/file.dto';
import { CarRepository } from '../../repositories/car.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { fileSign } from '../../utils/fileSign.util';
import { CalculatorService } from '../shared/calculator.service';
import { CarEditDTO } from './dto/edit/request.dto';
import { GetCarSpecsAutoCompleteRequest } from './dto/getCarSpecsAutoComplete/request.dto';
import { VinScanResponse } from './dto/vinScan/response.dto';

@Injectable()
export class CarService {
    constructor(
        private calcService: CalculatorService,
        @InjectRepository(QuoteRepository)
        private readonly quoteRepository: QuoteRepository,
        @InjectRepository(CarRepository)
        private readonly carRepository: CarRepository,
        private readonly configService: ConfigService,
    ) {
    }

    private parseCarDetails(carDetails) {
        return {
            make: carDetails.make,
            year: carDetails.year,
            type: carDetails.body_type,
            model: carDetails.model,
            height: parseInt(carDetails.overall_height, 10),
            length: parseInt(carDetails.overall_length, 10),
            width: parseInt(carDetails.overall_width, 10),
        };
    }

    public async findCarByVin(vin: string) {
        try {
            const carDetailsResponse = await Axios.get(
                `http://api.marketcheck.com/v1/vin/${vin}/specs`,
                {
                    headers: {
                        Host: this.configService.vinDecoderHost,
                    },
                    params: {
                        api_key: this.configService.vinDecoderApiKey,
                    },
                },
            );
            const carDetails = carDetailsResponse.data;
            return {
                ...this.parseCarDetails(carDetails),
                vin,
            };
        } catch (e) {
            let outputErr: string = 'Provider error';
            if (e && e.statusText) {
                outputErr += `: ${e.statusText}`;
            } else if (e && e.message) {
                outputErr += `: ${e.message}`;
            }

            throw new ServiceUnavailableException(outputErr);
        }
    }

    public async searchCar(searchParams: GetCarSpecsAutoCompleteRequest) {
        try {
            const carDetailsResponse = await Axios.get(
                `http://api.marketcheck.com/v1/search`,
                {
                    headers: {
                        Host: this.configService.vinDecoderHost,
                    },
                    params: {
                        api_key: this.configService.vinDecoderApiKey,
                        ...searchParams,
                    },
                },
            );
            const list = path(['data', 'listings'], carDetailsResponse);
            return list;
        } catch (e) {
            return null;
        }
    }

    public async getCarSpecsAutoComplete(
        searchParams: GetCarSpecsAutoCompleteRequest,
    ) {
        const carDetailsResponse = await Axios.get(
            `http://api.marketcheck.com/v1/specs/auto-complete`,
            {
                headers: {
                    Host: this.configService.vinDecoderHost,
                },
                params: {
                    api_key: this.configService.vinDecoderApiKey,
                    ...searchParams,
                },
            },
        );
        return carDetailsResponse.data.terms;
    }

    private parseResult(res) {
        let vinNumbers = [];
        const { words, text } = res;
        const regexValidVin = new RegExp('^[A-Z0-9]{17}$');
        if (words && words.length) {
            vinNumbers = words
                .filter(word => regexValidVin.test(word.text))
                .map(item => item.text);
        } else {
            vinNumbers = text
                .replace(/[\r\n]+/g, ' ')
                .split(' ')
                .filter(item => regexValidVin.test(item));
        }
        if (!vinNumbers.length) {
            throw new BadRequestException('Not found vin number');
        }
        const [vin] = vinNumbers;
        return vin;
    }

    public async scanVin(file: FileDTO): Promise<VinScanResponse> {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const url = fileSign(file.key);
        let resp: any;

        try {
            resp = await Tesseract.recognize(url);
        } catch (e) {
            throw new BadRequestException('Not recognized');
        }

        const vin = this.parseResult(resp);
        let carDetails: any;

        try {
            carDetails = await this.findCarByVin(vin);
        } catch (e) {
            throw new BadRequestException('Not valid vin number');
        }
        return {
            ...carDetails,
            urlVin: file.key,
        };
    }

    public async addCarVinByDriver(
        carId: number,
        driverId: number,
        vin: string,
    ): Promise<CarEntity> {
        const car = await this.carRepository.findDriverCar(carId, driverId);
        if (!car) {
            throw new NotFoundException(`Car ${carId} not found`);
        }
        await this.carRepository.update(carId, { vin });
        if (car.imageUrl) {
            car.imageUrl = fileSign(car.imageUrl);
        }

        return { ...car, vin };
    }

    public async addCarPhotoByDriver(
        carId: number,
        driverId: number,
        photoUrl: string,
    ): Promise<CarEntity> {
        const car = await this.carRepository.findDriverCar(carId, driverId);
        if (!car) {
            throw new NotFoundException(`Car ${carId} not found`);
        }
        await this.carRepository.update(carId, { imageUrl: photoUrl });
        car.imageUrl = fileSign(photoUrl);

        return car;
    }

    public async addCarPhotoByClient(
        carId: number,
        clientId: number,
        photoUrl: string,
    ): Promise<CarEntity> {
        const car = await this.carRepository.findClientCar(carId, clientId);
        if (!car) {
            throw new NotFoundException(`Car ${carId} not found`);
        }
        await this.carRepository.update(carId, { imageUrl: photoUrl });
        car.imageUrl = fileSign(photoUrl);

        return car;
    }

    private async updateLead(quoteId: number, quoteRepository: QuoteRepository = this.quoteRepository) {
        const quote = await quoteRepository.getFullByWhere({ id: quoteId });
        const price = await this.calcService.getCarsDeliveryPrice(
            quote.cars,
            quote.distance,
            TRAILER_TYPE.ENCLOSED === quote.trailerType,
        );
        const salePrice = await this.calcService.getSalePrice(price);
        const loadPrice = await this.calcService.getLoadPrice(price);
        await quoteRepository.update(quote.id, {
            initialPrice: price,
            priceWithDiscount: price,
            salePrice,
            loadPrice,
        });
    }

    @Transaction()
    public async editCar(
        carId: number,
        data: CarEditDTO,
        @TransactionRepository(CarRepository) carRepository?: CarRepository,
        @TransactionRepository(QuoteRepository) quoteRepository?: QuoteRepository,
    ): Promise<CarDTO> {
        const car = await this.carRepository.findOne({
            id: carId,
            quoteId: Not(IsNull()),
        });
        if (!car) {
            throw new NotFoundException(`Car ${carId} not found`);
        }
        await carRepository.update(carId, { ...car, ...data });
        await this.updateLead(car.quoteId, quoteRepository);

        return { ...car, ...data };
    }
}
