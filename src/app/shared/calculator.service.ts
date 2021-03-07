import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment = require('moment');
import { path } from 'ramda';
import { Repository } from 'typeorm';

import { CarDTO } from '../../dto/car.dto';
import { GeneralDTO } from '../../dto/general.dto';
import { GeneralEntity } from '../../entities/general.entity';
import { PolicyEntity } from '../../entities/policy.entity';
import { meterToMile } from '../../utils/meterToMile.util';
import { HereService } from '../here/here.service';

@Injectable()
export class CalculatorService {

    private settings: GeneralDTO;
    private nextUpdate: moment.Moment;

    constructor(
        @InjectRepository(PolicyEntity) private readonly policyRepository: Repository<PolicyEntity>,
        @InjectRepository(GeneralEntity) private readonly generalRepository: Repository<GeneralEntity>,
        private hereService: HereService,
    ) {
        this.updateSettings();
    }

    private updateSettings(): void {
        this.generalRepository.findOne()
            .then(settings => {
                this.settings = settings;
                this.nextUpdate = moment().add(5, 'minutes');
            });
    }

    private async getSettings(): Promise<GeneralDTO> {
        // setTimeout(() => {
        //     if (this.nextUpdate.diff(moment()) < 0) {
        //             this.updateSettings();
        // }
        // });
        const general = await this.generalRepository.findOne();
        return general || {
            minimumProfitPercentage: 0,
            recommendedProfitPercentage: 0,
            inopAdditionalPricePercentage: 0,
            enclosedAdditionalPricePercentage: 0,
            serviceAbsoluteFee: 100,
            minimalSalePrice: 100,
            creditCardPaymentFee: 4,
            achPaymentFee: 4,
            liftedPercentage: 0,
            headRackPercentage: 0,
            utilityBedPercentage: 0,
            handicapPercentage: 0,
        };
    }

    public async getDistance(from: string, to: string): Promise<number> {
        const [fromLocation, toLocation] = await Promise.all([
            this.hereService.geocode({ searchtext: from }),
            this.hereService.geocode({ searchtext: to }),
        ]);

        const route = await this.hereService.calculateroute({
            mode: 'fastest;truck;traffic:disabled',
            height: 1,
            routeattributes: 'sh,bb,gr',
            waypoint0: `geo!${path([0, 'lat'], fromLocation)},${path([0, 'lon'], fromLocation)}`,
            waypoint1: `geo!${path([0, 'lat'], toLocation)},${path([0, 'lon'], toLocation)}`,
        });
        return meterToMile(route[0].summary.distance);
    }

    public async getPointsDistance(from: { lat: number, lon: number }, to: { lat: number, lon: number }): Promise<number> {
        const route = await this.hereService.calculateroute({
            mode: 'fastest;truck;traffic:disabled',
            height: 1,
            routeattributes: 'sh,bb,gr',
            waypoint0: `geo!${from.lat},${from.lon}`,
            waypoint1: `geo!${to.lat},${to.lon}`,
        });
        return meterToMile(route[0].summary.distance);
    }

    public async getCarsDeliveryPrice(cars: CarDTO[], distance: number, enclosed: boolean): Promise<number> {
        const pricePerVehicleType = await this.getPriceByVehicleType(distance, cars);

        const generalSettings = await this.getSettings();

        const prices = pricePerVehicleType.map(car => {
            const priceForCar = distance * car.pricePerMile;
            let percentagePrice = 0;
            if (enclosed) {
                percentagePrice += priceForCar * generalSettings.enclosedAdditionalPricePercentage / 100;
            }
            if (car.lifted) {
                percentagePrice += priceForCar * generalSettings.liftedPercentage / 100;
            }
            if (car.inop) {
                percentagePrice += priceForCar * generalSettings.inopAdditionalPricePercentage / 100;
            }
            if (car.headRack) {
                percentagePrice += priceForCar * generalSettings.headRackPercentage / 100;
            }
            if (car.utilityBed) {
                percentagePrice += priceForCar * generalSettings.utilityBedPercentage / 100;
            }
            if (car.handicap) {
                percentagePrice += priceForCar * generalSettings.handicapPercentage / 100;
            }

            return priceForCar + percentagePrice;
        });

        const price = prices.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        const minimalPrice = generalSettings.minimalSalePrice + generalSettings.serviceAbsoluteFee;

        return price < minimalPrice ? minimalPrice : price;
    }

    public async getPriceByVehicleType(distance: number, cars: CarDTO[]): Promise<CarDTO[]> {
        const carTypePolicies = await this.policyRepository.find();
        return cars.map(car => {
            if (!car.type) {
                throw new BadRequestException('All vehicles should provide a type');
            }
            if (!carTypePolicies || carTypePolicies.length === 0) {
                throw new BadRequestException(`Unrecognised vehicle type ${car.type}`);
            }
            const carTypePolicy = carTypePolicies.find(policy => policy.type === car.type);
            if (!carTypePolicy) {
                throw new BadRequestException(`Unrecognised vehicle type ${car.type}`);
            }
            car.pricePerMile = distance < 900 ? carTypePolicy.price : carTypePolicy.price - Math.min(1000, distance - 900) * 0.00017;

            return car;
        });
    }

    public async getSalePrice(initialPrice: number): Promise<number> {
        const generalSettings = await this.getSettings();
        const { recommendedProfitPercentage, serviceAbsoluteFee } = generalSettings;
        const profitWithServiceFee = initialPrice * recommendedProfitPercentage / 100;

        return initialPrice - profitWithServiceFee - serviceAbsoluteFee;
    }

    public async getDiscountPrice(initialPrice: number, discount: number = 0): Promise<number> {
        const generalSettings = await this.getSettings();
        const { recommendedProfitPercentage, minimumProfitPercentage } = generalSettings;
        if (recommendedProfitPercentage - discount < minimumProfitPercentage) {
            // tslint:disable-next-line:max-line-length
            throw new BadRequestException(`Discount is too big, it should be less than ${(recommendedProfitPercentage - minimumProfitPercentage).toFixed(2)}%`);
        }

        return initialPrice - initialPrice * discount / 100;
    }

    public async getLoadPrice(initialPrice: number, discount = 0): Promise<number> {
        const generalSettings = await this.getSettings();
        const { serviceAbsoluteFee } = generalSettings;

        return initialPrice - serviceAbsoluteFee - initialPrice * discount / 100;
    }
}
