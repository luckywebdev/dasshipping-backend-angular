import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';

@Entity({ name: 'device' })
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  deviceId: string;

  @OneToOne(type => AccountEntity)
  account: AccountEntity;

  @Column('integer')
  accountId: number;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
