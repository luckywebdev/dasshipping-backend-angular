const dotenv = require ('dotenv');

dotenv.config ({
  path: `./env/${process.env.NODE_ENV}.env`,
  debug: process.env.DOT_DEBUG,
});

const config = {
  type: process.env.DATABASE_TYPE,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  logging: process.env.LOGGING,
  entities: JSON.parse (process.env.DATABASE_ENTITIES),
  migrations: JSON.parse (process.env.DATABASE_MIGRATIONS),
  dir: '/src/migrations/',
  tableName: process.env.MIGRATIONS_TABLE_NAME,
};

console.log (config);
module.exports = config;
