import {Injectable, NestMiddleware} from '@nestjs/common';
import {Request, Response} from 'express';
import AppLogger from './logging.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next) {
        const localBody = Object.assign({}, req.body);
        delete localBody.password;

        AppLogger.info({
            path: req.url,
            method: req.method,
            body: localBody,
            message: 'accessed',
            client_headers: req.headers,
        });
        next();
    }
}
