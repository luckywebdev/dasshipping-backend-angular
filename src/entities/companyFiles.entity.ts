import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {CompanyEntity} from './company.entity';

@Entity({ name: 'companyFiles' })
export class CompanyFilesEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => CompanyEntity)
    company: CompanyEntity;

    @Column('integer')
    companyId: number;

    @Column('varchar')
    path: string;

    @Column('varchar')
    displayName: string;
}
