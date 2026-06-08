import { GROUP_STAGE_MATCHES } from '../src/data/matches2026';
import { getFlagCode } from '../src/utils/flagCode';

console.log('⚽ Starting FIFA World Cup 2026 Match Data Validation...\n');

const errors: string[] = [];
const groups = new Set<string>();
const groupTeams: Record<string, Set<string>> = {};
const allTeams = new Set<string>();
const teamToGroup: Record<string, string> = {};

// Verify total match count
if (GROUP_STAGE_MATCHES.length !== 72) {
  errors.push(`Total match count is ${GROUP_STAGE_MATCHES.length}, expected 72.`);
}

GROUP_STAGE_MATCHES.forEach((match, index) => {
  const matchDesc = `Match #${index + 1} (${match.id}: ${match.homeTeam} vs ${match.awayTeam})`;

  // Verify group names are valid
  if (!match.group || !/^[A-L]$/.test(match.group)) {
    errors.push(`${matchDesc} has invalid group "${match.group}". Expected A-L.`);
  } else {
    groups.add(match.group);
    if (!groupTeams[match.group]) {
      groupTeams[match.group] = new Set();
    }
    groupTeams[match.group].add(match.homeTeam);
    groupTeams[match.group].add(match.awayTeam);
  }

  // Record teams and check group consistency
  [match.homeTeam, match.awayTeam].forEach(team => {
    allTeams.add(team);
    if (teamToGroup[team] && teamToGroup[team] !== match.group) {
      errors.push(`Team "${team}" is assigned to Group ${match.group} but was previously seen in Group ${teamToGroup[team]}.`);
    }
    teamToGroup[team] = match.group;
  });

  // Verify ISO date/time format (kickoff and deadline)
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  if (!dateRegex.test(match.utcDate)) {
    errors.push(`${matchDesc} has invalid utcDate "${match.utcDate}". Expected ISO 8601 UTC format.`);
  }
  if (!dateRegex.test(match.deadline)) {
    errors.push(`${matchDesc} has invalid deadline "${match.deadline}". Expected ISO 8601 UTC format.`);
  }

  // Verify deadline matches utcDate
  if (match.utcDate !== match.deadline) {
    errors.push(`${matchDesc} has mismatch between utcDate (${match.utcDate}) and deadline (${match.deadline}).`);
  }

  // Verify city and venue are populated
  if (!match.city || match.city.trim() === '') {
    errors.push(`${matchDesc} has empty city.`);
  }
  if (!match.venue || match.venue.trim() === '') {
    errors.push(`${matchDesc} has empty venue.`);
  }
});

// Check groups and teams count
if (groups.size !== 12) {
  errors.push(`Found ${groups.size} unique groups, expected 12 (A-L).`);
}

Object.entries(groupTeams).forEach(([group, teams]) => {
  if (teams.size !== 4) {
    errors.push(`Group ${group} has ${teams.size} teams: [${Array.from(teams).join(', ')}]. Expected exactly 4.`);
  }

  // Check that the group has exactly 6 matches
  const groupMatches = GROUP_STAGE_MATCHES.filter(m => m.group === group);
  if (groupMatches.length !== 6) {
    errors.push(`Group ${group} has ${groupMatches.length} matches, expected exactly 6.`);
  }
});

if (allTeams.size !== 48) {
  errors.push(`Found ${allTeams.size} unique teams, expected exactly 48.`);
}

// Verify flag code mappings
allTeams.forEach(team => {
  const code = getFlagCode(team);
  if (code === 'un') {
    errors.push(`Team "${team}" has no flag code mapping in flagCode.ts (returned "un").`);
  }
});

console.log('📊 Validation Report Summary:');
console.log('-----------------------------');
console.log(`- Unique Groups: ${groups.size} (Expected: 12)`);
console.log(`- Unique Teams:  ${allTeams.size} (Expected: 48)`);
console.log(`- Total Matches: ${GROUP_STAGE_MATCHES.length} (Expected: 72)`);
console.log('-----------------------------');

if (errors.length > 0) {
  console.error(`❌ Validation FAILED with ${errors.length} error(s):`);
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Validation PASSED! All checks succeeded with 0 errors.');
  process.exit(0);
}
