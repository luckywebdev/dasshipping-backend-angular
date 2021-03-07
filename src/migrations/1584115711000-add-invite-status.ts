import { MigrationInterface, QueryRunner } from 'typeorm';

export class inviteStatus1584115711000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const existStatus = await queryRunner.query('SELECT id from "inviteStatus" where id = 4');
        if (!existStatus) {
            await queryRunner.query(`INSERT INTO public."inviteStatus" (id, name) VALUES (4, 'Expired');`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const existStatus = await queryRunner.query('SELECT id from "inviteStatus" where id = 4');
        if (!existStatus) {
            await queryRunner.query(`INSERT INTO public."inviteStatus" (id, name) VALUES (4, 'Expired');`);
        }
    }

}