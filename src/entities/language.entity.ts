import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {CompanyEntity} from './company.entity';
import {AccountEntity} from './account.entity';

@Entity({ name: 'language' })
export class LanguageEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    iso2: string;

    @Column('varchar')
    name: string;
}
