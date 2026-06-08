export interface Match {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  utcDate: string; // ISO 8601 UTC
  deadline: string; // ISO 8601 UTC
  venue: string;
  city: string;
}

export const GROUP_STAGE_MATCHES: Match[] = [

  // ── GROUP A ──────────────────────────────────────────────
  { id: "A1", group: "A", homeTeam: "Mexico",         awayTeam: "South Africa",   utcDate: "2026-06-11T19:00:00Z", deadline: "2026-06-11T19:00:00Z", venue: "Estadio Azteca",        city: "Mexico City" },
  { id: "A2", group: "A", homeTeam: "Korea Republic", awayTeam: "Czechia",        utcDate: "2026-06-11T02:00:00Z", deadline: "2026-06-11T02:00:00Z", venue: "Estadio Guadalajara",   city: "Guadalajara" },
  { id: "A3", group: "A", homeTeam: "Czechia",        awayTeam: "South Africa",   utcDate: "2026-06-18T16:00:00Z", deadline: "2026-06-18T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "A4", group: "A", homeTeam: "Mexico",         awayTeam: "Korea Republic", utcDate: "2026-06-19T01:00:00Z", deadline: "2026-06-19T01:00:00Z", venue: "Estadio Guadalajara",   city: "Guadalajara" },
  { id: "A5", group: "A", homeTeam: "Czechia",        awayTeam: "Mexico",         utcDate: "2026-06-25T01:00:00Z", deadline: "2026-06-25T01:00:00Z", venue: "Estadio Azteca",        city: "Mexico City" },
  { id: "A6", group: "A", homeTeam: "South Africa",   awayTeam: "Korea Republic", utcDate: "2026-06-25T01:00:00Z", deadline: "2026-06-25T01:00:00Z", venue: "Estadio Monterrey",     city: "Monterrey" },

  // ── GROUP B ──────────────────────────────────────────────
  { id: "B1", group: "B", homeTeam: "Canada",                 awayTeam: "Bosnia and Herzegovina", utcDate: "2026-06-12T19:00:00Z", deadline: "2026-06-12T19:00:00Z", venue: "BMO Field",              city: "Toronto" },
  { id: "B2", group: "B", homeTeam: "Qatar",                  awayTeam: "Switzerland",            utcDate: "2026-06-13T19:00:00Z", deadline: "2026-06-13T19:00:00Z", venue: "Levi's Stadium",           city: "San Francisco" },
  { id: "B3", group: "B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Switzerland",            utcDate: "2026-06-18T19:00:00Z", deadline: "2026-06-18T19:00:00Z", venue: "SoFi Stadium",             city: "Inglewood" },
  { id: "B4", group: "B", homeTeam: "Canada",                 awayTeam: "Qatar",                  utcDate: "2026-06-18T22:00:00Z", deadline: "2026-06-18T22:00:00Z", venue: "BC Place",                 city: "Vancouver" },
  { id: "B5", group: "B", homeTeam: "Switzerland",            awayTeam: "Canada",                 utcDate: "2026-06-24T19:00:00Z", deadline: "2026-06-24T19:00:00Z", venue: "BC Place",                 city: "Vancouver" },
  { id: "B6", group: "B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar",                  utcDate: "2026-06-24T19:00:00Z", deadline: "2026-06-24T19:00:00Z", venue: "Lumen Field",              city: "Seattle" },

  // ── GROUP C ──────────────────────────────────────────────
  { id: "C1", group: "C", homeTeam: "Brazil",   awayTeam: "Morocco",  utcDate: "2026-06-13T22:00:00Z", deadline: "2026-06-13T22:00:00Z", venue: "MetLife Stadium",          city: "East Rutherford NJ" },
  { id: "C2", group: "C", homeTeam: "Haiti",    awayTeam: "Scotland", utcDate: "2026-06-14T01:00:00Z", deadline: "2026-06-14T01:00:00Z", venue: "Gillette Stadium",         city: "Boston" },
  { id: "C3", group: "C", homeTeam: "Scotland", awayTeam: "Morocco",  utcDate: "2026-06-19T22:00:00Z", deadline: "2026-06-19T22:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "C4", group: "C", homeTeam: "Brazil",   awayTeam: "Haiti",    utcDate: "2026-06-20T01:00:00Z", deadline: "2026-06-20T01:00:00Z", venue: "Gillette Stadium",         city: "Boston" },
  { id: "C5", group: "C", homeTeam: "Scotland", awayTeam: "Brazil",   utcDate: "2026-06-24T22:00:00Z", deadline: "2026-06-24T22:00:00Z", venue: "Hard Rock Stadium",        city: "Miami Gardens" },
  { id: "C6", group: "C", homeTeam: "Morocco",  awayTeam: "Haiti",    utcDate: "2026-06-24T22:00:00Z", deadline: "2026-06-24T22:00:00Z", venue: "Mercedes-Benz Stadium",   city: "Atlanta" },

  // ── GROUP D ──────────────────────────────────────────────
  { id: "D1", group: "D", homeTeam: "United States", awayTeam: "Paraguay",      utcDate: "2026-06-13T01:00:00Z", deadline: "2026-06-13T01:00:00Z", venue: "SoFi Stadium",     city: "Inglewood" },
  { id: "D2", group: "D", homeTeam: "Australia",     awayTeam: "Türkiye",       utcDate: "2026-06-13T04:00:00Z", deadline: "2026-06-13T04:00:00Z", venue: "BC Place",         city: "Vancouver" },
  { id: "D3", group: "D", homeTeam: "United States", awayTeam: "Australia",     utcDate: "2026-06-19T19:00:00Z", deadline: "2026-06-19T19:00:00Z", venue: "Lumen Field",      city: "Seattle" },
  { id: "D4", group: "D", homeTeam: "Türkiye",       awayTeam: "Paraguay",      utcDate: "2026-06-20T04:00:00Z", deadline: "2026-06-20T04:00:00Z", venue: "Levi's Stadium",     city: "Santa Clara" },
  { id: "D5", group: "D", homeTeam: "Türkiye",       awayTeam: "United States", utcDate: "2026-06-26T02:00:00Z", deadline: "2026-06-26T02:00:00Z", venue: "SoFi Stadium",     city: "Inglewood" },
  { id: "D6", group: "D", homeTeam: "Paraguay",      awayTeam: "Australia",     utcDate: "2026-06-26T02:00:00Z", deadline: "2026-06-26T02:00:00Z", venue: "Levi's Stadium",     city: "Santa Clara" },

  // ── GROUP E ──────────────────────────────────────────────
  { id: "E1", group: "E", homeTeam: "Germany",       awayTeam: "Curaçao",      utcDate: "2026-06-14T17:00:00Z", deadline: "2026-06-14T17:00:00Z", venue: "NRG Stadium",              city: "Houston" },
  { id: "E2", group: "E", homeTeam: "Côte d'Ivoire", awayTeam: "Ecuador",      utcDate: "2026-06-14T23:00:00Z", deadline: "2026-06-14T23:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "E3", group: "E", homeTeam: "Germany",       awayTeam: "Côte d'Ivoire", utcDate: "2026-06-20T20:00:00Z", deadline: "2026-06-20T20:00:00Z", venue: "BMO Field",              city: "Toronto" },
  { id: "E4", group: "E", homeTeam: "Ecuador",       awayTeam: "Curaçao",      utcDate: "2026-06-21T00:00:00Z", deadline: "2026-06-21T00:00:00Z", venue: "Arrowhead Stadium",         city: "Kansas City" },
  { id: "E5", group: "E", homeTeam: "Ecuador",       awayTeam: "Germany",      utcDate: "2026-06-25T20:00:00Z", deadline: "2026-06-25T20:00:00Z", venue: "MetLife Stadium",          city: "East Rutherford" },
  { id: "E6", group: "E", homeTeam: "Curaçao",       awayTeam: "Côte d'Ivoire", utcDate: "2026-06-25T20:00:00Z", deadline: "2026-06-25T20:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },

  // ── GROUP F ──────────────────────────────────────────────
  { id: "F1", group: "F", homeTeam: "Netherlands", awayTeam: "Japan",     utcDate: "2026-06-14T20:00:00Z", deadline: "2026-06-14T20:00:00Z", venue: "AT&T Stadium",      city: "Arlington TX" },
  { id: "F2", group: "F", homeTeam: "Sweden",      awayTeam: "Tunisia",   utcDate: "2026-06-15T02:00:00Z", deadline: "2026-06-15T02:00:00Z", venue: "Estadio Monterrey",  city: "Monterrey" },
  { id: "F3", group: "F", homeTeam: "Tunisia",     awayTeam: "Japan",     utcDate: "2026-06-20T17:00:00Z", deadline: "2026-06-20T17:00:00Z", venue: "Estadio Monterrey",  city: "Monterrey" },
  { id: "F4", group: "F", homeTeam: "Netherlands", awayTeam: "Sweden",    utcDate: "2026-06-21T04:00:00Z", deadline: "2026-06-21T04:00:00Z", venue: "NRG Stadium",          city: "Houston" },
  { id: "F5", group: "F", homeTeam: "Tunisia",     awayTeam: "Netherlands",utcDate: "2026-06-25T23:00:00Z", deadline: "2026-06-25T23:00:00Z", venue: "Arrowhead Stadium",    city: "Kansas City" },
  { id: "F6", group: "F", homeTeam: "Japan",       awayTeam: "Sweden",    utcDate: "2026-06-25T23:00:00Z", deadline: "2026-06-25T23:00:00Z", venue: "Arrowhead Stadium",    city: "Kansas City" },

  // ── GROUP G ──────────────────────────────────────────────
  { id: "G1", group: "G", homeTeam: "Belgium",     awayTeam: "Egypt",       utcDate: "2026-06-15T22:00:00Z", deadline: "2026-06-15T22:00:00Z", venue: "SoFi Stadium",  city: "Inglewood" },
  { id: "G2", group: "G", homeTeam: "Iran",        awayTeam: "New Zealand", utcDate: "2026-06-16T04:00:00Z", deadline: "2026-06-16T04:00:00Z", venue: "Lumen Field",   city: "Seattle" },
  { id: "G3", group: "G", homeTeam: "Belgium",     awayTeam: "Iran",        utcDate: "2026-06-21T19:00:00Z", deadline: "2026-06-21T19:00:00Z", venue: "SoFi Stadium",  city: "Inglewood" },
  { id: "G4", group: "G", homeTeam: "New Zealand", awayTeam: "Egypt",       utcDate: "2026-06-22T01:00:00Z", deadline: "2026-06-22T01:00:00Z", venue: "BC Place",      city: "Vancouver" },
  { id: "G5", group: "G", homeTeam: "New Zealand", awayTeam: "Belgium",     utcDate: "2026-06-27T03:00:00Z", deadline: "2026-06-27T03:00:00Z", venue: "Lumen Field",   city: "Seattle" },
  { id: "G6", group: "G", homeTeam: "Egypt",       awayTeam: "Iran",        utcDate: "2026-06-27T03:00:00Z", deadline: "2026-06-27T03:00:00Z", venue: "BC Place",      city: "Vancouver" },

  // ── GROUP H ──────────────────────────────────────────────
  { id: "H1", group: "H", homeTeam: "Spain",        awayTeam: "Cape Verde",   utcDate: "2026-06-15T16:00:00Z", deadline: "2026-06-15T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H2", group: "H", homeTeam: "Saudi Arabia", awayTeam: "Uruguay",      utcDate: "2026-06-15T22:00:00Z", deadline: "2026-06-15T22:00:00Z", venue: "Hard Rock Stadium",     city: "Miami Gardens" },
  { id: "H3", group: "H", homeTeam: "Spain",        awayTeam: "Saudi Arabia", utcDate: "2026-06-21T16:00:00Z", deadline: "2026-06-21T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H4", group: "H", homeTeam: "Uruguay",      awayTeam: "Cape Verde",   utcDate: "2026-06-21T22:00:00Z", deadline: "2026-06-21T22:00:00Z", venue: "Hard Rock Stadium",     city: "Miami Gardens" },
  { id: "H5", group: "H", homeTeam: "Uruguay",      awayTeam: "Spain",        utcDate: "2026-06-27T00:00:00Z", deadline: "2026-06-27T00:00:00Z", venue: "NRG Stadium",           city: "Houston" },
  { id: "H6", group: "H", homeTeam: "Cape Verde",   awayTeam: "Saudi Arabia", utcDate: "2026-06-27T00:00:00Z", deadline: "2026-06-27T00:00:00Z", venue: "Estadio Guadalajara",   city: "Guadalajara" },

  // ── GROUP I ──────────────────────────────────────────────
  { id: "I1", group: "I", homeTeam: "France",  awayTeam: "Senegal", utcDate: "2026-06-16T19:00:00Z", deadline: "2026-06-16T19:00:00Z", venue: "MetLife Stadium",          city: "East Rutherford" },
  { id: "I2", group: "I", homeTeam: "Iraq",    awayTeam: "Norway",  utcDate: "2026-06-16T22:00:00Z", deadline: "2026-06-16T22:00:00Z", venue: "Gillette Stadium",         city: "Boston" },
  { id: "I3", group: "I", homeTeam: "France",  awayTeam: "Iraq",    utcDate: "2026-06-22T21:00:00Z", deadline: "2026-06-22T21:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "I4", group: "I", homeTeam: "Norway",  awayTeam: "Senegal", utcDate: "2026-06-23T00:00:00Z", deadline: "2026-06-23T00:00:00Z", venue: "MetLife Stadium",          city: "East Rutherford" },
  { id: "I5", group: "I", homeTeam: "Norway",  awayTeam: "France",  utcDate: "2026-06-26T19:00:00Z", deadline: "2026-06-26T19:00:00Z", venue: "Gillette Stadium",         city: "Boston" },
  { id: "I6", group: "I", homeTeam: "Senegal", awayTeam: "Iraq",    utcDate: "2026-06-26T19:00:00Z", deadline: "2026-06-26T19:00:00Z", venue: "BMO Field",              city: "Toronto" },

  // ── GROUP J ──────────────────────────────────────────────
  { id: "J1", group: "J", homeTeam: "Argentina", awayTeam: "Algeria",   utcDate: "2026-06-17T01:00:00Z", deadline: "2026-06-17T01:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J2", group: "J", homeTeam: "Austria",   awayTeam: "Jordan",    utcDate: "2026-06-17T04:00:00Z", deadline: "2026-06-17T04:00:00Z", venue: "Levi's Stadium",      city: "Santa Clara" },
  { id: "J3", group: "J", homeTeam: "Argentina", awayTeam: "Austria",   utcDate: "2026-06-22T17:00:00Z", deadline: "2026-06-22T17:00:00Z", venue: "AT&T Stadium",       city: "Arlington TX" },
  { id: "J4", group: "J", homeTeam: "Jordan",    awayTeam: "Algeria",   utcDate: "2026-06-23T03:00:00Z", deadline: "2026-06-23T03:00:00Z", venue: "Levi's Stadium",      city: "Santa Clara" },
  { id: "J5", group: "J", homeTeam: "Jordan",    awayTeam: "Argentina", utcDate: "2026-06-28T02:00:00Z", deadline: "2026-06-28T02:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J6", group: "J", homeTeam: "Algeria",   awayTeam: "Austria",   utcDate: "2026-06-28T02:00:00Z", deadline: "2026-06-28T02:00:00Z", venue: "AT&T Stadium",       city: "Arlington TX" },

  // ── GROUP K ──────────────────────────────────────────────
  { id: "K1", group: "K", homeTeam: "Portugal",   awayTeam: "DR Congo",    utcDate: "2026-06-17T17:00:00Z", deadline: "2026-06-17T17:00:00Z", venue: "NRG Stadium",           city: "Houston" },
  { id: "K2", group: "K", homeTeam: "Uzbekistan", awayTeam: "Colombia",    utcDate: "2026-06-18T02:00:00Z", deadline: "2026-06-18T02:00:00Z", venue: "Estadio Azteca",        city: "Mexico City" },
  { id: "K3", group: "K", homeTeam: "Portugal",   awayTeam: "Uzbekistan",  utcDate: "2026-06-23T17:00:00Z", deadline: "2026-06-23T17:00:00Z", venue: "NRG Stadium",           city: "Houston" },
  { id: "K4", group: "K", homeTeam: "Colombia",   awayTeam: "DR Congo",    utcDate: "2026-06-24T02:00:00Z", deadline: "2026-06-24T02:00:00Z", venue: "Estadio Guadalajara",   city: "Guadalajara" },
  { id: "K5", group: "K", homeTeam: "Colombia",   awayTeam: "Portugal",    utcDate: "2026-06-28T23:30:00Z", deadline: "2026-06-28T23:30:00Z", venue: "Hard Rock Stadium",     city: "Miami Gardens" },
  { id: "K6", group: "K", homeTeam: "DR Congo",    awayTeam: "Uzbekistan",  utcDate: "2026-06-28T23:30:00Z", deadline: "2026-06-28T23:30:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // ── GROUP L ──────────────────────────────────────────────
  { id: "L1", group: "L", homeTeam: "England",  awayTeam: "Croatia", utcDate: "2026-06-17T20:00:00Z", deadline: "2026-06-17T20:00:00Z", venue: "AT&T Stadium",            city: "Arlington TX" },
  { id: "L2", group: "L", homeTeam: "Ghana",    awayTeam: "Panama",  utcDate: "2026-06-17T23:00:00Z", deadline: "2026-06-17T23:00:00Z", venue: "BMO Field",                 city: "Toronto" },
  { id: "L3", group: "L", homeTeam: "England",  awayTeam: "Ghana",   utcDate: "2026-06-23T20:00:00Z", deadline: "2026-06-23T20:00:00Z", venue: "Gillette Stadium",            city: "Boston" },
  { id: "L4", group: "L", homeTeam: "Panama",   awayTeam: "Croatia", utcDate: "2026-06-23T23:00:00Z", deadline: "2026-06-23T23:00:00Z", venue: "BMO Field",                 city: "Toronto" },
  { id: "L5", group: "L", homeTeam: "Panama",   awayTeam: "England", utcDate: "2026-06-27T21:00:00Z", deadline: "2026-06-27T21:00:00Z", venue: "MetLife Stadium",             city: "East Rutherford" },
  { id: "L6", group: "L", homeTeam: "Croatia",  awayTeam: "Ghana",   utcDate: "2026-06-27T21:00:00Z", deadline: "2026-06-27T21:00:00Z", venue: "Lincoln Financial Field",    city: "Philadelphia" }
];
