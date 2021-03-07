import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';

@Entity({ name: 'general' })
export class GeneralEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    minimumProfitPercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    recommendedProfitPercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    inopAdditionalPricePercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    enclosedAdditionalPricePercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
        default: 100,
    })
    serviceAbsoluteFee: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
        default: 100,
    })
    minimalSalePrice: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
        default: 4,
    })
    creditCardPaymentFee: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
        default: 4,
    })
    achPaymentFee: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    liftedPercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    headRackPercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    utilityBedPercentage: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    handicapPercentage: number;
}
