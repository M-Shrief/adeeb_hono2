import { drizzle } from 'drizzle-orm/postgres-js';
import { MigrationConfig } from 'drizzle-orm/migrator';
/////
import {DB_URL, DB_MIGRATION_FOLDER, NODE_ENV} from "../config.js"
import * as schemas from "./schemas.js"


export const db = drizzle({ 
  schema: schemas,
  connection: { 
    url: DB_URL, 
    ssl: false 
  },
  casing: "snake_case",
  // logger: NODE_ENV == "dev" ? true : false 
});

export const migration_config: MigrationConfig = {
  migrationsFolder: DB_MIGRATION_FOLDER || './drizzle'
}