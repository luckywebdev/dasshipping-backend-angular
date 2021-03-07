import * as braintree from 'braintree';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';
import * as path from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export interface EnvConfig {
    API_DOMAIN: string;

    API_ITEMS_PER_PAGE: string;

    APP_SCHEMA_CLIENT: string;
    APP_SCHEMA_DRIVER: string;

    APP_IOS_DRIVER_ID: string;
    APP_IOS_CLIENT_ID: string;
    APP_ANDROID_DRIVER_ID: string;
    APP_ANDROID_CLIENT_ID: string;

    AUTH_REFRESH_TOKEN_EXPIRES_IN: number;

    AUTH_TOKEN_EXPIRES_IN: number;
    AUTH_TOKEN_EXPIRES_IN_FILE: number;
    LEAD_TOKEN_EXPIRES_IN: number | string;
    AUTH_TOKEN_SECRET: string;
    DATABASE_ENTITIES: string[];
    DATABASE_MIGRATIONS: string[];
    DATABASE_HOST: string;
    DATABASE_NAME: string;
    DATABASE_PASSWORD: string;
    DATABASE_SSL: boolean;
    DATABASE_PORT: number;
    DATABASE_SYNCHRONIZE: boolean;
    LOGGING: boolean;
    MIGRATIONS_RUN: boolean;
    MIGRATIONS_TABLE_NAME: string;

    DATABASE_TYPE: 'postgres';
    DATABASE_USERNAME: string;
    DIGITAL_OCEAN_ACCESS_KEY_ID: string;
    DIGITAL_OCEAN_ACCESS_KEY_SECRET: string;
    DIGITAL_OCEAN_ACCESS_TOKEN_EXPIRES_IN: number;
    DIGITAL_OCEAN_BUCKET: string;

    DIGITAL_OCEAN_SPACE_URL: string;

    BRAINTREE_MERCHANT_ID: string;
    BRAINTREE_PUBLIC_KEY: string;
    BRAINTREE_PRIVATE_KEY: string;

    DOMAIN: string;

    HERE_APP_CODE: string;

    HERE_APP_ID: string;

    MAIL_API_KEY: string;
    MAIL_DOMAIN: string;
    NODE_ENV: string;
    PORT: number;

    VIN_DECODER_API_KEY: string;
    VIN_DECODER_HOST: string;
    RELEVANCE_ADDRESS: number;
    MATCH_LEVEL: boolean;

    IMAGES_API: string;
    SECRET_KEY_IMAGE: string;
    CAR_TYPES_API: string;
    GR_ENABLED: boolean;
    GR_SITE_KEY: string;
    GR_SECRET_KEY: string;

    ONESIGNAL_ID_DRIVER: string;
    ONESIGNAL_API_KEY_DRIVER: string;

    ONESIGNAL_ID_CLIENT: string;
    ONESIGNAL_API_KEY_CLIENT: string;
}

export interface TokenConfig {
    secretOrPrivateKey: string;
    signOptions: {
        expiresIn: number;
    };
}

export interface EmailConfig {
    apiKey: string;
    domain: string;
}

export interface IRecatcha {
    isEnabled: boolean;
    siteKey: string;
    secretKey: string;
}

export interface DigitalOceanConfig {
    accessKeyID: string;
    accessKeySecret: string;
    bucket: string;
    spaceUrl: string;
    tokenExpiresIn: number;
}

export interface BraintreeConfig {
    merchantId: string;
    publicKey: string;
    privateKey: string;
    environment: string;
}

export interface HereConfig {
    app_code: string;
    app_id: string;
}

export interface OneSignal {
    appId: string;
    restApiKey: string;
}

export class ConfigService {
    private readonly envConfig: EnvConfig;

    private readonly propsMap: { [key: string]: any } = {
        NODE_ENV: Joi.string()
            .valid(['dev', 'production', 'test', 'docker', 'local-docker', 'staging'])
            .default('dev'),
        PORT: Joi.number().default(3000),
        DATABASE_TYPE: Joi.string()
            .valid(['postgres'])
            .default('postgres'),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number()
            .default(5432)
            .required(),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().allow(''),
        DATABASE_SSL: Joi.boolean().default(false),
        DATABASE_NAME: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASS: Joi.string().allow(''),
        POSTGRES_DB: Joi.string().required(),
        ALLOW_IP_RANGE: Joi.string().required(),
        DATABASE_ENTITIES: Joi.array()
            .items(Joi.string())
            .required(),
        DATABASE_MIGRATIONS: Joi.array()
            .items(Joi.string())
            .required(),
        DATABASE_SYNCHRONIZE: Joi.boolean().required(),
        LOGGING: Joi.boolean().required(),
        MIGRATIONS_TABLE_NAME: Joi.string().required(),
        MIGRATIONS_RUN: Joi.boolean().required(),
        AUTH_TOKEN_SECRET: Joi.string().required(),
        AUTH_TOKEN_EXPIRES_IN: Joi.number(),
        AUTH_TOKEN_EXPIRES_IN_FILE: Joi.number(),
        LEAD_TOKEN_EXPIRES_IN: Joi.string(),
        AUTH_REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
        MAIL_API_KEY: Joi.string().required(),
        MAIL_DOMAIN: Joi.string().required(),
        DOMAIN: Joi.string().required(),
        API_DOMAIN: Joi.string().required(),
        DIGITAL_OCEAN_SPACE_URL: Joi.string().required(),
        DIGITAL_OCEAN_BUCKET: Joi.string().required(),
        DIGITAL_OCEAN_ACCESS_KEY_ID: Joi.string().required(),
        DIGITAL_OCEAN_ACCESS_KEY_SECRET: Joi.string().required(),
        DIGITAL_OCEAN_ACCESS_TOKEN_EXPIRES_IN: 3600,
        BRAINTREE_MERCHANT_ID: Joi.string().required(),
        BRAINTREE_PUBLIC_KEY: Joi.string().required(),
        BRAINTREE_PRIVATE_KEY: Joi.string().required(),
        HERE_APP_ID: Joi.string().required(),
        HERE_APP_CODE: Joi.string().required(),
        APP_SCHEMA_CLIENT: Joi.string().required(),
        APP_SCHEMA_DRIVER: Joi.string().required(),
        APP_IOS_DRIVER_ID: Joi.string().required(),
        APP_IOS_CLIENT_ID: Joi.string().required(),
        APP_ANDROID_DRIVER_ID: Joi.string().required(),
        APP_ANDROID_CLIENT_ID: Joi.string().required(),
        VIN_DECODER_API_KEY: Joi.string().required(),
        VIN_DECODER_HOST: Joi.string().required(),
        RELEVANCE_ADDRESS: Joi.number(),
        MATCH_LEVEL: Joi.boolean().required(),
        CAR_TYPES_API: Joi.string().required(),
        LOGSTASH_LOGGING: Joi.boolean().required(),
        CONSOLE_LOGGING: Joi.boolean().required(),
        LOGSTASH_HOST: Joi.string().required(),
        LOGSTASH_PROTOCOL: Joi.string().required(),
        LOGSTASH_PORT: Joi.number().required(),
        IMAGES_API: Joi.string().required(),
        SECRET_KEY_IMAGE: Joi.string().required(),
        GR_ENABLED: Joi.boolean().default(false),
        GR_SITE_KEY: Joi.string(),
        GR_SECRET_KEY: Joi.string(),
        ONESIGNAL_ID_DRIVER: Joi.string(),
        ONESIGNAL_API_KEY_DRIVER: Joi.string(),
        ONESIGNAL_ID_CLIENT: Joi.string(),
        ONESIGNAL_API_KEY_CLIENT: Joi.string(),
    };
    private readonly schema: Joi.ObjectSchema = Joi.object(this.propsMap);

    constructor(filePath: string) {
        const dotenvPath = path.join(__dirname, '../../env', filePath);
        const config = dotenv.parse(fs.readFileSync(dotenvPath, 'utf8'));
        dotenv.config({
            path: dotenvPath,
            debug: process.env.DOT_DEBUG,
        });

        const systemEnv = process.env;

        Object.keys(systemEnv).forEach((key: string) => {
            if (this.propsMap[key]) {
                config[key] = systemEnv[key];
            }
        });

        this.envConfig = this.validateInput(config);
    }

    private validateInput(envConfig: EnvConfig): EnvConfig {

        const { error, value: validatedEnvConfig } = Joi.validate(
            envConfig,
            this.schema,
        );
        if (error) {
            throw new Error(`Config validation error: ${error.message}`);
        }
        return validatedEnvConfig;
    }

    get database(): PostgresConnectionOptions {
        return {
            type: this.envConfig.DATABASE_TYPE,
            host: this.envConfig.DATABASE_HOST,
            port: Number(this.envConfig.DATABASE_PORT),
            username: this.envConfig.DATABASE_USERNAME,
            password: this.envConfig.DATABASE_PASSWORD,
            database: this.envConfig.DATABASE_NAME,
            entities: this.envConfig.DATABASE_ENTITIES,
            migrations: this.envConfig.DATABASE_MIGRATIONS,
            synchronize: Boolean(this.envConfig.DATABASE_SYNCHRONIZE),
            logging: Boolean(this.envConfig.LOGGING),
            migrationsTableName: this.envConfig.MIGRATIONS_TABLE_NAME,
            migrationsRun: Boolean(this.envConfig.MIGRATIONS_RUN),
            ssl: Boolean(this.envConfig.DATABASE_SSL),
        };
    }

    get token(): TokenConfig {
        return {
            secretOrPrivateKey: this.envConfig.AUTH_TOKEN_SECRET,
            signOptions: {
                expiresIn: this.envConfig.AUTH_TOKEN_EXPIRES_IN,
            },
        };
    }

    get port(): number {
        return this.envConfig.PORT;
    }

    get email(): EmailConfig {
        return {
            apiKey: this.envConfig.MAIL_API_KEY,
            domain: this.envConfig.MAIL_DOMAIN,
        };
    }

    get domain(): string {
        return this.envConfig.DOMAIN;
    }

    get apiDomain(): string {
        return this.envConfig.API_DOMAIN;
    }

    get accessTokenExpiresIn(): number {
        return this.envConfig.AUTH_TOKEN_EXPIRES_IN;
    }

    get accessTokenExpiresInFile(): string {
        return this.envConfig.AUTH_TOKEN_EXPIRES_IN_FILE.toString();
    }

    get leadTokenExpires(): number | string {
        return this.envConfig.LEAD_TOKEN_EXPIRES_IN;
    }

    get refreshTokenExpiresIn(): number {
        return this.envConfig.AUTH_REFRESH_TOKEN_EXPIRES_IN;
    }

    get digitalOcean(): DigitalOceanConfig {
        return {
            spaceUrl: this.envConfig.DIGITAL_OCEAN_SPACE_URL,
            accessKeyID: this.envConfig.DIGITAL_OCEAN_ACCESS_KEY_ID,
            accessKeySecret: this.envConfig.DIGITAL_OCEAN_ACCESS_KEY_SECRET,
            tokenExpiresIn: this.envConfig.DIGITAL_OCEAN_ACCESS_TOKEN_EXPIRES_IN,
            bucket: this.envConfig.DIGITAL_OCEAN_BUCKET,
        };
    }

    get braintreePayment(): BraintreeConfig {
        return {
            merchantId: this.envConfig.BRAINTREE_MERCHANT_ID,
            publicKey: this.envConfig.BRAINTREE_PUBLIC_KEY,
            privateKey: this.envConfig.BRAINTREE_PRIVATE_KEY,
            environment: this.envConfig.NODE_ENV === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox,
        };
    }

    get environment(): string {
        return this.envConfig.NODE_ENV;
    }

    get here(): HereConfig {
        return {
            app_id: this.envConfig.HERE_APP_ID,
            app_code: this.envConfig.HERE_APP_CODE,
        };
    }

    get imageUrl(): string {
        return this.envConfig.IMAGES_API;
    }

    get secretKeyThumbnail(): string {
        return this.envConfig.SECRET_KEY_IMAGE;
    }

    get appSchemaClient(): string {
        return this.envConfig.APP_SCHEMA_CLIENT;
    }

    get appSchemaDriver(): string {
        return this.envConfig.APP_SCHEMA_DRIVER;
    }

    get appIosDriver(): string {
        return this.envConfig.APP_IOS_DRIVER_ID;
    }

    get appIosClient(): string {
        return this.envConfig.APP_IOS_CLIENT_ID;
    }

    get appAndroidDriver(): string {
        return this.envConfig.APP_ANDROID_DRIVER_ID;
    }

    get appAndroidClient(): string {
        return this.envConfig.APP_ANDROID_CLIENT_ID;
    }

    get vinDecoderApiKey(): string {
        return this.envConfig.VIN_DECODER_API_KEY;
    }

    get vinDecoderHost(): string {
        return this.envConfig.VIN_DECODER_HOST;
    }

    get relevanceAddress(): number {
        return this.envConfig.RELEVANCE_ADDRESS;
    }

    get matchLevel(): boolean {
        return this.envConfig.MATCH_LEVEL;
    }

    get carTypeApi(): string {
        return this.envConfig.CAR_TYPES_API;
    }

    get oneSignalDriver(): OneSignal {
        return {
            appId: this.envConfig.ONESIGNAL_ID_DRIVER,
            restApiKey: this.envConfig.ONESIGNAL_API_KEY_DRIVER,
        };
    }

    get oneSignalClient(): OneSignal {
        return {
            appId: this.envConfig.ONESIGNAL_ID_CLIENT,
            restApiKey: this.envConfig.ONESIGNAL_API_KEY_CLIENT,
        };
    }

    get recatcha(): IRecatcha {
        return {
            isEnabled: this.envConfig.GR_ENABLED,
            siteKey: this.envConfig.GR_SITE_KEY,
            secretKey: this.envConfig.GR_SECRET_KEY,
        };
    }
}
