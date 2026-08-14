import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TYPEORM_CONFIG } from './typeorm.config';

const AppDataSource = new DataSource(TYPEORM_CONFIG as DataSourceOptions);

export default AppDataSource;