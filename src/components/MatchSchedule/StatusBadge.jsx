import React from 'react';

export const StatusBadge = ({ status, minute }) => {
  if (status === 'IN_PLAY') {
    return (
      <div className="status-badge status-badge--live">
        <span className="status-badge__dot"></span>
        LIVE {minute ? `${minute}'` : ''}
      </div>
    );
  }
  
  if (status === 'PAUSED') {
    return (
      <div className="status-badge status-badge--live">
        <span className="status-badge__dot"></span>
        HT
      </div>
    );
  }

  if (status === 'FINISHED') {
    return <div className="status-badge status-badge--finished">FT</div>;
  }

  if (status === 'SCHEDULED' || status === 'TIMED') {
    return <div className="status-badge status-badge--scheduled">Scheduled</div>;
  }

  return <div className="status-badge status-badge--default">{status}</div>;
};
