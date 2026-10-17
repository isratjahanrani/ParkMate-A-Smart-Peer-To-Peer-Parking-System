import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configure Envs
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is missing from .env file.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully.');

    const sqlPath = path.join(process.cwd(), 'supabase_schema.sql');

    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Error: Could not find ${sqlPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing Schema Migration...');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ Database Schema applied successfully!');
    console.log('🎉 Your Supabase tables are ready.');

  } catch (err) {
    console.error('❌ Database Setup Failed:', err);
  } finally {
    await client.end();
  }
}

setupDatabase();
