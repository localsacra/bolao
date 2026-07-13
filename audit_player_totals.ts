import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env and .env.local
const loadEnv = () => {
  const env: Record<string, string> = { ...process.env as Record<string, string> };

  const parseEnvFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        env[key] = value.trim();
      }
    });
  };

  parseEnvFile(path.resolve(process.cwd(), '.env'));
  parseEnvFile(path.resolve(process.cwd(), '.env.local'));

  return env;
};

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'] || env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment or .env/.env.local files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Generic pagination fetch helper
async function fetchAll<T>(table: string, columns: string = '*'): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + 999);
    if (error) {
      console.error(`Error fetching table ${table}:`, error.message);
      throw error;
    }
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < 1000) {
        hasMore = false;
      } else {
        from += 1000;
      }
    } else {
      hasMore = false;
    }
  }
  return allData;
}

interface Profile {
  id: string;
  name: string;
}

interface PlayerScore {
  player_id: string;
  match_points: number;
  group_points: number;
  special_points: number;
  total_points: number;
}

async function runAudit() {
  console.log('Fetching database records...');
  try {
    const [profiles, scores] = await Promise.all([
      fetchAll<Profile>('profiles', 'id, name'),
      fetchAll<PlayerScore>('player_scores', 'player_id, match_points, group_points, special_points, total_points')
    ]);

    const profileMap = new Map<string, string>();
    profiles.forEach(p => {
      profileMap.set(p.id, p.name);
    });

    let checkedCount = 0;
    let cleanCount = 0;
    let mismatchCount = 0;
    const mismatches: Array<{ name: string; stored: number; computed: number; delta: number }> = [];

    scores.forEach(row => {
      // Skip sentinel system profile if present
      if (row.player_id === '00000000-0000-0000-0000-000000000000') return;

      checkedCount++;
      const computedTotal = (row.match_points || 0) + (row.group_points || 0) + (row.special_points || 0);
      const storedTotal = row.total_points || 0;

      if (computedTotal === storedTotal) {
        cleanCount++;
      } else {
        mismatchCount++;
        const playerName = profileMap.get(row.player_id) || `Player (${row.player_id.substring(0, 8)})`;
        mismatches.push({
          name: playerName,
          stored: storedTotal,
          computed: computedTotal,
          delta: computedTotal - storedTotal
        });
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('AUDIT SUMMARY — audit_player_totals');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Players checked:     ${checkedCount}`);
    console.log(`✅ Clean:            ${cleanCount}`);
    console.log(`❌ Mismatches:        ${mismatchCount}`);
    
    mismatches.forEach(m => {
      const deltaStr = m.delta > 0 ? `+${m.delta}` : `${m.delta}`;
      console.log(`  → ${m.name.padEnd(20)} stored=${m.stored.toString().padEnd(4)} computed=${m.computed.toString().padEnd(4)} delta=${deltaStr}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (mismatchCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Audit failed with error:', error);
    process.exit(1);
  }
}

runAudit();
