import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PolicyDTO } from '../dto/policy.dto';
import { dbSelectFileSign } from '../transformers/dbSelectFileSign.transformer';
import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';
import { OrderEntity } from './order.entity';
import { PolicyEntity } from './policy.entity';
import { QuoteEntity } from './quote.entity';

export enum CAR_CONDITION {
  OPERABLE = 'Operable',
  INOPERABLE = 'Inoperable',
}

@Entity({ name: 'car' })
export class CarEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer', { nullable: true })
  quoteId: number;

  @ManyToOne(type => QuoteEntity, quote => quote.cars)
  quote: QuoteEntity;

  @Column('integer', { nullable: true })
  orderId: number;

  @ManyToOne(type => OrderEntity, order => order.cars)
  order: OrderEntity;

  @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
  pricePerMile: number;

  @Column('varchar', { nullable: true })
  height: string;

  @Column('varchar', { nullable: true })
  length: string;

  @Column('varchar')
  make: string;

  @Column('varchar')
  model: string;

  @ManyToOne(type => PolicyEntity)
  @JoinColumn({ referencedColumnName: 'type', name: 'type' })
  @Column('varchar', { select: true, nullable: true })
  type: string | PolicyDTO;

  @Column('varchar', { nullable: true })
  weight: string;

  @Column('varchar', { nullable: true })
  urlVin: string;

  @Column('varchar')
  year: string;

  @Column('varchar', { nullable: true })
  vin: string;

  @Column('boolean', { default: false })
  inop: boolean;

  @Column({
    type: 'varchar',
    transformer: dbSelectFileSign,
    nullable: true,
  })
  imageUrl: string;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column('boolean', { default: false })
  lifted: boolean;

  @Column('boolean', { default: false })
  headRack: boolean;

  @Column('boolean', { default: false })
  handicap: boolean;

  @Column('boolean', { default: false })
  utilityBed: boolean;
}
