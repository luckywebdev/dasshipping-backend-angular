import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';

@Entity({ name: 'tempPrice' })
export class TempPriceEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'numeric', transformer: dbSelectNumeric })
    price: number;

    @Column('varchar')
    hash: string;

    @Column('timestamp with time zone')
    createdAt: Date;
}
