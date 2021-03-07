import * as shortid from 'shortid';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderUuid1568480763109 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const orders = await queryRunner.query('SELECT id from "order"');
        const promises = [];
        for (const order of orders) {
            const uuid = shortid.generate();
            promises.push(queryRunner.query(`UPDATE "order" set "uuid" = '${uuid}' where "id" = ${order.id}`));
        }
        return await Promise.all(promises);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const orders = await queryRunner.query('SELECT id from "order"');
        const promises = [];
        for (const order of orders) {
            const uuid = shortid.generate();
            promises.push(queryRunner.query(`UPDATE "order" set "uuid" = '${uuid}' where "id" = ${order.id}`));
        }
        return await Promise.all(promises);
    }

}
