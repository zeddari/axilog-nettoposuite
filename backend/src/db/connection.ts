import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import type { Database } from './schema.js';

let db: Kysely<Database> | null = null;

export function getDb(): Kysely<Database> {
  if (!db) {
    const pool = createPool({
      host:               process.env.MYSQL_HOST     ?? 'localhost',
      port:               Number(process.env.MYSQL_PORT ?? 3306),
      database:           process.env.MYSQL_DATABASE  ?? 'topology',
      user:               process.env.MYSQL_USER       ?? 'topology_user',
      password:           process.env.MYSQL_PASSWORD   ?? '',
      connectionLimit:    20,
      waitForConnections: true,
      queueLimit:         0,
      timezone:           '+00:00',
    });

    db = new Kysely<Database>({
      dialect: new MysqlDialect({ pool }),
    });
  }
  return db;
}

export async function checkDbConnection(): Promise<void> {
  await getDb().selectFrom('users').select('id').limit(1).execute();
}
