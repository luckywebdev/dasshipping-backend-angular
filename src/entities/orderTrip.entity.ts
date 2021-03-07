import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orderTrip' })
export class OrderStatusEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;
}
