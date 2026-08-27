import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from './entities';

/**
 * Standalone DataSource used only by the TypeORM CLI (migration:generate / run / revert).
 * The running app configures TypeORM separately in DatabaseModule.
 *
 * Requires DATABASE_URL in the environment. Locally:
 *   DATABASE_URL="postgres://..." npm run migration:run
 * In the deploy it is injected from back-end/.env by docker compose.
 */
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is required to run TypeORM migrations.');
}

const isSupabase = dbUrl.includes('supabase.co');

export default new DataSource({
  type: 'postgres',
  url: dbUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  entities,
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: ['error', 'migration', 'schema'],
});
