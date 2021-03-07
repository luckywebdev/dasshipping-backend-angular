import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multerS3 from 'multer-s3';
import * as path from 'path';

import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/config.service';
import { AccountEntity } from '../../entities/account.entity';
import { getS3 } from '../../utils/fileSign.util';
import { AuthModule } from '../auth/auth.module';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { CarRepository } from '../../repositories/car.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { CalculatorService } from '../shared/calculator.service';
import { PolicyEntity } from '../../entities/policy.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { HereService } from '../here/here.service';

const UPLOAD_SIZE = 1024 * 1024 * 1.5;

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      PolicyEntity,
      GeneralEntity,
      QuoteRepository,
      CarRepository,
    ]),
    AuthModule,
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
              cb(
                null,
                `${Date.now().toString()}${path.extname(file.originalname)}`,
              );
            },
          }),
          limits: {
            fileSize: UPLOAD_SIZE,
          },
        };
      },
    }),
  ],
  providers: [CarService, CalculatorService, HereService],
  controllers: [CarController],
  exports: [CarService],
})
export class CarModule {}
