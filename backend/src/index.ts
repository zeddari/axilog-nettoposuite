import 'dotenv/config';
import { buildApp } from './app.js';
import { checkDbConnection } from './db/connection.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  const app = await buildApp();

  try {
    await checkDbConnection();
    app.log.info('MySQL connection verified');
  } catch (err) {
    app.log.warn({ err }, 'MySQL not reachable yet — continuing (routes will fail until DB is ready)');
  }

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Axilog NetTopoSuite backend running on http://${HOST}:${PORT}`);
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
