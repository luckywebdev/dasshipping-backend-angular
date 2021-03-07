/* tslint:disable:no-console */

import { NestFactory } from '@nestjs/core';
import {AppModule} from '../app/app.module';
import {FixturesModule} from '../fixtures/fixtures.module';
import {FixturesService} from '../fixtures/fixtures.service';

// Create an execution context of the app
(async () => {
    const context = await NestFactory.createApplicationContext(AppModule);

    const fixturesModule = await context.select<FixturesModule>(FixturesModule);
    const fixturesService = await fixturesModule.get<FixturesService>(FixturesService);

    await fixturesService.clear();
})()
    .then(() => {
        console.log(`All fixtures have been deleted from the database.`);

        process.exit(0);
    })
    .catch(error => {
        console.log(error);
    });
