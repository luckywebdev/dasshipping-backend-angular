import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus} from '@nestjs/common';
import AppLogger from '../app/logging.service';

@Catch()
export class ErrorFilter implements ExceptionFilter {
    catch(error: Error, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        const status = (error instanceof HttpException) ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const req = host.switchToHttp().getRequest();

        const isAuthErr = req.url && req.url.includes('/auth');
        if (status !== HttpStatus.NOT_FOUND && !isAuthErr) {
            AppLogger.error({
                status,
                message: error.message,
                stack: error.stack,
                name: error.name,
                path: req.url,
                method: req.method,
                body: req.body,
                client_headers: req.headers,
            });
        } else if (isAuthErr) {
            AppLogger.warning({
                status,
                message: error.message,
                stack: error.stack,
                name: error.name,
                path: req.url,
                method: req.method,
                body: req.body,
                client_headers: req.headers,
            });
        }
        const body = (error instanceof HttpException) ? error.getResponse() : {
            statusCode: status,
            error: 'Internal server error',
        };

        return response.status(status).send(body);
    }
}
