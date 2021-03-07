import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';

@Entity({ name: 'role' })
export class RoleEntity {
    @OneToMany(type => AccountEntity, account => account.role)
    accounts: AccountEntity[];

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;
}
