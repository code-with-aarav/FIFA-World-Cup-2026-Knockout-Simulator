import { useState, useEffect, useCallback, useRef } from 'react';
import { tournamentService } from '../services/tournamentService.js';

const CACHE_KEY = 'wc2026_tournament_data';
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useWorldCupData() {
  const [data, setData] = useState({
    matches: [],
    groupedMatches: {},
    officialWinners: {},
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    
    try {
      const result = await tournamentService.getTournamentData();
      setData(result);
      setError(null);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (err) {
      console.error('Failed to fetch tournament data:', err);
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        setError('Unable to fetch live data.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  return { ...data, loading, error, refetch: () => fetchData(true) };
}
