// src/utils/matchMapper.js

const stageRingMap = {
  LAST_32: 1, // Optional: if simulator has 32 teams round
  LAST_16: 2,
  QUARTER_FINALS: 3,
  SEMI_FINALS: 4,
  FINAL: 5,
};

export function findTeam(code, name, teams) {
  if (!code && !name) return null;
  const codeLower = (code || '').toUpperCase();
  const nameLower = (name || '').toUpperCase();
  
  return teams.find((t) => {
    const tIso = t.isoCode?.toUpperCase();
    const tName = t.name?.toUpperCase();
    return tIso === codeLower || tName === nameLower || tName === codeLower || tIso === nameLower ||
           (codeLower === 'GER' && tIso === 'DEU') || (codeLower === 'ENG' && tIso === 'GB-ENG') ||
           (codeLower === 'NED' && tIso === 'NLD') || (codeLower === 'POR' && tIso === 'PRT') ||
           (codeLower === 'CRO' && tIso === 'HRV') || (codeLower === 'SUI' && tIso === 'CHE') ||
           (codeLower === 'CIV' && tIso === 'CIV');
  }) || null;
}

export function mapMatchesToWinners(matches, teams) {
  const result = {};
  
  Object.entries(stageRingMap).forEach(([stage, ringIdx]) => {
    const stageMatches = matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => a.matchId - b.matchId);
      
    stageMatches.forEach((match, idx) => {
      const winnerCode = match.winnerCode;
      if (!winnerCode || match.status !== 'FINISHED') return;
      
      const team = findTeam(winnerCode, winnerCode, teams);
      if (!team) return;
      
      const pairKey = `${ringIdx}-${idx}`;
      result[pairKey] = team;
    });
  });
  return result;
}

export function groupMatchesByStage(matches) {
  const grouped = {
    LAST_32: [],
    LAST_16: [],
    QUARTER_FINALS: [],
    SEMI_FINALS: [],
    FINAL: []
  };

  matches.forEach(match => {
    if (grouped[match.stage]) {
      grouped[match.stage].push(match);
    }
  });

  // Sort each array by date or ID
  Object.keys(grouped).forEach(stage => {
    grouped[stage].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate) || a.matchId - b.matchId);
  });

  return grouped;
}
