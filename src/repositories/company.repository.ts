import { EntityRepository, Repository } from 'typeorm';

import { CompanyEntity } from '../entities/company.entity';

@EntityRepository(CompanyEntity)
export class CompanyRepository extends Repository<CompanyEntity> {

    public async getCompany(companyId: number, query: any = {}): Promise<CompanyEntity> {
        const queryBuilder = this.createQueryBuilder('company')
            .leftJoinAndSelect('company.files', 'files')
            .andWhere('company.id = :id', { id: companyId });

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        return  await queryBuilder.getOne();
    }
}
