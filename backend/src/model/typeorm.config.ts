import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

type ConfigGetter = {
    get<T = string>(key: string, defaultValue?: T): T;
};

export function createTypeOrmConfig(config: ConfigGetter): TypeOrmModuleOptions {
  const host = config.get<string>('APP_DB_HOST', 'localhost');
  const port = parseInt(config.get<string>('APP_DB_PORT', '5432'), 10);
  const username = config.get<string>('APP_DB_USER', 'postgres');
  const database = config.get<string>('APP_DB_NAME', 'workspace');

  return {
    type: 'postgres',
    host,
    port,
    username,
    password: config.get<string>('APP_DB_PASSWORD', 'password'),
    database,
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development',
    entities: [join(__dirname, './entities/*{.ts,.js}')],
    migrations: [join(__dirname, './migrations/*{.ts,.js}')],
    subscribers: [],
  };
}

export const TYPEORM_CONFIG: TypeOrmModuleOptions = createTypeOrmConfig({
  get: <T = string>(key: string, defaultValue?: T): T => {
    return (process.env[key] ?? defaultValue) as T;
  },
});
