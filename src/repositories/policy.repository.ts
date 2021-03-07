import {EntityRepository, getConnection, Repository} from 'typeorm';
import {PolicyEntity} from '../entities/policy.entity';

@EntityRepository(PolicyEntity)
export class PolicyRepository extends Repository<PolicyEntity> {
    public async updateCarTypePolicies(remoteCarTypes: Array<{type: string}>): Promise<void> {
       return getConnection().query(`
            INSERT INTO "policy" ("isNew", price, "type")
            SELECT true, 1, cts->>'type' as type
            FROM json_array_elements($1) cts
            LEFT JOIN "policy" p ON p.type = cts->>'type'
            WHERE p.type IS NULL
        `, [JSON.stringify(remoteCarTypes)]);
    }
}
