export interface Match {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  utcDate: string; // ISO 8601 UTC
  venue: string;
  city: string;
}

export const GROUP_STAGE_MATCHES: Match[] = [

  // ── GROUP A ──────────────────────────────────────────────
  { id: "A1", group: "A", homeTeam: "Mexico",        awayTeam: "Ecuador",      utcDate: "2026-06-11T23:00:00Z", venue: "Azteca Stadium",         city: "Mexico City" },
  { id: "A2", group: "A", homeTeam: "USA",           awayTeam: "Canada",       utcDate: "2026-06-12T02:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "A3", group: "A", homeTeam: "Mexico",        awayTeam: "Canada",       utcDate: "2026-06-16T23:00:00Z", venue: "Azteca Stadium",         city: "Mexico City" },
  { id: "A4", group: "A", homeTeam: "USA",           awayTeam: "Ecuador",      utcDate: "2026-06-17T02:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "A5", group: "A", homeTeam: "Canada",        awayTeam: "Ecuador",      utcDate: "2026-06-21T22:00:00Z", venue: "BC Place",               city: "Vancouver" },
  { id: "A6", group: "A", homeTeam: "Mexico",        awayTeam: "USA",          utcDate: "2026-06-21T22:00:00Z", venue: "Azteca Stadium",         city: "Mexico City" },

  // ── GROUP B ──────────────────────────────────────────────
  { id: "B1", group: "B", homeTeam: "Argentina",     awayTeam: "Peru",         utcDate: "2026-06-12T22:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "B2", group: "B", homeTeam: "Chile",         awayTeam: "Australia",    utcDate: "2026-06-13T01:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "B3", group: "B", homeTeam: "Argentina",     awayTeam: "Chile",        utcDate: "2026-06-17T22:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },
  { id: "B4", group: "B", homeTeam: "Peru",          awayTeam: "Australia",    utcDate: "2026-06-18T01:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },
  { id: "B5", group: "B", homeTeam: "Argentina",     awayTeam: "Australia",    utcDate: "2026-06-22T22:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "B6", group: "B", homeTeam: "Chile",         awayTeam: "Peru",         utcDate: "2026-06-22T22:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },

  // ── GROUP C ──────────────────────────────────────────────
  { id: "C1", group: "C", homeTeam: "Brazil",        awayTeam: "Croatia",      utcDate: "2026-06-13T22:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "C2", group: "C", homeTeam: "Serbia",        awayTeam: "Japan",        utcDate: "2026-06-14T01:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },
  { id: "C3", group: "C", homeTeam: "Brazil",        awayTeam: "Serbia",       utcDate: "2026-06-18T22:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "C4", group: "C", homeTeam: "Croatia",       awayTeam: "Japan",        utcDate: "2026-06-19T01:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "C5", group: "C", homeTeam: "Brazil",        awayTeam: "Japan",        utcDate: "2026-06-23T22:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },
  { id: "C6", group: "C", homeTeam: "Croatia",       awayTeam: "Serbia",       utcDate: "2026-06-23T22:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },

  // ── GROUP D ──────────────────────────────────────────────
  { id: "D1", group: "D", homeTeam: "England",       awayTeam: "Senegal",      utcDate: "2026-06-14T22:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "D2", group: "D", homeTeam: "Netherlands",   awayTeam: "South Africa", utcDate: "2026-06-15T01:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "D3", group: "D", homeTeam: "England",       awayTeam: "Netherlands",  utcDate: "2026-06-19T22:00:00Z", venue: "Lincoln Financial Field",city: "Philadelphia" },
  { id: "D4", group: "D", homeTeam: "Senegal",       awayTeam: "South Africa", utcDate: "2026-06-20T01:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "D5", group: "D", homeTeam: "England",       awayTeam: "South Africa", utcDate: "2026-06-24T22:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "D6", group: "D", homeTeam: "Netherlands",   awayTeam: "Senegal",      utcDate: "2026-06-24T22:00:00Z", venue: "MetLife Stadium",        city: "New York" },

  // ── GROUP E ──────────────────────────────────────────────
  { id: "E1", group: "E", homeTeam: "Germany",       awayTeam: "Saudi Arabia", utcDate: "2026-06-15T22:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "E2", group: "E", homeTeam: "Colombia",      awayTeam: "Cameroon",     utcDate: "2026-06-16T01:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },
  { id: "E3", group: "E", homeTeam: "Germany",       awayTeam: "Colombia",     utcDate: "2026-06-20T22:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "E4", group: "E", homeTeam: "Saudi Arabia",  awayTeam: "Cameroon",     utcDate: "2026-06-21T01:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "E5", group: "E", homeTeam: "Germany",       awayTeam: "Cameroon",     utcDate: "2026-06-25T22:00:00Z", venue: "Lincoln Financial Field",city: "Philadelphia" },
  { id: "E6", group: "E", homeTeam: "Colombia",      awayTeam: "Saudi Arabia", utcDate: "2026-06-25T22:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },

  // ── GROUP F ──────────────────────────────────────────────
  { id: "F1", group: "F", homeTeam: "Portugal",      awayTeam: "Ivory Coast",  utcDate: "2026-06-15T19:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "F2", group: "F", homeTeam: "France",        awayTeam: "Algeria",      utcDate: "2026-06-15T22:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },
  { id: "F3", group: "F", homeTeam: "France",        awayTeam: "Portugal",     utcDate: "2026-06-20T19:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "F4", group: "F", homeTeam: "Algeria",       awayTeam: "Ivory Coast",  utcDate: "2026-06-20T22:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "F5", group: "F", homeTeam: "France",        awayTeam: "Ivory Coast",  utcDate: "2026-06-24T19:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "F6", group: "F", homeTeam: "Portugal",      awayTeam: "Algeria",      utcDate: "2026-06-24T19:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },

  // ── GROUP G ──────────────────────────────────────────────
  { id: "G1", group: "G", homeTeam: "Spain",         awayTeam: "Tunisia",      utcDate: "2026-06-16T19:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "G2", group: "G", homeTeam: "Morocco",       awayTeam: "South Korea",  utcDate: "2026-06-16T22:00:00Z", venue: "BC Place",               city: "Vancouver" },
  { id: "G3", group: "G", homeTeam: "Spain",         awayTeam: "Morocco",      utcDate: "2026-06-21T19:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },
  { id: "G4", group: "G", homeTeam: "Tunisia",       awayTeam: "South Korea",  utcDate: "2026-06-21T22:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "G5", group: "G", homeTeam: "Spain",         awayTeam: "South Korea",  utcDate: "2026-06-25T19:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "G6", group: "G", homeTeam: "Morocco",       awayTeam: "Tunisia",      utcDate: "2026-06-25T19:00:00Z", venue: "BC Place",               city: "Vancouver" },

  // ── GROUP H ──────────────────────────────────────────────
  { id: "H1", group: "H", homeTeam: "Belgium",       awayTeam: "Ukraine",      utcDate: "2026-06-17T19:00:00Z", venue: "Lincoln Financial Field",city: "Philadelphia" },
  { id: "H2", group: "H", homeTeam: "Uruguay",       awayTeam: "Iran",         utcDate: "2026-06-17T22:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "H3", group: "H", homeTeam: "Belgium",       awayTeam: "Uruguay",      utcDate: "2026-06-22T19:00:00Z", venue: "MetLife Stadium",        city: "New York" },
  { id: "H4", group: "H", homeTeam: "Ukraine",       awayTeam: "Iran",         utcDate: "2026-06-22T22:00:00Z", venue: "Lincoln Financial Field",city: "Philadelphia" },
  { id: "H5", group: "H", homeTeam: "Belgium",       awayTeam: "Iran",         utcDate: "2026-06-26T19:00:00Z", venue: "Gillette Stadium",       city: "Boston" },
  { id: "H6", group: "H", homeTeam: "Uruguay",       awayTeam: "Ukraine",      utcDate: "2026-06-26T19:00:00Z", venue: "Hard Rock Stadium",      city: "Miami" },

  // ── GROUP I ──────────────────────────────────────────────
  { id: "I1", group: "I", homeTeam: "Italy",         awayTeam: "Nigeria",      utcDate: "2026-06-18T19:00:00Z", venue: "BC Place",               city: "Vancouver" },
  { id: "I2", group: "I", homeTeam: "Switzerland",   awayTeam: "New Zealand",  utcDate: "2026-06-18T22:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },
  { id: "I3", group: "I", homeTeam: "Italy",         awayTeam: "Switzerland",  utcDate: "2026-06-23T19:00:00Z", venue: "SoFi Stadium",           city: "Los Angeles" },
  { id: "I4", group: "I", homeTeam: "Nigeria",       awayTeam: "New Zealand",  utcDate: "2026-06-23T22:00:00Z", venue: "BC Place",               city: "Vancouver" },
  { id: "I5", group: "I", homeTeam: "Italy",         awayTeam: "New Zealand",  utcDate: "2026-06-27T19:00:00Z", venue: "AT&T Stadium",           city: "Dallas" },
  { id: "I6", group: "I", homeTeam: "Switzerland",   awayTeam: "Nigeria",      utcDate: "2026-06-27T19:00:00Z", venue: "Levi's Stadium",         city: "San Francisco" },

  // ── GROUP J ──────────────────────────────────────────────
  { id: "J1", group: "J", homeTeam: "Netherlands",  awayTeam: "Senegal",      utcDate: "2026-06-19T19:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "J2", group: "J", homeTeam: "Denmark",      awayTeam: "Ghana",        utcDate: "2026-06-19T22:00:00Z", venue: "Hard Rock Stadium",       city: "Miami" },
  { id: "J3", group: "J", homeTeam: "Netherlands",  awayTeam: "Denmark",      utcDate: "2026-06-24T23:00:00Z", venue: "AT&T Stadium",            city: "Dallas" },
  { id: "J4", group: "J", homeTeam: "Senegal",      awayTeam: "Ghana",        utcDate: "2026-06-25T02:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "J5", group: "J", homeTeam: "Netherlands",  awayTeam: "Ghana",        utcDate: "2026-06-28T19:00:00Z", venue: "Gillette Stadium",        city: "Boston" },
  { id: "J6", group: "J", homeTeam: "Denmark",      awayTeam: "Senegal",      utcDate: "2026-06-28T19:00:00Z", venue: "Hard Rock Stadium",       city: "Miami" },

  // ── GROUP K ──────────────────────────────────────────────
  { id: "K1", group: "K", homeTeam: "Portugal",     awayTeam: "Hungary",      utcDate: "2026-06-20T23:00:00Z", venue: "BC Place",                city: "Vancouver" },
  { id: "K2", group: "K", homeTeam: "Qatar",        awayTeam: "Cuba",         utcDate: "2026-06-21T02:00:00Z", venue: "Azteca Stadium",          city: "Mexico City" },
  { id: "K3", group: "K", homeTeam: "Portugal",     awayTeam: "Qatar",        utcDate: "2026-06-25T23:00:00Z", venue: "MetLife Stadium",         city: "New York" },
  { id: "K4", group: "K", homeTeam: "Hungary",      awayTeam: "Cuba",         utcDate: "2026-06-26T02:00:00Z", venue: "BC Place",                city: "Vancouver" },
  { id: "K5", group: "K", homeTeam: "Portugal",     awayTeam: "Cuba",         utcDate: "2026-06-29T19:00:00Z", venue: "Levi's Stadium",          city: "San Francisco" },
  { id: "K6", group: "K", homeTeam: "Qatar",        awayTeam: "Hungary",      utcDate: "2026-06-29T19:00:00Z", venue: "Azteca Stadium",          city: "Mexico City" },

  // ── GROUP L ──────────────────────────────────────────────
  { id: "L1", group: "L", homeTeam: "Spain",        awayTeam: "Russia",       utcDate: "2026-06-21T23:00:00Z", venue: "SoFi Stadium",            city: "Los Angeles" },
  { id: "L2", group: "L", homeTeam: "Egypt",        awayTeam: "Indonesia",    utcDate: "2026-06-22T02:00:00Z", venue: "Levi's Stadium",          city: "San Francisco" },
  { id: "L3", group: "L", homeTeam: "Spain",        awayTeam: "Egypt",        utcDate: "2026-06-26T23:00:00Z", venue: "AT&T Stadium",            city: "Dallas" },
  { id: "L4", group: "L", homeTeam: "Russia",       awayTeam: "Indonesia",    utcDate: "2026-06-27T02:00:00Z", venue: "SoFi Stadium",            city: "Los Angeles" },
  { id: "L5", group: "L", homeTeam: "Spain",        awayTeam: "Indonesia",    utcDate: "2026-06-30T19:00:00Z", venue: "Hard Rock Stadium",       city: "Miami" },
  { id: "L6", group: "L", homeTeam: "Egypt",        awayTeam: "Russia",       utcDate: "2026-06-30T19:00:00Z", venue: "AT&T Stadium",            city: "Dallas" }
];
