import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {InspectionEntity} from './inspection.entity';
import {DamageDTO} from '../dto/damage.dto';

export enum INSPECTION_DETAILS_FACE {
    FRONT = 'front',
    BACK = 'back',
    TOP = 'top',
    LEFT = 'left',
    RIGHT = 'right',
}

@Entity({name: 'inspectionDetails'})
export class InspectionDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {nullable: false})
    face: string;

    @Column('varchar', {nullable: false})
    sourceSchemeVersion: string;

    @Column('decimal', {nullable: true})
    sourceSchemeRatio: number;

    @Column('json', {nullable: true})
    damages: DamageDTO[];

    @ManyToOne(type => InspectionEntity, inspection => inspection.details, {onDelete: 'CASCADE'})
    inspection: InspectionEntity;

    @Column('integer', {nullable: false})
    inspectionId: number;
}
