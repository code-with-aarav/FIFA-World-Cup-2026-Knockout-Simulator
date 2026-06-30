// src/api/footballData.js
// Fetch knockout stage matches for FIFA World Cup 2026 using football-data.org free tier API

export async function fetchKnockoutMatches() {
  const endpoint = '/api/fifa';
  const response = await fetch(endpoint);

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Football-Data API error ${response.status}: ${txt}`);
  }

  const data = await response.json();
  
  const matches = (data.matches || []).map((m) => {
    const homeTeam = m.homeTeam || {};
    const awayTeam = m.awayTeam || {};
    const score = m.score || { fullTime: { home: null, away: null }, halfTime: { home: null, away: null }, extraTime: { home: null, away: null }, penalties: { home: null, away: null } };
    
    let winnerCode = null;
    if (m.status === 'FINISHED') {
      if (score.winner === 'HOME_TEAM') winnerCode = homeTeam.tla || homeTeam.name;
      else if (score.winner === 'AWAY_TEAM') winnerCode = awayTeam.tla || awayTeam.name;
      else if (score.fullTime && score.fullTime.home > score.fullTime.away) winnerCode = homeTeam.tla || homeTeam.name;
      else if (score.fullTime && score.fullTime.away > score.fullTime.home) winnerCode = awayTeam.tla || awayTeam.name;
      else if (score.penalties && score.penalties.home > score.penalties.away) winnerCode = homeTeam.tla || homeTeam.name;
      else if (score.penalties && score.penalties.away > score.penalties.home) winnerCode = awayTeam.tla || awayTeam.name;
    }

    return {
      matchId: m.id,
      stage: m.stage,
      status: m.status,
      utcDate: m.utcDate,
      venue: m.venue || null,
      minute: m.minute || null,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        shortName: homeTeam.shortName,
        tla: homeTeam.tla,
        crest: homeTeam.crest
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        shortName: awayTeam.shortName,
        tla: awayTeam.tla,
        crest: awayTeam.crest
      },
      score: score,
      winnerCode: winnerCode
    };
  });

  return matches;
}
