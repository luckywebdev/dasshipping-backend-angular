import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId} from 'typeorm';
import {AccountEntity} from './account.entity';

@Entity({ name: 'accountFiles' })
export class AccountFilesEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('integer')
    accountId: number;

    @Column('varchar')
    path: string;

    @Column('varchar')
    displayName: string;
}
