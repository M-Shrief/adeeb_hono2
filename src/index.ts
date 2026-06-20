import { serve } from '@hono/node-server'
//////
import {app} from './app.js';
import { logger } from './utils/logger.js';

const start = async () => {
  try {

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


