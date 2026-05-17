import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { createPool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

const file = process.argv[2];
if (!file) { console.error('Usage: tsx run-migration.ts <sql-file>'); process.exit(1); }

const sql = readFileSync(resolve(__dirname, file), 'utf8');

const pool = createPool({
  host:               process.env.MYSQL_HOST     ?? '127.0.0.1',
  port:               Number(process.env.MYSQL_PORT ?? 3306),
  user:               process.env.MYSQL_USER     ?? 'root',
  password:           process.env.MYSQL_PASSWORD ?? '',
  database:           process.env.MYSQL_DATABASE ?? 'netsuite',
  multipleStatements: true,
});

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql);
    console.log(`✔ Migration applied: ${file}`);
  } finally {
    conn.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err); process.exit(1); });
