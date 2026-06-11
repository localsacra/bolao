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

async function fetchMatches() {
  console.log('Fetching matches from Supabase...');
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching matches:', error);
    process.exit(1);
  }

  console.log(`Successfully fetched ${data?.length || 0} matches:`);
  data?.forEach((match) => {
    console.log(
      `ID: ${match.id} | Phase: ${match.phase} | Group: ${match.group_name} | ${match.team_a} vs ${match.team_b} | Date: ${match.match_date}`
    );
  });
}

fetchMatches();
