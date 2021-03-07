import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum INVITE_STATUS {
    PENDING = 1,
    ACCEPTED = 2,
    DECLINED = 3,
    EXPIRED = 4,
}

@Entity({ name: 'inviteStatus' })
export class InviteStatusEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;
}
