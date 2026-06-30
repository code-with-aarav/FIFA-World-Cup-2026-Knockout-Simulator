import React, { useState, useEffect } from 'react';
import { StatusBadge } from './StatusBadge';
import { DEFAULT_TEAMS } from '../../teamsData';

const getFlagUrl = (teamCode) => {
  if (!teamCode) return '';
  const team = DEFAULT_TEAMS.find(t => t.isoCode === teamCode || t.name === teamCode || t.isoCode?.toUpperCase() === teamCode?.toUpperCase());
  if (team) {
    return new URL(`../../assets/flags/${team.isoCode}.svg`, import.meta.url).href;
  }
  return ''; // fallback placeholder
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getCountdown = (dateStr) => {
  if (!dateStr) return '';
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return '';
  
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / 1000 / 60) % 60);
  
  if (d > 0) return `Starts in ${d}d ${h}h`;
  if (h > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${m}m`;
};

export const MatchCard = React.memo(({ match }) => {
  const [countdown, setCountdown] = useState(getCountdown(match.utcDate));

  useEffect(() => {
    if (match.status !== 'SCHEDULED' && match.status !== 'TIMED') return;
    
    const interval = setInterval(() => {
      setCountdown(getCountdown(match.utcDate));
    }, 60000); // update every minute
    
    return () => clearInterval(interval);
  }, [match.status, match.utcDate]);

  const homeFlag = getFlagUrl(match.homeTeam.tla || match.homeTeam.name);
  const awayFlag = getFlagUrl(match.awayTeam.tla || match.awayTeam.name);
  
  const homeName = match.homeTeam.shortName || match.homeTeam.name || 'TBD';
  const awayName = match.awayTeam.shortName || match.awayTeam.name || 'TBD';

  return (
    <div className="match-card">
      <div className="match-card__header">
        <StatusBadge status={match.status} minute={match.minute} />
        <span className="match-card__time">
          {match.status === 'SCHEDULED' || match.status === 'TIMED' ? countdown || formatTime(match.utcDate) : formatTime(match.utcDate)}
        </span>
      </div>
      
      <div className="match-card__teams">
        <div className={`match-card__team ${match.winnerCode === (match.homeTeam.tla || match.homeTeam.name) ? 'match-card__team--winner' : ''}`}>
          <div className="match-card__team-info">
            {homeFlag ? <img src={homeFlag} alt={homeName} className="match-card__flag" /> : <div className="match-card__flag-placeholder"></div>}
            <span className="match-card__team-name">{homeName}</span>
          </div>
          <span className="match-card__score">{match.score.fullTime?.home ?? '-'}</span>
        </div>
        
        <div className={`match-card__team ${match.winnerCode === (match.awayTeam.tla || match.awayTeam.name) ? 'match-card__team--winner' : ''}`}>
          <div className="match-card__team-info">
            {awayFlag ? <img src={awayFlag} alt={awayName} className="match-card__flag" /> : <div className="match-card__flag-placeholder"></div>}
            <span className="match-card__team-name">{awayName}</span>
          </div>
          <span className="match-card__score">{match.score.fullTime?.away ?? '-'}</span>
        </div>
      </div>
      
      {match.venue && (
        <div className="match-card__footer">
          <svg className="match-card__venue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="match-card__venue">{match.venue}</span>
        </div>
      )}
    </div>
  );
});
