import * as Transport from 'winston-transport';
import Axios from 'axios';

export class LogstashTransport extends Transport {
    private readonly tag: string;
    private readonly host: string;
    private readonly protocol: string;
    private readonly url: string;
    private readonly port: number;

    constructor(opts) {
        super(opts);
        this.host = opts.host;
        this.port = opts.port;
        this.protocol = opts.protocol || 'http';
        this.url = `${this.protocol}://${this.host}:${this.port}`;
        this.tag = opts.tag;
        if (opts.health) {
            Axios.head(this.url)
                .then(() => {
                    // tslint:disable-next-line:no-console
                    console.log(`${this.url} is alive`);
                })
                .catch(() => {
                    // tslint:disable-next-line:no-console
                    console.log(`${this.url} is not reachable`);
                });
        }
    }

    log(info, callback) {
        info.tag = this.tag;

        if (info.message && info.message instanceof Object) {
            info.message = JSON.stringify(info.message);
        }
        Axios.post(this.url, info)
            .catch((e) => {
                // tslint:disable-next-line:no-console
                console.log(e);
            });
        setImmediate(() => {
            this.emit('logged', info);
        });

        callback();
    }
}
