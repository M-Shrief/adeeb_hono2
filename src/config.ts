import { loadEnvFile } from 'node:process';



loadEnvFile('.env');

export const NODE_ENV = process.env.NODE_ENV as "dev" | "prod"