import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orderStatus' })
export class OrderStatusEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;
}
