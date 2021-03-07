import {Injectable} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {getConnection} from 'typeorm';

@Injectable()
export class FixturesService {

    getOrder(entityName) {
        const order: string[] = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '/data/_order.json'),
                'utf8',
            ),
        );
        return order.indexOf(entityName);
    }

    injectAccounts(): any[] {
        return [];
    }

    clear() {
    }

    async getEntities() {
        const entities = [];
        getConnection().entityMetadatas.forEach(entity => {
            if (this.getOrder(entity.name) !== -1) {
                entities.push({name: entity.name, tableName: entity.tableName, order: this.getOrder(entity.name)});
            }
        });

        return entities;
    }

    async reloadFixtures() {
        const entities = await this.getEntities();
        await this.cleanAll(entities);
        await this.loadAll(entities);
    }

    /**
     * Cleans all the entities
     */
    async cleanAll(entities: any[]) {
        try {
            for (const entity of entities.sort((a, b) => b.order - a.order)) {
                const repository = await getConnection().getRepository(entity.name);
                // console.info(`Delete data for ${entity.name}`);
                await repository.query(`DELETE FROM "${entity.tableName}"`);
                await repository.query(`ALTER SEQUENCE "${entity.tableName}_id_seq" RESTART WITH 1`);
            }
        } catch (error) {
            throw new Error(`ERROR: Cleaning test db: ${error}`);
        }
    }

    /**
     * Insert the data from the src/test/fixtures folder
     */
    async loadAll(entities: any[]) {
        try {
            for (const entity of entities.sort((a, b) => a.order - b.order)) {
                const repository = await getConnection().getRepository(entity.name);
                const fixtureFile = path.join(__dirname, `/data/${entity.name}.json`);
                if (fs.existsSync(fixtureFile)) {
                    const items = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
                    // console.info(`Load fixtures for ${entity.name}`);
                    const result = await repository
                        .createQueryBuilder(entity.name)
                        .insert()
                        .values(items)
                        .execute();
                }
            }
        } catch (error) {
            throw new Error(`ERROR Loading fixtures on test db: ${error}`);
        }
    }
}
