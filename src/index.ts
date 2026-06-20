import { serve } from '@hono/node-server'
//////
import {app} from './app.js';

const start = async () => {
  try {

    serve({
      fetch: app.fetch,
      port: 3000,
    }, (info) => {
      console.info(`Server is running on http://localhost:${info.port}`)
    })

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};


start();


