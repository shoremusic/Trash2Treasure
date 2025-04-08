// This script pushes the schema to the database
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle client
const db = drizzle(pool);

async function main() {
  console.log('Pushing schema to database...');
  
  try {
    // Migrate the database
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
}

main();