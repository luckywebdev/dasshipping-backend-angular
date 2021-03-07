import * as shortid from 'shortid';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { ORDER_STATUS } from '../entities/orderBase.entity';

export class OrderStatus1584619331000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "order" set "hiddenForAdmin" = true, "hiddenForCompnay" = true  where "status" = '${ORDER_STATUS.ARCHIVED}'`)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "order" set "hiddenForAdmin" = false, "hiddenForCompnay" = false  where "status" = '${ORDER_STATUS.ARCHIVED}'`)
    }

}
