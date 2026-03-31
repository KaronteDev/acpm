import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './pool.js';

async function migrate() {
  const migrationFiles = [
    'init.sql',
    '002_add_notifications.sql',
    '003_add_comment_edits.sql',
    '004_add_user_preferences.sql',
    '005_update_theme_preference_check.sql',
  ];

  console.log('Running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const file of migrationFiles) {
      console.log(`  Executing ${file}...`);
      const sql = readFileSync(join(__dirname, 'migrations', file), 'utf-8');
      await client.query(sql);
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully.');
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
