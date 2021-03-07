import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { INestApplication } from '@nestjs/common';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('Should have documentation', () => {
        return request(app.getHttpServer())
            .get('/account/me')
            .expect(401);
    });

    afterAll(async () => {
        await app.close();
    });
});
