import * as winston from 'winston';
import {LogstashTransport} from '../utils/logstash-transport';

const AppLogger = winston.createLogger({
    levels: {
        error: 0,
        warning: 1,
        info: 2,
        debug: 3,
    },
    transports: [
        new LogstashTransport({
            level: 'info',
            silent: !process.env.LOGSTASH_LOGGING,
            host: process.env.LOGSTASH_HOST,
            port: process.env.LOGSTASH_PORT,
            protocol: process.env.LOGSTASH_PROTOCOL,
            tag: 'backend',
        }),
        new winston.transports.Console({
            level: 'debug',
            silent: !process.env.CONSOLE_LOGGING,
        }),
    ],
});
export default AppLogger;
