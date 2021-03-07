import { EntityRepository, Repository } from 'typeorm';

import { GetList } from '../app/dto/requestList.dto';
import { GetInspectionListResponse } from '../app/inspection/dto/list/response.dto';
import { InspectionEntity } from '../entities/inspection.entity';

@EntityRepository(InspectionEntity)
export class InspectionRepository extends Repository<InspectionEntity> {

    public async getDetailedInspection(where = {}): Promise<InspectionEntity> {
        return await this.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.details', 'details')
            .leftJoinAndSelect('inspection.createdLocation', 'createdLocation')
            .leftJoinAndSelect('inspection.signLocation', 'signLocation')
            .where(where)
            .getOne();
    }

    public async getInspections(where = {}): Promise<InspectionEntity[]> {
        return await this.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.details', 'details')
            .where(where)
            .getMany();
    }

    public async getDetailedInspectionBasedOnOrder(where = {}): Promise<InspectionEntity> {
        return await this.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.details', 'details')
            .leftJoinAndSelect('inspection.createdLocation', 'createdLocation')
            .leftJoinAndSelect('inspection.signLocation', 'signLocation')
            .leftJoin('inspection.order', 'order')
            .where(where)
            .getOne();
    }

    public async getAll(query: GetList): Promise<GetInspectionListResponse> {
        const queryBuilder = this.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.details', 'details')
            .orderBy(query.orderByField ? `inspection.${query.orderByField}` : 'inspection.updatedAt', query.orderByDirection ? query.orderByDirection : 'DESC')
            .skip(query.offset)
            .take(query.limit);

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        const [inspections, inspectionsCount] = await queryBuilder.getManyAndCount();

        return { count: inspectionsCount, data: inspections };
    }

    public async getInspectionsBasedOnOrder(query: GetList): Promise<GetInspectionListResponse> {
        const queryBuilder = this.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.details', 'details')
            .leftJoinAndSelect('inspection.createdLocation', 'createdLocation')
            .leftJoinAndSelect('inspection.signLocation', 'signLocation')
            .leftJoin('inspection.order', 'order')
            .orderBy(query.orderByField ? `inspection.${query.orderByField}` : 'inspection.updatedAt',
                query.orderByDirection ? query.orderByDirection : 'DESC')
            .skip(query.offset)
            .take(query.limit);

        if (query.where && query.where.clientId) {
            queryBuilder.andWhere('order.createdById = :createdById', { createdById: query.where.clientId });
            delete query.where.clientId;
        }

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        const [inspections, inspectionsCount] = await queryBuilder.getManyAndCount();

        return { count: inspectionsCount, data: inspections };
    }

    public async deleteOrderInspection(orderId: number): Promise<void> {
        const orderInspectionIds = await this.createQueryBuilder('inspection')
            .select('inspection.id')
            .leftJoin('inspection.order', 'order')
            .where('order.id = :id', { id: orderId })
            .getMany();

        if (orderInspectionIds && orderInspectionIds.length) {
            const ids = orderInspectionIds.map(inspectionId => inspectionId.id);

            await this.createQueryBuilder('inspection')
                .where('inspection.id IN(:...ids)', { ids })
                .delete()
                .execute();
        }
    }

}
