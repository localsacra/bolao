import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAll() {
  const tables = ['profiles', 'predictions', 'group_predictions', 'special_predictions', 'matches'];
  for (const table of tables) {
    console.log(`Querying table: ${table}...`);
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error(`  Error querying ${table}:`, error.message, error.details || '');
    } else {
      console.log(`  Success! Found ${count} total rows. Sample:`, data);
    }
  }
}

testAll();
