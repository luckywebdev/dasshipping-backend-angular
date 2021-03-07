import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GeneralEntity } from '../../../entities/general.entity';
import { repositoryMockFactory } from '../../../testutils/repository';
import { GeneralPatchDTO } from '../dto/patch/request.dto';
import { GeneralService } from '../general.service';

describe('GeneralService', () => {
    let service: GeneralService;
    let repository;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GeneralService,
                {
                    provide: getRepositoryToken(GeneralEntity), useFactory: repositoryMockFactory,
                },
            ],
        }).compile();

        service = module.get<GeneralService>(GeneralService);
        repository = module.get(getRepositoryToken(GeneralEntity));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return all general settings', async () => {
        const general: Partial<GeneralEntity> = {
            inopAdditionalPricePercentage: 5,
            enclosedAdditionalPricePercentage: 1,
            serviceAbsoluteFee: 10,
            creditCardPaymentFee: 100,
            achPaymentFee: 3,
            minimalSalePrice: 0,
        };
        repository.findOne.mockReturnValue(general);

        const rs = await service.find();

        expect(rs.achPaymentFee).toEqual(3);
        expect(rs.creditCardPaymentFee).toEqual(100);
        expect(rs.serviceAbsoluteFee).toEqual(10);
        expect(rs.inopAdditionalPricePercentage).toEqual(5);
        expect(rs.enclosedAdditionalPricePercentage).toEqual(1);
    });

    it('should return all service fees', async () => {
        const general: Partial<GeneralEntity> = {
            serviceAbsoluteFee: 10,
            creditCardPaymentFee: 100,
            achPaymentFee: 3,
            minimalSalePrice: 0,
        };
        repository.findOne.mockReturnValue(general);

        const rs = await service.findServiceFee();

        expect(rs.achPaymentFee).toEqual(3);
        expect(rs.creditCardPaymentFee).toEqual(100);
        expect(rs.serviceAbsoluteFee).toEqual(10);
        expect(rs).not.toHaveProperty('minimalSalePrice');
    });

    it('should patch general settings', async () => {
        const request: GeneralPatchDTO = {
            inopAdditionalPricePercentage: 5,
            enclosedAdditionalPricePercentage: 1,
            serviceAbsoluteFee: 10,
            creditCardPaymentFee: 100,
            achPaymentFee: 3,
            minimalSalePrice: 0,
        };
        const response: Partial<GeneralEntity> = {
            inopAdditionalPricePercentage: 5,
            enclosedAdditionalPricePercentage: 1,
            serviceAbsoluteFee: 10,
            creditCardPaymentFee: 100,
            achPaymentFee: 3,
            minimalSalePrice: 0,
        };
        repository.findOne.mockReturnValue({ id: 1 });
        repository.save.mockReturnValue(response);

        const rs = await service.patch(request);

        expect(rs.inopAdditionalPricePercentage).toEqual(5);
        expect(rs.enclosedAdditionalPricePercentage).toEqual(1);
        expect(rs.serviceAbsoluteFee).toEqual(10);
        expect(rs.achPaymentFee).toEqual(3);
        expect(rs.creditCardPaymentFee).toEqual(100);
        expect(rs.serviceAbsoluteFee).toEqual(10);
    });
});
