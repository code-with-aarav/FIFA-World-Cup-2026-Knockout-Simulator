import React from 'react';
import { MatchCard } from './MatchCard';
import './MatchSchedule.css';

const STAGE_NAMES = {
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final'
};

const STAGE_ORDER = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

export const MatchSchedule = React.memo(({ groupedMatches, loading, error }) => {
  
  if (error) {
    return (
      <div className="match-schedule">
        <div className="match-schedule__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="match-schedule">
      <div className="match-schedule__header-sticky">
        <h2 className="match-schedule__title">Live Schedule</h2>
        {loading && <span className="match-schedule__loading-spinner"></span>}
      </div>
      
      <div className="match-schedule__content">
        {loading && Object.keys(groupedMatches).length === 0 ? (
          <div className="match-schedule__skeleton-container">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="match-schedule__skeleton-card"></div>
            ))}
          </div>
        ) : Object.keys(groupedMatches).length === 0 ? (
          <div className="match-schedule__empty">
            <svg className="match-schedule__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p className="match-schedule__empty-text">No knockout matches scheduled yet.</p>
            <p className="match-schedule__empty-subtext">Official fixtures will appear here automatically once the tournament progresses.</p>
          </div>
        ) : (
          STAGE_ORDER.map(stage => {
            const stageMatches = groupedMatches[stage];
            if (!stageMatches || stageMatches.length === 0) return null;
            
            return (
              <div key={stage} className="match-schedule__stage-group">
                <h3 className="match-schedule__stage-title">{STAGE_NAMES[stage] || stage}</h3>
                <div className="match-schedule__matches">
                  {stageMatches.map(match => (
                    <MatchCard key={match.matchId} match={match} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
