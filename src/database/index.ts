import { drizzle } from 'drizzle-orm/postgres-js';
/////
import {DB_URL} from "../config.js"



export const db = drizzle({ 
  connection: { 
    url: DB_URL, 
    ssl: false 
  },
  casing: "snake_case"
});
