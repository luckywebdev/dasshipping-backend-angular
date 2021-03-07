import { EntityRepository, Repository } from 'typeorm';

import { EmailConfirmCodeEntity } from '../entities/emailConfirmCode.entity';

@EntityRepository(EmailConfirmCodeEntity)
export class EmailConfrimCodeRepository extends Repository<EmailConfirmCodeEntity> {

    public async getEmailConfirmByAccount(accountId: number): Promise<EmailConfirmCodeEntity> {
        return await this.createQueryBuilder('emailConfirmCode')
            .where('"accountId" = :accountId', { accountId })
            .orderBy('id', 'DESC')
            .getOne();
    }
    public async getEmailConfirmByHash(hash: string): Promise<EmailConfirmCodeEntity> {
        return await this.createQueryBuilder('emailConfirmCode')
            .leftJoinAndSelect('emailConfirmCode.account', 'account')
            .where('hash = :hash', { hash })
            .getOne();
    }
}
