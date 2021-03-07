import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';

@Entity({ name: 'policy' })
@Index(['type'], { unique: true })
export class PolicyEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'numeric',
        transformer: dbSelectNumeric,
    })
    price: number;

    @Column('varchar')
    type: string;

    @Column('boolean', { default: true })
    isNew: boolean;
}
