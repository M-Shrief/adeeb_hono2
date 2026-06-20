import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/postgres-js/migrator';
//////
import {app} from './app.js';
import { db, migration_config } from './database/index.js'
import { on_process_failure } from './utils/errors.js'
import { logger } from './utils/logger.js';

const start = async () => {
  try {

    on_process_failure()

    // Database migration if it wasn't already migrated.
    await migrate(db, migration_config)

    serve({
      fetch: app.fetch,
      port: 3000,
    }, (info) => {
      logger.info(`Server is running on http://localhost:${info.port}`)
    })

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};


start();


