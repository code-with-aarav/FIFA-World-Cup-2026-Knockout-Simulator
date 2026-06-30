import { fetchKnockoutMatches } from '../api/footballData.js';
import { mapMatchesToWinners, groupMatchesByStage } from '../utils/matchMapper.js';
import { DEFAULT_TEAMS } from '../teamsData.js';

export const tournamentService = {
  async getTournamentData() {
    const rawMatches = await fetchKnockoutMatches();
    
    const groupedMatches = groupMatchesByStage(rawMatches);
    const officialWinners = mapMatchesToWinners(rawMatches, DEFAULT_TEAMS);
    
    return {
      matches: rawMatches,
      groupedMatches,
      officialWinners,
      lastUpdated: new Date().toISOString()
    };
  }
};
