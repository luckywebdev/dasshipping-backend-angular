import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderBol1584980882000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "order" set "bolUrl" = null`)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "order" set "bolUrl" = null`)
    }

}
