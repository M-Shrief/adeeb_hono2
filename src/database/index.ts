import { drizzle } from 'drizzle-orm/postgres-js';
import { MigrationConfig } from 'drizzle-orm/migrator';
/////
import {DB_URL, DB_MIGRATION_FOLDER} from "../config.js"
import * as schemas from "./schemas.js"


export const db = drizzle({ 
  schema: schemas,
  connection: { 
    url: DB_URL, 
    ssl: false 
  },
  casing: "snake_case"
});

export const migration_config: MigrationConfig = {
  migrationsFolder: DB_MIGRATION_FOLDER || './drizzle'
}