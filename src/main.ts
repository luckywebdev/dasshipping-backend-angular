import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { apm } from 'nestjs-apm';

import { AppModule } from './app/app.module';
import { ConfigService } from './config/config.service';
import { ErrorFilter } from './errors/errors.filter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    const configService: ConfigService = app.get(ConfigService);
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        exceptionFactory: (errors: ValidationError[]) => {
            let error = errors[0];
            while (error.children && error.children.length) {
                error = error.children[0];
            }
            const errorMessage = error.constraints[Object.keys(error.constraints)[0]];
            throw new BadRequestException(errorMessage);
        },
    }));

    const options = new DocumentBuilder()
        .setTitle('Car-T API')
        .setDescription('Car-T API Documentation')
        .setVersion(process.env.npm_package_version)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);

    app.use('/swagger.json', (req, res) => res.send(JSON.stringify(document)));
    app.use('/documentation', (req, res) => {
        const html = fs.readFileSync(`${__dirname}/../documentation.html`, 'utf-8');
        res.send(html);
    });

    app.use('/_health', (req, res) => {
        res.json({
            healthy: true,
        });
    });

    app.use('/_version', (req, res) => {
        res.json({
            version: process.env.VERSION || 'development',
        });
    });

    const cacheTime = 31536000;
    app.useStaticAssets(path.join(__dirname, 'public'), { maxAge: cacheTime });
    app.set('views', path.join(__dirname, 'views'));
    app.use('/pdf/Import_Dispatch_Info.pdf', (req, res) => {
        const pdf = fs.readFileSync(`${__dirname}/pdf/Import_Dispatch_Info.pdf`);
        res.contentType("application/pdf");
        res.send(pdf);
    });
    app.set('view engine', 'ejs');
    // if (apm.isStarted()) {
    //     console.log('APM running');
    // }
    app.useGlobalFilters(new ErrorFilter());

    await app.listen(configService.port);
}

bootstrap();
