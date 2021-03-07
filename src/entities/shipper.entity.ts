import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'shipper' })
export class ShipperEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: true })
    phone: string;

    @Column('character varying', { nullable: true })
    email: string;

    @Column('character varying', { nullable: true })
    billingEmail: string;

    @Column('varchar', { nullable: true })
    fullName: string;

    @Column('varchar', { nullable: true })
    companyName: string;

    @Column('varchar', { nullable: true })
    state: string;

    @Column('varchar', { nullable: true })
    city: string;

    @Column('varchar', { nullable: true })
    zipCode: string;

    @Column('varchar', { nullable: true })
    address: string;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
