// src/utils/matchMapper.js
/**
 * Map football-data.org knockout matches to the internal pairWinners structure.
 *
 * The internal state expects an object where each key is a pair identifier
 * "<ringIdx>-<pairIdx>" (e.g. "2-0" for the first Round‑of‑16 match) and the
 * value is a team object matching the shape used throughout the app:
 * `{ isoCode, name }`.
 *
 * @param {Array} matches - Array of normalized match objects from fetchKnockoutMatches.
 * @param {Array} teams   - DEFAULT_TEAMS array from ./teamsData.
 * @returns {Object} Mapping of pair keys to winning team objects.
 */
export function mapMatchesToWinners(matches, teams) {
  const findTeam = (code) => {
    const lowered = (code || '').toUpperCase();
    return teams.find((t) => t.isoCode?.toUpperCase() === lowered) ||
      teams.find((t) => t.name?.toUpperCase() === lowered) ||
      null;
  };

  const stageRingMap = {
    LAST_16: 2,
    QUARTER_FINALS: 3,
    SEMI_FINALS: 4,
    FINAL: 5,
  };

  const result = {};
  Object.entries(stageRingMap).forEach(([stage, ringIdx]) => {
    const stageMatches = matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => a.matchId - b.matchId);
    stageMatches.forEach((match, idx) => {
      const winnerCode = match.winnerCode;
      if (!winnerCode) return;
      const team = findTeam(winnerCode);
      if (!team) return;
      const pairKey = `${ringIdx}-${idx}`;
      result[pairKey] = team;
    });
  });
  return result;
}
