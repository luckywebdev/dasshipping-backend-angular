import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import * as path from 'path';

import { AuthModule } from '../app/auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { getS3 } from '../utils/fileSign.util';
import { FileController } from './file.controller';
import { FileService } from './file.service';

const UPLOAD_SIZE = 1024 * 1024 * 5;

@Module({
    imports: [
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return {
                    storage: multerS3({
                        s3: getS3(),
                        bucket: configService.digitalOcean.bucket,

                        metadata: (req, file, cb) => {
                            cb(null, { fieldName: file.fieldname });
                        },
                        key: (req, file, cb) => {
                            cb(null, `${Date.now().toString()}${path.extname(file.originalname)}`);
                        },
                    }),
                    limits: {
                        fileSize: UPLOAD_SIZE,
                    },
                };
            },
        }),
        AuthModule,
    ],
    controllers: [FileController],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule { }
