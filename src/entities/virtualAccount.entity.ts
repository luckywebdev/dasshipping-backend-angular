import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'virtualAccount' })
export class VirtualAccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  phoneNumber: string;

  @Column('character varying', { nullable: true })
  email: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Column('varchar', { nullable: true })
  hash: string;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
