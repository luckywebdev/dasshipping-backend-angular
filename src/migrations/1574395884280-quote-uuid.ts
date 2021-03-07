import * as shortid from 'shortid';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuoteUuid1574395884280 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const quotes = await queryRunner.query('SELECT id from "quote"');
        const promises = [];
        for (const quote of quotes) {
            const uuid = shortid.generate();
            promises.push(queryRunner.query(`UPDATE "quote" set "uuid" = '${uuid}' where "id" = ${quote.id}`));
        }
        return await Promise.all(promises);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const quotes = await queryRunner.query('SELECT id from "quote"');
        const promises = [];
        for (const quote of quotes) {
            const uuid = shortid.generate();
            promises.push(queryRunner.query(`UPDATE "quote" set "uuid" = '${uuid}' where "id" = ${quote.id}`));
        }
        return await Promise.all(promises);
    }

}
