import dotenv from 'dotenv';
dotenv.config();

const requiredVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SESSION_SECRET'
] as const;

for (const v of requiredVars) {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`);
  }
}

export const ENV = {
  PORT: process.env['PORT'] || '3000',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  CLIENT_URL: process.env['CLIENT_URL'] || 'http://localhost:5173',

  DB_HOST: process.env['DB_HOST']!,
  DB_PORT: parseInt(process.env['DB_PORT'] || '3306'),
  DB_USER: process.env['DB_USER']!,
  DB_PASSWORD: process.env['DB_PASSWORD']!,
  DB_NAME: process.env['DB_NAME']!,

  JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET']!,
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET']!,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',

  GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'] || '',
  GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'] || '',
  GOOGLE_CALLBACK_URL: process.env['GOOGLE_CALLBACK_URL'] || '',
  SESSION_SECRET : process.env['SESSION_SECRET'] as string,
} as const;

dotenv.config()

const envSchema = {
    DB_HOST : process.env.DB_HOST,
    DB_USER : process.env.DB_USER,
    DB_PASSWORD  : process.env.DB_PASSWORD,
    DB_NAME : process.env.DB_NAME,
    DB_PORT : process.env.DB_PORT,
    JWT_SECRET : process.env.JWT_SECRET,
    SESSION_SECRET : process.env.SESSION_SECRET
}

export const config = envSchema;