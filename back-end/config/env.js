import { config } from "dotenv";
import { existsSync } from "fs";

// Load the correct .env file
const envPath = `.env.${process.env.NODE_ENV || 'development'}.local`;
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config(); // fallback to .env
}

// Optionally log missing env variables
const requiredEnv = ['PORT', 'DATABASE_URL', 'DATABASE_USER', 'DATABASE_NAME', 'SECRET_KEY'];
requiredEnv.forEach(key => {
  if (!process.env[key]) {
    console.warn(`Missing environment variable: ${key}`);
  }
});

export const {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  SECRET_KEY
} = process.env;