import mysql from 'mysql2/promise';
import { DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_URL, DATABASE_USER } from '../config/env.js';

const db = mysql.createPool({   // you can also use createConnection
  host: DATABASE_URL,
  port: DATABASE_PORT,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME
});

export default db;