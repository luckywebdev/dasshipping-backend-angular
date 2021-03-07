/* tslint:disable:no-console */

import { NestFactory } from '@nestjs/core';
import {AppModule} from '../app/app.module';
import {FixturesModule} from '../fixtures/fixtures.module';
import {FixturesService} from '../fixtures/fixtures.service';

// Create an execution context of the app
(async () => {
    const context = await NestFactory.create(AppModule);

    const fixturesModule = await context.select<FixturesModule>(FixturesModule);
    const fixturesService = await fixturesModule.get<FixturesService>(FixturesService);

    const accountsList = await fixturesService.injectAccounts();

    console.log(`- ${accountsList.length} accounts have been inserted in the database.`);
})()
    .then(() => {
        console.log(`Success!`);

        process.exit(0);
    })
    .catch(error => {
        console.log(error);
    });
