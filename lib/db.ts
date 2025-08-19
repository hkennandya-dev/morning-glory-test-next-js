import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || undefined,
  database: process.env.DB_NAME,
});

export const db = drizzle(poolConnection);