import { MigrationInterface, QueryRunner } from 'typeorm';

export class statusInvite1584118255000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const existStatus = await queryRunner.query('SELECT id from "inviteStatus" where id = 4');
        if (existStatus && !existStatus.length) {
            await queryRunner.query(`INSERT INTO public."inviteStatus" (id, name) VALUES (4, 'Expired');`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DELETE from public."inviteStatus" where id = 4;`);
    }

}