import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './pool.js';

async function migrate() {
  const sql = readFileSync(join(__dirname, 'migrations', 'init.sql'), 'utf-8');

  console.log('Running database migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
