import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { log } from './vite';

const { Pool } = pg;

// Initialize a connection pool using the DATABASE_URL environment variable
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log database connection
log('Database connection established', 'db');

// Export the drizzle client
export const db = drizzle(pool);