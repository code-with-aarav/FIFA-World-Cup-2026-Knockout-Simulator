// src/api/footballData.js
// Fetch knockout stage matches for FIFA World Cup 2026 using football-data.org free tier API

export async function fetchKnockoutMatches() {
  const apiKey = import.meta.env.VITE_FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_FOOTBALL_DATA_API_KEY environment variable');
  }

  // Competition code for FIFA World Cup (WC). The 2026 edition is identified by the year; the API uses the same code.
  const endpoint = 'https://api.football-data.org/v4/competitions/WC/matches?stage=knockout';
  const response = await fetch(endpoint, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Football-Data API error ${response.status}: ${txt}`);
  }

  const data = await response.json();
  // Expected shape: { matches: [ { id, stage, homeTeam: { id, name, shortName, tla }, awayTeam: {...}, score: { fullTime: { home, away } } } ] }
  // Normalize to a simple array of objects we can map later.
  const matches = (data.matches || []).map((m) => ({
    matchId: m.id,
    stage: m.stage, // e.g., "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"
    homeCode: m.homeTeam.tla || m.homeTeam.name,
    awayCode: m.awayTeam.tla || m.awayTeam.name,
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    winnerCode:
      m.score.fullTime.home > m.score.fullTime.away
        ? m.homeTeam.tla || m.homeTeam.name
        : m.score.fullTime.away > m.score.fullTime.home
        ? m.awayTeam.tla || m.awayTeam.name
        : null,
  }));

  return matches;
}
