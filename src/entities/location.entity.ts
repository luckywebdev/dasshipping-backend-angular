import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AddressType {
  RESIDENTIAL = 'Residential',
  DEALERSHIP = 'Dealership',
  AUCTION = 'Auction',
  PORT = 'Port',
}

@Entity({ name: 'location' })
export class LocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  state: string;

  @Column('varchar')
  city: string;

  @Column('varchar')
  zipCode: string;

  @Column('varchar', { nullable: true })
  address: string;

  @Column('varchar', { nullable: true })
  addressType: string;

  @Column('varchar', { nullable: true })
  instructions: string;

  @Column('numeric', { nullable: true })
  lat: number;

  @Column('numeric', { nullable: true })
  lon: number;

  @Column('geography', { nullable: true, srid: 4326 })
  point: {
    type: string;
    coordinates: number[];
  };

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
