export interface Match {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // ISO 8601 with -03:00 offset (BRT)
  venue: string;
  city: string;
}

export const GROUP_STAGE_MATCHES: Match[] = [
  // ── GROUP A ──────────────────────────────────────────────
  { id: "A1", group: "A", homeTeam: "Mexico", awayTeam: "South Africa", matchDate: "2026-06-11T16:00:00-03:00", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "A2", group: "A", homeTeam: "South Korea", awayTeam: "Czechia", matchDate: "2026-06-11T23:00:00-03:00", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A3", group: "A", homeTeam: "Czechia", awayTeam: "South Africa", matchDate: "2026-06-18T13:00:00-03:00", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "A4", group: "A", homeTeam: "Mexico", awayTeam: "South Korea", matchDate: "2026-06-18T22:00:00-03:00", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A5", group: "A", homeTeam: "Czechia", awayTeam: "Mexico", matchDate: "2026-06-24T22:00:00-03:00", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "A6", group: "A", homeTeam: "South Africa", awayTeam: "South Korea", matchDate: "2026-06-24T22:00:00-03:00", venue: "Estadio BBVA", city: "Monterrey" },

  // ── GROUP B ──────────────────────────────────────────────
  { id: "B1", group: "B", homeTeam: "Canada", awayTeam: "Bosnia & Herzegovina", matchDate: "2026-06-12T16:00:00-03:00", venue: "BMO Field", city: "Toronto" },
  { id: "B2", group: "B", homeTeam: "Qatar", awayTeam: "Switzerland", matchDate: "2026-06-13T16:00:00-03:00", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "B3", group: "B", homeTeam: "Switzerland", awayTeam: "Bosnia & Herzegovina", matchDate: "2026-06-18T16:00:00-03:00", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "B4", group: "B", homeTeam: "Canada", awayTeam: "Qatar", matchDate: "2026-06-18T19:00:00-03:00", venue: "BC Place", city: "Vancouver" },
  { id: "B5", group: "B", homeTeam: "Switzerland", awayTeam: "Canada", matchDate: "2026-06-24T16:00:00-03:00", venue: "BC Place", city: "Vancouver" },
  { id: "B6", group: "B", homeTeam: "Bosnia & Herzegovina", awayTeam: "Qatar", matchDate: "2026-06-24T16:00:00-03:00", venue: "Lumen Field", city: "Seattle" },

  // ── GROUP C ──────────────────────────────────────────────
  { id: "C1", group: "C", homeTeam: "Brazil", awayTeam: "Morocco", matchDate: "2026-06-13T19:00:00-03:00", venue: "MetLife Stadium", city: "New York/NJ" },
  { id: "C2", group: "C", homeTeam: "Haiti", awayTeam: "Scotland", matchDate: "2026-06-13T22:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "C3", group: "C", homeTeam: "Scotland", awayTeam: "Morocco", matchDate: "2026-06-19T19:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "C4", group: "C", homeTeam: "Brazil", awayTeam: "Haiti", matchDate: "2026-06-19T22:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "C5", group: "C", homeTeam: "Scotland", awayTeam: "Brazil", matchDate: "2026-06-24T19:00:00-03:00", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "C6", group: "C", homeTeam: "Morocco", awayTeam: "Haiti", matchDate: "2026-06-24T19:00:00-03:00", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // ── GROUP D ──────────────────────────────────────────────
  { id: "D1", group: "D", homeTeam: "USA", awayTeam: "Paraguay", matchDate: "2026-06-12T22:00:00-03:00", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "D2", group: "D", homeTeam: "Australia", awayTeam: "Türkiye", matchDate: "2026-06-13T01:00:00-03:00", venue: "BC Place", city: "Vancouver" },
  { id: "D3", group: "D", homeTeam: "USA", awayTeam: "Australia", matchDate: "2026-06-19T16:00:00-03:00", venue: "Lumen Field", city: "Seattle" },
  { id: "D4", group: "D", homeTeam: "Türkiye", awayTeam: "Paraguay", matchDate: "2026-06-20T01:00:00-03:00", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "D5", group: "D", homeTeam: "Türkiye", awayTeam: "USA", matchDate: "2026-06-25T23:00:00-03:00", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "D6", group: "D", homeTeam: "Paraguay", awayTeam: "Australia", matchDate: "2026-06-25T23:00:00-03:00", venue: "Levi's Stadium", city: "San Francisco" },

  // ── GROUP E ──────────────────────────────────────────────
  { id: "E1", group: "E", homeTeam: "Germany", awayTeam: "Curaçao", matchDate: "2026-06-14T14:00:00-03:00", venue: "NRG Stadium", city: "Houston" },
  { id: "E2", group: "E", homeTeam: "Ivory Coast", awayTeam: "Ecuador", matchDate: "2026-06-14T20:00:00-03:00", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "E3", group: "E", homeTeam: "Germany", awayTeam: "Ivory Coast", matchDate: "2026-06-20T17:00:00-03:00", venue: "BMO Field", city: "Toronto" },
  { id: "E4", group: "E", homeTeam: "Ecuador", awayTeam: "Curaçao", matchDate: "2026-06-20T21:00:00-03:00", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "E5", group: "E", homeTeam: "Ecuador", awayTeam: "Germany", matchDate: "2026-06-25T17:00:00-03:00", venue: "MetLife Stadium", city: "New York/NJ" },
  { id: "E6", group: "E", homeTeam: "Curaçao", awayTeam: "Ivory Coast", matchDate: "2026-06-25T17:00:00-03:00", venue: "Lincoln Financial Field", city: "Philadelphia" },

  // ── GROUP F ──────────────────────────────────────────────
  { id: "F1", group: "F", homeTeam: "Netherlands", awayTeam: "Japan", matchDate: "2026-06-14T17:00:00-03:00", venue: "AT&T Stadium", city: "Dallas" },
  { id: "F2", group: "F", homeTeam: "Sweden", awayTeam: "Tunisia", matchDate: "2026-06-14T23:00:00-03:00", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F3", group: "F", homeTeam: "Netherlands", awayTeam: "Sweden", matchDate: "2026-06-20T14:00:00-03:00", venue: "NRG Stadium", city: "Houston" },
  { id: "F4", group: "F", homeTeam: "Tunisia", awayTeam: "Japan", matchDate: "2026-06-20T01:00:00-03:00", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F5", group: "F", homeTeam: "Tunisia", awayTeam: "Netherlands", matchDate: "2026-06-25T20:00:00-03:00", venue: "AT&T Stadium", city: "Dallas" },
  { id: "F6", group: "F", homeTeam: "Japan", awayTeam: "Sweden", matchDate: "2026-06-25T20:00:00-03:00", venue: "Arrowhead Stadium", city: "Kansas City" },

  // ── GROUP G ──────────────────────────────────────────────
  { id: "G1", group: "G", homeTeam: "Belgium", awayTeam: "Egypt", matchDate: "2026-06-15T16:00:00-03:00", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "G2", group: "G", homeTeam: "Iran", awayTeam: "New Zealand", matchDate: "2026-06-15T22:00:00-03:00", venue: "Lumen Field", city: "Seattle" },
  { id: "G3", group: "G", homeTeam: "Belgium", awayTeam: "Iran", matchDate: "2026-06-21T16:00:00-03:00", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "G4", group: "G", homeTeam: "New Zealand", awayTeam: "Egypt", matchDate: "2026-06-21T22:00:00-03:00", venue: "BC Place", city: "Vancouver" },
  { id: "G5", group: "G", homeTeam: "New Zealand", awayTeam: "Belgium", matchDate: "2026-06-26T21:00:00-03:00", venue: "Lumen Field", city: "Seattle" },
  { id: "G6", group: "G", homeTeam: "Egypt", awayTeam: "Iran", matchDate: "2026-06-26T21:00:00-03:00", venue: "BC Place", city: "Vancouver" },

  // ── GROUP H ──────────────────────────────────────────────
  { id: "H1", group: "H", homeTeam: "Spain", awayTeam: "Cape Verde", matchDate: "2026-06-15T13:00:00-03:00", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H2", group: "H", homeTeam: "Saudi Arabia", awayTeam: "Uruguay", matchDate: "2026-06-15T19:00:00-03:00", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "H3", group: "H", homeTeam: "Spain", awayTeam: "Saudi Arabia", matchDate: "2026-06-21T13:00:00-03:00", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H4", group: "H", homeTeam: "Uruguay", awayTeam: "Cape Verde", matchDate: "2026-06-21T19:00:00-03:00", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "H5", group: "H", homeTeam: "Uruguay", awayTeam: "Spain", matchDate: "2026-06-26T21:00:00-03:00", venue: "NRG Stadium", city: "Houston" },
  { id: "H6", group: "H", homeTeam: "Cape Verde", awayTeam: "Saudi Arabia", matchDate: "2026-06-26T21:00:00-03:00", venue: "Estadio Akron", city: "Guadalajara" },

  // ── GROUP I ──────────────────────────────────────────────
  { id: "I1", group: "I", homeTeam: "France", awayTeam: "Senegal", matchDate: "2026-06-16T16:00:00-03:00", venue: "MetLife Stadium", city: "New York/NJ" },
  { id: "I2", group: "I", homeTeam: "Iraq", awayTeam: "Norway", matchDate: "2026-06-16T19:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "I3", group: "I", homeTeam: "France", awayTeam: "Iraq", matchDate: "2026-06-22T18:00:00-03:00", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "I4", group: "I", homeTeam: "Norway", awayTeam: "Senegal", matchDate: "2026-06-22T21:00:00-03:00", venue: "MetLife Stadium", city: "New York/NJ" },
  { id: "I5", group: "I", homeTeam: "Norway", awayTeam: "France", matchDate: "2026-06-26T16:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "I6", group: "I", homeTeam: "Senegal", awayTeam: "Iraq", matchDate: "2026-06-26T16:00:00-03:00", venue: "BMO Field", city: "Toronto" },

  // ── GROUP J ──────────────────────────────────────────────
  { id: "J1", group: "J", homeTeam: "Argentina", awayTeam: "Algeria", matchDate: "2026-06-16T22:00:00-03:00", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J2", group: "J", homeTeam: "Austria", awayTeam: "Jordan", matchDate: "2026-06-17T01:00:00-03:00", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "J3", group: "J", homeTeam: "Argentina", awayTeam: "Austria", matchDate: "2026-06-22T14:00:00-03:00", venue: "AT&T Stadium", city: "Dallas" },
  { id: "J4", group: "J", homeTeam: "Jordan", awayTeam: "Algeria", matchDate: "2026-06-23T00:00:00-03:00", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "J5", group: "J", homeTeam: "Jordan", awayTeam: "Argentina", matchDate: "2026-06-27T23:00:00-03:00", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J6", group: "J", homeTeam: "Algeria", awayTeam: "Austria", matchDate: "2026-06-27T23:00:00-03:00", venue: "AT&T Stadium", city: "Dallas" },

  // ── GROUP K ──────────────────────────────────────────────
  { id: "K1", group: "K", homeTeam: "Portugal", awayTeam: "DR Congo", matchDate: "2026-06-17T14:00:00-03:00", venue: "NRG Stadium", city: "Houston" },
  { id: "K2", group: "K", homeTeam: "Uzbekistan", awayTeam: "Colombia", matchDate: "2026-06-17T23:00:00-03:00", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "K3", group: "K", homeTeam: "Portugal", awayTeam: "Uzbekistan", matchDate: "2026-06-23T14:00:00-03:00", venue: "NRG Stadium", city: "Houston" },
  { id: "K4", group: "K", homeTeam: "Colombia", awayTeam: "DR Congo", matchDate: "2026-06-23T23:00:00-03:00", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "K5", group: "K", homeTeam: "Colombia", awayTeam: "Portugal", matchDate: "2026-06-27T20:30:00-03:00", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "K6", group: "K", homeTeam: "DR Congo", awayTeam: "Uzbekistan", matchDate: "2026-06-27T20:30:00-03:00", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // ── GROUP L ──────────────────────────────────────────────
  { id: "L1", group: "L", homeTeam: "England", awayTeam: "Croatia", matchDate: "2026-06-17T17:00:00-03:00", venue: "AT&T Stadium", city: "Dallas" },
  { id: "L2", group: "L", homeTeam: "Ghana", awayTeam: "Panama", matchDate: "2026-06-17T20:00:00-03:00", venue: "BMO Field", city: "Toronto" },
  { id: "L3", group: "L", homeTeam: "England", awayTeam: "Ghana", matchDate: "2026-06-23T17:00:00-03:00", venue: "Gillette Stadium", city: "Boston" },
  { id: "L4", group: "L", homeTeam: "Panama", awayTeam: "Croatia", matchDate: "2026-06-23T20:00:00-03:00", venue: "BMO Field", city: "Toronto" },
  { id: "L5", group: "L", homeTeam: "Panama", awayTeam: "England", matchDate: "2026-06-27T18:00:00-03:00", venue: "MetLife Stadium", city: "New York/NJ" },
  { id: "L6", group: "L", homeTeam: "Croatia", awayTeam: "Ghana", matchDate: "2026-06-27T18:00:00-03:00", venue: "Lincoln Financial Field", city: "Philadelphia" },
];
