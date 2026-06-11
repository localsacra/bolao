const fs = require('fs');
const path = require('path');

// Normalize team names for comparison
function normalizeTeam(name) {
  if (!name) return '';
  name = name.trim().replace(/^🇧🇷\s*/, ''); // strip flags
  if (name === "South Korea") return "Korea Republic";
  if (name === "Bosnia & Herzegovina") return "Bosnia and Herzegovina";
  if (name === "Ivory Coast") return "Côte d'Ivoire";
  if (name === "USA") return "United States";
  return name;
}

// Convert user's date + time in BRT (UTC-3) to a UTC ISO string
function parseUserDateTime(dateStr, timeStr) {
  const monthNames = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
  const match = dateStr.match(/(?:[A-Za-z]+),\s*([A-Za-z]+)\s*(\d+)/);
  if (!match) return null;
  const month = monthNames[match[1]];
  const day = parseInt(match[2], 10);
  
  const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
  if (!timeMatch) return null;
  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  
  // BRT is UTC-3, so UTC time = BRT + 3 hours
  const utcMillis = Date.UTC(2026, month, day, hour + 3, minute);
  const d = new Date(utcMillis);
  return d.toISOString().replace('.000Z', 'Z');
}

// Normalize venue names
function normalizeVenue(venue) {
  if (!venue) return '';
  return venue.trim()
    .replace("Estadio Guadalajara", "Estadio Akron")
    .replace("Estadio Monterrey", "Estadio BBVA")
    .replace("MetLife Stadium", "MetLife Stadium")
    .replace("Gillette Stadium", "Gillette Stadium")
    .replace("Lincoln Financial Field", "Lincoln Financial Field")
    .replace("Hard Rock Stadium", "Hard Rock Stadium")
    .replace("Mercedes-Benz Stadium", "Mercedes-Benz Stadium")
    .replace("SoFi Stadium", "SoFi Stadium")
    .replace("Levi's Stadium", "Levi's Stadium")
    .replace("BC Place", "BC Place")
    .replace("Lumen Field", "Lumen Field")
    .replace("NRG Stadium", "NRG Stadium")
    .replace("Arrowhead Stadium", "Arrowhead Stadium")
    .replace("AT&T Stadium", "AT&T Stadium")
    .replace("BMO Field", "BMO Field");
}

// Parse codebase matches2026.ts
const codeFileContent = fs.readFileSync(path.join(__dirname, '../src/data/matches2026.ts'), 'utf8');
const lines = codeFileContent.split('\n');
const codeMatches = [];

for (const line of lines) {
  if (line.includes('id:') && line.includes('group:')) {
    const getVal = (field) => {
      const regex = new RegExp(field + '\\s*:\\s*"([^"]+)"');
      const match = line.match(regex);
      return match ? match[1] : null;
    };
    const id = getVal('id');
    const group = getVal('group');
    const homeTeam = getVal('homeTeam');
    const awayTeam = getVal('awayTeam');
    const utcDate = getVal('utcDate');
    const deadline = getVal('deadline');
    const venue = getVal('venue');
    const city = getVal('city');
    if (id && group && homeTeam && awayTeam) {
      codeMatches.push({ id, group, homeTeam, awayTeam, utcDate, deadline, venue, city, rawLine: line.trim() });
    }
  }
}

console.log(`Parsed ${codeMatches.length} matches from matches2026.ts`);

// Parse user_fixtures.txt
const userContent = fs.readFileSync(path.join(__dirname, 'user_fixtures.txt'), 'utf8');
const userLines = userContent.split('\n');

let currentGroup = null;
const userMatches = [];

for (let line of userLines) {
  line = line.trim();
  if (!line) continue;
  
  const groupHeaderMatch = line.match(/(?:GROUP\s+([A-L]))/i);
  if (groupHeaderMatch) {
    currentGroup = groupHeaderMatch[1];
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
      const homeTeam = vsParts[0].trim();
      const awayTeam = vsParts[1].trim();
      
      const commaIdx = venueCityStr.lastIndexOf(',');
      let venue = venueCityStr;
      let city = '';
      if (commaIdx !== -1) {
        venue = venueCityStr.substring(0, commaIdx).trim();
        city = venueCityStr.substring(commaIdx + 1).trim();
      }
      
      userMatches.push({
        group: currentGroup,
        rawDate: dateStr,
        rawTime: timeStr,
        utcDate: parseUserDateTime(dateStr, timeStr),
        homeTeam,
        awayTeam,
        venue,
        city
      });
    }
  }
}

console.log(`Parsed ${userMatches.length} matches from user_fixtures.txt`);

// Match them up and report discrepancies
const discrepancies = [];

userMatches.forEach((userMatch) => {
  // Find matching fixture in code by matching normalized teams and group
  const normHome = normalizeTeam(userMatch.homeTeam);
  const normAway = normalizeTeam(userMatch.awayTeam);
  
  // Find a match where either (home == home and away == away) or (home == away and away == home)
  // Let's assume order matches.
  const codeMatch = codeMatches.find(m => 
    m.group === userMatch.group &&
    ((normalizeTeam(m.homeTeam) === normHome && normalizeTeam(m.awayTeam) === normAway) ||
     (normalizeTeam(m.homeTeam) === normAway && normalizeTeam(m.awayTeam) === normHome))
  );
  
  if (!codeMatch) {
    discrepancies.push({
      type: 'MISSING_MATCH',
      details: `No match found in codebase for Group ${userMatch.group}: ${userMatch.homeTeam} vs ${userMatch.awayTeam}`
    });
    return;
  }
  
  // Check team order
  if (normalizeTeam(codeMatch.homeTeam) !== normHome || normalizeTeam(codeMatch.awayTeam) !== normAway) {
    discrepancies.push({
      type: 'TEAM_ORDER_MISMATCH',
      id: codeMatch.id,
      details: `Order mismatch: User has "${userMatch.homeTeam} (home) vs ${userMatch.awayTeam} (away)", Code has "${codeMatch.homeTeam} (home) vs ${codeMatch.awayTeam} (away)"`
    });
  }
  
  // Check date/time
  if (codeMatch.utcDate !== userMatch.utcDate) {
    discrepancies.push({
      type: 'DATE_TIME_MISMATCH',
      id: codeMatch.id,
      details: `Date/Time mismatch for ${userMatch.homeTeam} vs ${userMatch.awayTeam}: User has ${userMatch.rawDate} ${userMatch.rawTime} BRT (${userMatch.utcDate}), Code has ${codeMatch.utcDate}`
    });
  }
  
  // Check venue name (normalized)
  const normUserVenue = normalizeVenue(userMatch.venue);
  const normCodeVenue = normalizeVenue(codeMatch.venue);
  if (normUserVenue !== normCodeVenue) {
    discrepancies.push({
      type: 'VENUE_MISMATCH',
      id: codeMatch.id,
      details: `Venue mismatch for ${userMatch.homeTeam} vs ${userMatch.awayTeam}: User has "${userMatch.venue}", Code has "${codeMatch.venue}"`
    });
  }
  
  // Check city name (case-insensitive, basic normalize)
  const normUserCity = userMatch.city.toLowerCase().replace(/ gardens| east| west| north| south/g, '').trim();
  const normCodeCity = codeMatch.city.toLowerCase().replace(/ gardens| east| west| north| south/g, '').trim();
  if (normUserCity !== normCodeCity) {
    discrepancies.push({
      type: 'CITY_MISMATCH',
      id: codeMatch.id,
      details: `City mismatch for ${userMatch.homeTeam} vs ${userMatch.awayTeam}: User has "${userMatch.city}", Code has "${codeMatch.city}"`
    });
  }
});

// Check if any codebase matches were not matched
codeMatches.forEach(codeMatch => {
  const normHome = normalizeTeam(codeMatch.homeTeam);
  const normAway = normalizeTeam(codeMatch.awayTeam);
  const userMatch = userMatches.find(m =>
    m.group === codeMatch.group &&
    ((normalizeTeam(m.homeTeam) === normHome && normalizeTeam(m.awayTeam) === normAway) ||
     (normalizeTeam(m.homeTeam) === normAway && normalizeTeam(m.awayTeam) === normHome))
  );
  if (!userMatch) {
    discrepancies.push({
      type: 'EXTRA_CODE_MATCH',
      id: codeMatch.id,
      details: `Codebase contains match ${codeMatch.id} (${codeMatch.homeTeam} vs ${codeMatch.awayTeam} in Group ${codeMatch.group}) which is not in user list.`
    });
  }
});

console.log('\n❌ DISCREPANCIES FOUND:');
console.log('======================');
if (discrepancies.length === 0) {
  console.log('None! All matches match perfectly.');
} else {
  discrepancies.forEach(d => {
    console.log(`[${d.type}]${d.id ? ' (ID: ' + d.id + ')' : ''}: ${d.details}`);
  });
}
