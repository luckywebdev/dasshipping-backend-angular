import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum GENDERS {
    MALE = 1,
    FEMALE = 2,
    OTHER = 3,
}

@Entity({ name: 'gender' })
export class GenderEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;
}
