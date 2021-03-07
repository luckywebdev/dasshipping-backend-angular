import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';

@Entity({ name: 'driverLocation' })
export class DriverLocationEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('numeric')
    lat: number;

    @Column('numeric')
    lon: number;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @ManyToOne(type => AccountEntity)
    driver: AccountEntity;

    @Column('numeric')
    driverId: number;
}
