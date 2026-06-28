import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runValidation() {
  console.log('--------------------------------------------------');
  console.log('🔍 Running Database RLS & Trigger Safeguard Validation');
  console.log('--------------------------------------------------');

  // Step 1: Sign up a new test user (unauthorized role)
  const email = `unauthorized_test_${Math.floor(Math.random() * 1000000)}@example.com`;
  const password = 'TestSecurePassword123!';
  
  console.log(`1. Creating unauthorized test user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }
  const userId = signUpData.user?.id;
  console.log(`✅ User created! ID: ${userId}`);

  // Fetch a match ID to try updates on (e.g. match ID 1)
  const matchId = 1;

  // Test Case A: Unauthorized user attempts to update a match score
  console.log(`\n2. Testing Unauthorized User update on match ${matchId} (score fields)...`);
  const { error: errA } = await supabase
    .from('matches')
    .update({ actual_score_a: 3, actual_score_b: 2 })
    .eq('id', matchId);

  if (errA) {
    console.log(`✅ Success: Update blocked as expected. Message: "${errA.message}" | Code: ${errA.code}`);
  } else {
    console.error(`❌ Failure: Unauthorized user was allowed to update the score!`);
  }

  console.log('\n--------------------------------------------------');
  console.log('💡 Note on Score Editor Verification:');
  console.log('To verify score-editor restrictions, follow these steps:');
  console.log(`1. Run the migration SQL script in Supabase.`);
  console.log(`2. Execute this query to promote the user above to a Score Editor:`);
  console.log(`   UPDATE public.profiles SET is_score_editor = true WHERE id = '${userId}';`);
  console.log(`3. Re-run this script or use the browser console to test as this user:`);
  console.log(`   - Updating 'actual_score_a' to 2 should SUCCEED.`);
  console.log(`   - Updating 'deadline' to another date should FAIL with trigger exception:`);
  console.log(`     "Score editors are only allowed to update score-related fields..."`);
  console.log('--------------------------------------------------');
}

runValidation();
