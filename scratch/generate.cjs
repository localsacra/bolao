const fs = require('fs');
const path = require('path');

const userContent = fs.readFileSync(path.join(__dirname, 'user_fixtures.txt'), 'utf8');
const lines = userContent.split('\n');

let currentGroup = null;
const matches = [];

const dateMap = {
  'Thu, Jun 11': '2026-06-11',
  'Fri, Jun 12': '2026-06-12',
  'Sat, Jun 13': '2026-06-13',
  'Sun, Jun 14': '2026-06-14',
  'Mon, Jun 15': '2026-06-15',
  'Tue, Jun 16': '2026-06-16',
  'Wed, Jun 17': '2026-06-17',
  'Thu, Jun 18': '2026-06-18',
  'Fri, Jun 19': '2026-06-19',
  'Sat, Jun 20': '2026-06-20',
  'Sun, Jun 21': '2026-06-21',
  'Mon, Jun 22': '2026-06-22',
  'Tue, Jun 23': '2026-06-23',
  'Wed, Jun 24': '2026-06-24',
  'Thu, Jun 25': '2026-06-25',
  'Fri, Jun 26': '2026-06-26',
  'Sat, Jun 27': '2026-06-27'
};

const normalizeTeamName = (name) => {
  return name.replace(/^🇧🇷\s*/, '').trim();
};

const normalizeVenueName = (venue) => {
  return venue.trim()
    .replace('New York/NJ', 'New York/New Jersey')
    .replace('San Francisco', 'San Francisco Bay Area');
};

let matchCounter = {};

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  
  const groupHeaderMatch = line.match(/(?:GROUP\s+([A-L]))/i);
  if (groupHeaderMatch) {
    currentGroup = groupHeaderMatch[1];
    matchCounter[currentGroup] = 0;
    continue;
  }
  
  if (line.startsWith('Date') || line.startsWith('BRT') || line.includes('Match\tVenue') || line.includes('Match    Venue')) {
    continue;
  }
  
  const parts = line.split(/\t+/);
  let finalParts = parts;
  if (parts.length < 3) {
    finalParts = line.split(/\s{2,}/);
  }
  
  if (finalParts.length >= 4) {
    const dateStr = finalParts[0].trim();
    const timeStr = finalParts[1].trim();
    const matchStr = finalParts[2].trim();
    const venueCityStr = finalParts[3].trim();
    
    const vsParts = matchStr.split(/\s+vs\s+/i);
    if (vsParts.length === 2) {
      const homeTeam = normalizeTeamName(vsParts[0]);
      const awayTeam = normalizeTeamName(vsParts[1]);
      
      const commaIdx = venueCityStr.lastIndexOf(',');
      let venue = venueCityStr;
      let city = '';
      if (commaIdx !== -1) {
        venue = venueCityStr.substring(0, commaIdx).trim();
        city = venueCityStr.substring(commaIdx + 1).trim();
      }
      
      const mappedDate = dateMap[dateStr];
      if (!mappedDate) {
        console.error(`ERROR: Could not map date string: "${dateStr}"`);
        continue;
      }
      
      const matchDateStr = `${mappedDate}T${timeStr}:00-03:00`;
      matchCounter[currentGroup]++;
      const matchId = `${currentGroup}${matchCounter[currentGroup]}`;
      
      matches.push({
        id: matchId,
        group: currentGroup,
        homeTeam,
        awayTeam,
        matchDate: matchDateStr,
        venue: normalizeVenueName(venue),
        city: city.trim()
      });
    }
  }
}

console.log(`Generated ${matches.length} matches.`);

let code = `export interface Match {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // ISO 8601 with -03:00 offset (BRT)
  venue: string;
  city: string;
}

export const GROUP_STAGE_MATCHES: Match[] = [
`;

let lastGroup = null;
matches.forEach((m) => {
  if (m.group !== lastGroup) {
    if (lastGroup !== null) code += '\n';
    code += `  // ── GROUP ${m.group} ──────────────────────────────────────────────\n`;
    lastGroup = m.group;
  }
  code += `  { id: "${m.id}", group: "${m.group}", homeTeam: "${m.homeTeam}", awayTeam: "${m.awayTeam}", matchDate: "${m.matchDate}", venue: "${m.venue}", city: "${m.city}" },\n`;
});

code += `];\n`;

fs.writeFileSync(path.join(__dirname, '../src/data/matches2026.ts'), code);
console.log('Successfully wrote to matches2026.ts');
