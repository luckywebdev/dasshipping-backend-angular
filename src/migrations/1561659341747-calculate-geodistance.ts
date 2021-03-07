import { MigrationInterface, QueryRunner } from 'typeorm';

export class CalculateGeodistance1561659341747 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP EXTENSION IF EXISTS postgis');
    }
}
