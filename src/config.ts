import { loadEnvFile } from 'node:process';



loadEnvFile('.env');

export const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_MIGRATION_FOLDER,
} = process.env

export const DB_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const NODE_ENV = process.env.NODE_ENV as "dev" | "prod"