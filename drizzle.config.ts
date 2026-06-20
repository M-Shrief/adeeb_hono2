//  link: https://orm.drizzle.team/docs/migrations

import { defineConfig } from "drizzle-kit";
import { DB_URL, DB_MIGRATION_FOLDER } from "./src/config"


export default defineConfig({
    dialect: "postgresql",
    schema: "./src/database/schemas.ts",
    out: DB_MIGRATION_FOLDER,
    dbCredentials: {
        url: DB_URL,
        ssl: false
    },
    // verbose: true,
});