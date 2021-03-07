import { EntityRepository, Repository } from 'typeorm';

import { GetList } from '../app/dto/requestList.dto';
import { FiltersLeadsRequest } from '../app/lead/dto/list/filters.dto';
import { GetLeadsListResponse } from '../app/lead/dto/list/response.dto';
import { QuotesListResponse } from '../app/quote/dto/responses/list.dto';
import { WEB_NOTIFICATION } from '../dto/notification.dto';
import { NotificationStatus } from '../entities/notification.entity';
import { QUOTE_STATUS } from '../entities/orderBase.entity';
import { QuoteEntity } from '../entities/quote.entity';

const metersToMileRate = 0.000621371;

@EntityRepository(QuoteEntity)
export class QuoteRepository extends Repository<QuoteEntity> {

    public async getVisible(query: GetList, accountId?: number): Promise<QuotesListResponse> {
        const dbQuery = this.createQueryBuilder('quote')
            .where(query.where)
            .andWhere('quote.status IN (:...statuses)', {
                statuses: [QUOTE_STATUS.NEW, QUOTE_STATUS.ACCEPTED],
            });

        const orderByField = 'quote.id';

        const dbQueryList = dbQuery
            .leftJoinAndSelect('quote.createdBy', 'createdBy')
            .leftJoinAndSelect('quote.pickLocation', 'pickLocation')
            .leftJoinAndSelect('quote.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('quote.cars', 'cars')
            .orderBy(
                orderByField,
                query.orderByDirection ? query.orderByDirection : 'DESC',
            )
            .skip(query.offset)
            .take(query.limit);

        const count = await dbQuery.getCount();
        if (accountId) {
            dbQueryList.leftJoinAndSelect('quote.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.QUOTE });
        }
        const data = await dbQueryList.getMany();
        return { data, count };
    }

    public async getVisibleCount(where: any): Promise<number> {
        const count = await this.createQueryBuilder('quote')
            .where(where)
            .andWhere('quote.status IN (:...statuses)', {
                statuses: [QUOTE_STATUS.NEW, QUOTE_STATUS.ACCEPTED],
            }).getCount();

        return count;
    }

    public async getLeads(
        query: FiltersLeadsRequest,
    ): Promise<GetLeadsListResponse> {

        const queryBuilder = this.createQueryBuilder('quote')
            .where(query.where)
            .leftJoinAndSelect('quote.createdBy', 'createdBy')
            .leftJoinAndSelect('quote.pickLocation', 'pickLocation')
            .leftJoinAndSelect('quote.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('quote.cars', 'cars')
            .leftJoinAndSelect('quote.customer', 'customer')
            .orderBy(
                `quote.${query.orderByField || 'id'}`,
                query.orderByDirection ? query.orderByDirection : 'DESC',
            )
            .skip(query.offset)
            .take(query.limit);

        if (query.trailerType) {
            queryBuilder.andWhere('quote.trailerType = :trailerType', {
                trailerType: query.trailerType,
            });
        }

        if (query.vehicleType) {
            queryBuilder.andWhere('cars.type = :truckType', {
                truckType: query.vehicleType,
            });
        }

        if (query.minimumNumberOfVehiclesPerLoad) {
            queryBuilder.andWhere(() => {
                return `(select count(*) as cars_count from car where car."quoteId" = quote.id) >= ${
                    query.minimumNumberOfVehiclesPerLoad
                    }`;
            });
        }
        if (query.originPoint) {
            // tslint:disable-next-line:max-line-length
            queryBuilder.andWhere(
                '(ST_Distance(pickLocation.point, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(pickLocation.point)))) <= :radius',
                {
                    radius: query.originPoint.radius / metersToMileRate,
                    origin: {
                        type: 'Point',
                        coordinates: [
                            query.originPoint.point.lat,
                            query.originPoint.point.lon,
                        ],
                    },
                },
            );
        }
        if (query.destinationPoint) {
            // tslint:disable-next-line:max-line-length
            queryBuilder.andWhere(
                '(ST_Distance(deliveryLocation.point, ST_SetSRID(ST_GeomFromGeoJSON(:destination), ST_SRID(deliveryLocation.point)))) <= :radius',
                {
                    radius: query.destinationPoint.radius / metersToMileRate,
                    destination: {
                        type: 'Point',
                        coordinates: [
                            query.destinationPoint.point.lat,
                            query.destinationPoint.point.lon,
                        ],
                    },
                },
            );
        }

        const [data, count] = await queryBuilder.getManyAndCount();
        return { data, count };
    }

    public async getFullById(id: number): Promise<QuoteEntity> {
        return this.getFullByWhere({ id });
    }

    public async getFullByWhere(where): Promise<QuoteEntity> {
        return this.createQueryBuilder('quote')
            .leftJoinAndSelect('quote.createdBy', 'createdBy')
            .leftJoinAndSelect('quote.cars', 'cars')
            .leftJoinAndSelect('quote.pickLocation', 'pickLocation')
            .leftJoinAndSelect('quote.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('quote.customer', 'customer')
            .where(where)
            .andWhere('quote.status IN (:...statuses)', {
                statuses: [
                    QUOTE_STATUS.LEAD,
                    QUOTE_STATUS.QUOTED,
                    QUOTE_STATUS.NEW,
                    QUOTE_STATUS.ACCEPTED,
                ],
            })
            .getOne();
    }

    public async getLeadsByQuery(where: any): Promise<QuoteEntity[]> {
        const queryBuilder = this.createQueryBuilder('quote')
            .where(where)
            .andWhere('quote.status IN (:...statuses)', {
                statuses: [QUOTE_STATUS.LEAD, QUOTE_STATUS.QUOTED],
            });

        return await queryBuilder.getMany();
    }

    public async getLeadsForSend(where: any): Promise<QuoteEntity[]> {
        const date = new Date(Date.now() - 86400 * 1000).toISOString();
        const queryBuilder = this.createQueryBuilder('quote')
            .leftJoinAndSelect('quote.customer', 'customer')
            .leftJoinAndSelect('quote.cars', 'cars')
            .where(where)
            .andWhere('quote.status IN (:...statuses)', {
                statuses: [QUOTE_STATUS.LEAD, QUOTE_STATUS.QUOTED],
            })
            .andWhere(`quote.sentDate <= :date `, { date });

        return await queryBuilder.getMany();
    }
}
