import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';

// Sun icon SVG
const SunIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon SVG
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <line x1="18" y1="3" x2="19" y2="4" />
    <line x1="21" y1="6" x2="22" y2="6" />
    <line x1="19" y1="1" x2="19" y2="2" />
  </svg>
);
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { DEFAULT_TEAMS } from './teamsData';
import { fetchKnockoutMatches } from './api/footballData';
import { mapMatchesToWinners } from './utils/matchMapper';

// Geometry constants
const S = [32, 32, 16, 8, 4, 2];
const C = [0, 2, 3, 4, 5];
const w = { 0: 2, 2: 3, 3: 4, 4: 5, 5: null };
// Reverse mapping: inner ring → source ring
const wReverse = { 2: 0, 3: 2, 4: 3, 5: 4 };
const ye = [50, 40.5, 31, 22, 13.5, 5.5];
const be = 8;

// Compute base angular offsets for the rings
function xe() {
  let e = [];
  for (let t = 0; t < S.length; t++) {
    let n = S[t], r = 2 * Math.PI / n;
    if (t === 0) {
      e.push(r / 2);
      continue;
    }
    let i = S[t - 1], a = e[t - 1], o = 2 * Math.PI / i;
    if (n === i) {
      e.push(a);
      continue;
    }
    e.push(a + o / 2);
  }
  return e;
}
const Se = xe();

function Ce(e, t = 0) {
  return (ye[e] ?? ye[ye.length - 1]) + t;
}

function we(e, t, n = 0) {
  let r = Ce(t, n), i = Se[t];
  return Array.from({ length: e }, (n, a) => {
    let o = 2 * Math.PI * a / e + i;
    return {
      id: `${t}-${a}`,
      x: 50 + r * Math.sin(o),
      y: 50 - r * Math.cos(o)
    };
  });
}

function Te(e = 0) {
  return S.map((t, n) => ({
    count: t,
    ringIndex: n,
    points: we(t, n, e)
  }));
}

function Ee(e, t, n) {
  return `M ${e.x} ${e.y} A ${n} ${n} 0 0 1 ${t.x} ${t.y}`;
}

function De(e) {
  return e === 0
    ? 'circle-points__ring circle-points__ring--first'
    : e === 1
    ? 'circle-points__ring circle-points__ring--second'
    : e === 2
    ? 'circle-points__ring circle-points__ring--playable'
    : e === 3
    ? 'circle-points__ring circle-points__ring--playable-inner'
    : e === 4
    ? 'circle-points__ring circle-points__ring--playable-final'
    : e === 5
    ? 'circle-points__ring circle-points__ring--playable-championship'
    : 'circle-points__ring';
}

const Oe = 72;
function ke(e) {
  return e >= 50 ? (e > Oe ? 'right' : 'left') : (e < 100 - Oe ? 'left' : 'right');
}

function je(e, t, n = 0) {
  let r = S[t], i = Ce(t, n), a = Se[t], o = 2 * Math.PI / r, s = (e * 2 + .5) * o + a;
  return {
    x: 50 + i * Math.sin(s),
    y: 50 - i * Math.cos(s)
  };
}

function de({ ringIndex: e, winnerSlotIndex: t, ringPoints: n, getRingRadius: r, getPairArcMidpoint: i }) {
  let a = re(t), o = w[e];
  if (o === null) return null;
  let s = n[e][t], c = n[o][a], l = t % 2 == 1 ? 0 : 1;
  if (e === 0) {
    let e = n[1][t], o = i(a, 1), u = r(1);
    return [
      `M ${s.x} ${s.y}`,
      `L ${e.x} ${e.y}`,
      `A ${u} ${u} 0 0 ${l} ${o.x} ${o.y}`,
      `L ${c.x} ${c.y}`
    ].join(' ');
  }
  let u = i(a, e), d = r(e);
  return [
    `M ${s.x} ${s.y}`,
    `A ${d} ${d} 0 0 ${l} ${u.x} ${u.y}`,
    `L ${c.x} ${c.y}`
  ].join(' ');
}

function fe(e, t) {
  let n = e.getTotalLength(), r = e.getPointAtLength(n * t);
  return { x: r.x, y: r.y };
}

// Hover delay hook
function me({ showDelay = 400, hideDelay = 120 } = {}) {
  const [active, setActive] = useState(false);
  const showTimer = useRef(undefined);
  const hideTimer = useRef(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
  }, []);

  const onMouseEnter = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    showTimer.current = window.setTimeout(() => setActive(true), showDelay);
  }, [showDelay]);

  const onMouseLeave = useCallback(() => {
    window.clearTimeout(showTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(false), hideDelay);
  }, [hideDelay]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    active,
    onMouseEnter,
    onMouseLeave,
    showImmediately: useCallback(() => {
      clearTimers();
      setActive(true);
    }, [clearTimers]),
    hideImmediately: useCallback(() => {
      clearTimers();
      setActive(false);
    }, [clearTimers])
  };
}

function O(e) {
  if (!e) return '';
  const name = e.includes('-') ? e.split('-').pop().toLowerCase() : e.toLowerCase();
  return `/img/flags/${name}.svg`;
}

// Tree logic helpers
function ee(e, t) {
  return `${e}-${t}`;
}

function te(e, t) {
  return `${e}-pair-${t}`;
}

function ne(e, t) {
  return [t * 2, t * 2 + 1];
}

function T(e) {
  return S[e] / 2;
}

function re(e) {
  return Math.floor(e / 2);
}

function ie(e) {
  return C.includes(e);
}

function ae(e) {
  return {
    isoCode: e.isoCode,
    name: e.team || e.name || e.isoCode
  };
}

function oe(e) {
  const t = {};
  e.forEach((item, n) => {
    t[ee(0, n)] = ae(item);
  });
  return t;
}

function se(e, t) {
  let n = oe(e);
  for (let eIndex of C) {
    let rVal = T(eIndex);
    for (let i = 0; i < rVal; i += 1) {
      let rWinner = t[te(eIndex, i)];
      if (!rWinner) continue;
      let [a, o] = ne(eIndex, i),
          s = n[ee(eIndex, a)],
          c = n[ee(eIndex, o)];
      if (!s || !c || !(rWinner.isoCode === s.isoCode || rWinner.isoCode === c.isoCode)) continue;
      let nextRing = w[eIndex];
      if (nextRing !== null) {
        n[ee(nextRing, i)] = rWinner;
      }
    }
  }
  return n;
}

function ce(e, t) {
  let n = oe(e), r = {};
  for (let eIndex of C) {
    let iVal = T(eIndex);
    for (let a = 0; a < iVal; a += 1) {
      let iWinner = t[te(eIndex, a)];
      if (!iWinner) continue;
      let [o, s] = ne(eIndex, a),
          c = n[ee(eIndex, o)],
          l = n[ee(eIndex, s)];
      if (!c || !l || !(iWinner.isoCode === c.isoCode || iWinner.isoCode === l.isoCode)) continue;
      r[te(eIndex, a)] = iWinner;
      let u = w[eIndex];
      if (u !== null) {
        n[ee(u, a)] = iWinner;
      }
    }
  }
  return r;
}

function le(e, t, n, r, i) {
  return ce(e, {
    ...t,
    [te(n, r)]: i
  });
}

function E(e, t, n, r = new Set()) {
  let [i, a] = ne(e, t),
      o = ee(e, i),
      s = ee(e, a);
  return !!(n[o] && n[s] && !r.has(o) && !r.has(s));
}

function D(e, t, n) {
  return n[te(e, t)] ?? null;
}

function ue(e, t, n, r) {
  let i = D(e, re(t), r);
  if (!i) return 'idle';
  let a = n[ee(e, t)];
  return a ? (a.isoCode === i.isoCode ? 'winner' : 'eliminated') : 'idle';
}

const FlagImage = React.memo(({ team, className }) => {
  return <img src={O(team.isoCode)} alt={team.name} className={className} draggable={false} />;
});

// Interactive flag with tooltip
function InteractiveFlag({ team, side, inactive = false, beatBy }) {
  const flagRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({});
  const { active, onMouseEnter, onMouseLeave, showImmediately, hideImmediately } = me({ showDelay: 0, hideDelay: 80 });

  const tooltipText = beatBy ? `${team.name} — lost to ${beatBy.name}` : team.name;
  const isShown = active || isFocused;

  const updatePosition = useCallback(() => {
    const el = flagRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (side === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
        transform: 'translateY(-50%)'
      });
    } else {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.left - 8,
        transform: 'translate(-100%, -50%)'
      });
    }
  }, [side]);

  useLayoutEffect(() => {
    if (!isShown) {
      setVisible(false);
      return;
    }
    updatePosition();
    setVisible(true);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isShown, updatePosition]);

  useEffect(() => {
    const btn = flagRef.current?.closest('button');
    if (!btn) return;
    const onFocus = () => {
      if (btn.matches(':focus-visible')) {
        showImmediately();
        setIsFocused(true);
      }
    };
    const onBlur = () => {
      hideImmediately();
      setIsFocused(false);
    };

    btn.addEventListener('focusin', onFocus);
    btn.addEventListener('focusout', onBlur);
    return () => {
      btn.removeEventListener('focusin', onFocus);
      btn.removeEventListener('focusout', onBlur);
    };
  }, [hideImmediately, showImmediately]);

  return (
    <>
      <span
        ref={flagRef}
        className={`circle-points__flag-tooltip circle-points__flag-tooltip--${side}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <span className={`circle-points__flag-stack${inactive ? ' circle-points__flag-stack--inactive' : ''}`}>
          <FlagImage team={team} className="circle-points__flag circle-points__flag--active" />
          <FlagImage team={team} className="circle-points__flag circle-points__flag--inactive" />
        </span>
      </span>
      {isShown && createPortal(
        <span
          className={`circle-points__tooltip${visible ? ' circle-points__tooltip--visible' : ''} circle-points__tooltip--${side}`}
          style={coords}
          role="tooltip"
        >
          {tooltipText}
        </span>,
        document.body
      )}
    </>
  );
}

// Traveling flag animation component
function TravelingFlag({ sourceSlotKey, pathD, startPosition, onComplete, team, reversed = false }) {
  const pathRef = useRef(null);
  const flagRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useLayoutEffect(() => {
    const pathNode = pathRef.current;
    const flagNode = flagRef.current;
    if (!pathNode || !flagNode) return;

    // Reversed: start at end of path (inner ring) and travel back to start (outer ring)
    const startT = reversed ? 1 : 0;
    const startPos = fe(pathNode, startT);
    flagNode.style.left = `${startPos.x}%`;
    flagNode.style.top = `${startPos.y}%`;

    let animationId = 0;
    const startTime = performance.now();
    const duration = 750;

    function tick(now) {
      const pathNode = pathRef.current;
      const flagNode = flagRef.current;
      if (!pathNode || !flagNode) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 0.5 * (1 - Math.cos(progress * Math.PI));
      // For reversed: go 1→0 along the path instead of 0→1
      const t = reversed ? 1 - eased : eased;

      const pos = fe(pathNode, t);
      flagNode.style.left = `${pos.x}%`;
      flagNode.style.top = `${pos.y}%`;

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current();
      }
    }

    animationId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [pathD, sourceSlotKey, reversed]);

  return (
    <>
      <svg className="circle-points__path-measure" viewBox="0 0 100 100" aria-hidden="true">
        <path ref={pathRef} d={pathD} />
      </svg>
      <span
        ref={flagRef}
        className="circle-points__traveling-flag"
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          zIndex: 11,
          left: `${startPosition.x}%`,
          top: `${startPosition.y}%`
        }}
      >
        <FlagImage team={team} className="circle-points__flag" />
      </span>
    </>
  );
}

// Circular bracket UI component
const BracketCircle = React.forwardRef(({ positions, pairWinners, onPairWinnersChange, activeTheme }, ref) => {
  const [radialOffset, setRadialOffset] = useState(0);
  const [animations, setAnimations] = useState([]);

  const evaluatedSlots = useMemo(() => se(positions, pairWinners), [positions, pairWinners]);
  const animatedTargets = useMemo(() => new Set(animations.map(a => a.targetSlotKey)), [animations]);
  const animatedSources = useMemo(() => new Set(animations.map(a => a.sourceSlotKey)), [animations]);
  const allAnimatedKeys = useMemo(() => {
    const keys = new Set();
    animatedTargets.forEach(k => keys.add(k));
    animatedSources.forEach(k => keys.add(k));
    return keys;
  }, [animatedTargets, animatedSources]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const updateSize = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setRadialOffset(be / 2 / w * 100);
    };
    updateSize();
    const obs = new ResizeObserver(updateSize);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  const ringsData = useMemo(() => Te(radialOffset), [radialOffset]);
  const ringPoints = useMemo(() => Te(radialOffset).map(r => r.points), [radialOffset]);

  const pendingTargetPoints = useMemo(() => {
    return animations.flatMap(anim => {
      // Don't show a target-highlight dot while a flag is returning (reversed)
      if (anim.reversed) return [];
      const match = anim.targetSlotKey.match(/^(\d+)-(\d+)$/);
      if (!match) return [];
      const ringIdx = Number(match[1]);
      const slotIdx = Number(match[2]);
      const pt = ringPoints[ringIdx]?.[slotIdx];
      return pt ? [{ key: anim.targetSlotKey, point: pt }] : [];
    });
  }, [animations, ringPoints]);

  useEffect(() => {
    setAnimations(prev => prev.filter(anim =>
      // Reversed (undo) animations manage their own lifecycle — let them finish
      anim.reversed ||
      evaluatedSlots[anim.targetSlotKey]?.isoCode === anim.team.isoCode
    ));
  }, [evaluatedSlots]);

  const ring0Points = ringsData[0].points;
  const ring1Points = ringsData[1].points;
  const ring2Points = ringsData[2].points;
  const ring3Points = ringsData[3].points;
  const ring4Points = ringsData[4].points;
  const ring5Points = ringsData[5].points;

  const ring1PairsCount = ring1Points.length / 2;
  const ring2PairsCount = ring2Points.length / 2;
  const ring3PairsCount = ring3Points.length / 2;
  const ring4PairsCount = ring4Points.length / 2;

  const getRingRadius = useCallback(r => Ce(r, radialOffset), [radialOffset]);
  const getPairArcMidpoint = useCallback((pairIdx, ringIdx) => je(pairIdx, ringIdx, radialOffset), [radialOffset]);

  const { passedPairs, advancingPairs } = useMemo(() => {
    const passed = new Set();
    const advancing = new Set();
    for (let anim of animations) {
      const match = anim.sourceSlotKey.match(/^(\d+)-(\d+)$/);
      if (!match) continue;
      const r = Number(match[1]);
      const s = Number(match[2]);
      if (ie(r)) {
        advancing.add(te(r, re(s)));
      }
    }
    for (let ringIdx of [0, 2, 3, 4, 5]) {
      const matchesCount = T(ringIdx);
      for (let mIdx = 0; mIdx < matchesCount; mIdx += 1) {
        const pKey = te(ringIdx, mIdx);
        if (pairWinners[pKey] && !advancing.has(pKey)) {
          passed.add(pKey);
        }
      }
    }
    return { passedPairs: passed, advancingPairs: advancing };
  }, [pairWinners, animations]);

  const handleAnimationComplete = useCallback(animId => {
    setAnimations(prev => {
      const anim = prev.find(a => a.id === animId);
      const filtered = prev.filter(a => a.id !== animId);
      // If this animation has a chained follow-up, add it now
      if (anim?.chainAnimation) {
        return [...filtered, anim.chainAnimation];
      }
      return filtered;
    });
  }, []);

  const handleTeamClick = useCallback((ringIdx, slotIdx) => {
    const pairIdx = re(slotIdx);
    const team = evaluatedSlots[ee(ringIdx, slotIdx)];
    if (!team) return;

    const otherSlotIdx = slotIdx % 2 === 0 ? slotIdx + 1 : slotIdx - 1;
    const hasOpponent = !!evaluatedSlots[ee(ringIdx, otherSlotIdx)];
    const sourceRing = wReverse[ringIdx];

    // ── UNDO CASE: lone flag in inner ring — send it back ──
    if (!hasOpponent && sourceRing !== undefined && !allAnimatedKeys.has(ee(ringIdx, slotIdx))) {
      const newWinners = { ...pairWinners };
      delete newWinners[te(sourceRing, slotIdx)];
      onPairWinnersChange(ce(positions, newWinners));

      const srcSlotA = 2 * slotIdx;
      const srcSlotB = 2 * slotIdx + 1;
      const srcSlotIdx = evaluatedSlots[ee(sourceRing, srcSlotA)]?.isoCode === team.isoCode
        ? srcSlotA : srcSlotB;

      const pathD = de({ ringIndex: sourceRing, winnerSlotIndex: srcSlotIdx, ringPoints, getRingRadius, getPairArcMidpoint });
      if (!pathD) return;

      const innerKey = ee(ringIdx, slotIdx);
      const outerKey = ee(sourceRing, srcSlotIdx); // Target is the outer slot

      setAnimations(prev => [
        ...prev.filter(a => a.sourceSlotKey !== innerKey),
        { id: `undo-${innerKey}-${Date.now()}`, team, pathD, startPosition: ringPoints[ringIdx][slotIdx], sourceSlotKey: innerKey, targetSlotKey: outerKey, reversed: true, chainAnimation: null }
      ]);
      return;
    }

    // ── SWAP WINNER CASE: clicking the eliminated team while a different winner already advanced ──
    // Phase 1: current winner travels BACK along its path.
    // Phase 2: (chained) new winner travels FORWARD to the inner slot.
    const matchOutcome = ie(ringIdx) && team ? ue(ringIdx, slotIdx, evaluatedSlots, pairWinners) : 'idle';
    const existingWinner = D(ringIdx, pairIdx, pairWinners);

    if (matchOutcome === 'eliminated' && existingWinner && !allAnimatedKeys.has(ee(ringIdx, slotIdx))) {
      const innerRing = w[ringIdx];
      if (innerRing === null) return; // championship has no inner ring

      const innerSlotIdx = pairIdx;
      const innerKey = ee(innerRing, innerSlotIdx);

      // Guard: don't start a swap if the inner slot is already animating
      if (allAnimatedKeys.has(innerKey)) return;

      // The current winner occupies the OTHER slot in this outer-ring pair
      const aSlotIdx = otherSlotIdx; // winner's outer-ring slot

      // Build phase 1: current winner returns (reversed)
      const pathForA = de({ ringIndex: ringIdx, winnerSlotIndex: aSlotIdx, ringPoints, getRingRadius, getPairArcMidpoint });
      if (!pathForA) return;

      // Build phase 2: new winner advances (forward)
      const pathForB = de({ ringIndex: ringIdx, winnerSlotIndex: slotIdx, ringPoints, getRingRadius, getPairArcMidpoint });
      if (!pathForB) return;

      // Immediately update winners — B is now the winner
      onPairWinnersChange(le(positions, pairWinners, ringIdx, pairIdx, team));

      const bAnimId = `swap-fwd-${innerKey}-${team.isoCode}-${Date.now()}`;
      const bAnimation = {
        id: bAnimId,
        team,
        pathD: pathForB,
        startPosition: ringPoints[ringIdx][slotIdx],
        sourceSlotKey: ee(ringIdx, slotIdx),
        targetSlotKey: innerKey,
        reversed: false,
        chainAnimation: null
      };

      const aAnimId = `swap-rev-${innerKey}-${existingWinner.isoCode}-${Date.now()}`;
      const aTargetKey = ee(ringIdx, aSlotIdx); // A's outer ring slot

      setAnimations(prev => [
        ...prev.filter(a => a.sourceSlotKey !== innerKey && a.targetSlotKey !== innerKey),
        {
          id: aAnimId,
          team: existingWinner,
          pathD: pathForA,
          startPosition: ringPoints[innerRing][innerSlotIdx],
          sourceSlotKey: innerKey,
          targetSlotKey: aTargetKey,
          reversed: true,
          chainAnimation: bAnimation  // ← phase 2 fires when phase 1 finishes
        }
      ]);
      return;
    }

    // ── NORMAL CASE: both teams present with no winner yet — pick winner ──
    if (!E(ringIdx, pairIdx, evaluatedSlots, allAnimatedKeys)) return;

    onPairWinnersChange(le(positions, pairWinners, ringIdx, pairIdx, team));

    const nextRing = w[ringIdx];
    if (nextRing === null) return;

    const targetKey = ee(nextRing, pairIdx);
    const sourceKey = ee(ringIdx, slotIdx);
    const pathD = de({ ringIndex: ringIdx, winnerSlotIndex: slotIdx, ringPoints, getRingRadius, getPairArcMidpoint });
    if (!pathD) return;

    const startPos = ringPoints[ringIdx][slotIdx];
    setAnimations(prev => [
      ...prev.filter(a => a.targetSlotKey !== targetKey),
      { id: `${targetKey}-${team.isoCode}-${Date.now()}`, team, pathD, startPosition: startPos, sourceSlotKey: sourceKey, targetSlotKey: targetKey, reversed: false, chainAnimation: null }
    ]);
  }, [evaluatedSlots, pairWinners, positions, allAnimatedKeys, onPairWinnersChange, ringPoints, getRingRadius, getPairArcMidpoint]);

  const renderSlot = useCallback((ringIdx, pt, slotIdx) => {
    const isFirstRing = ringIdx === 0;
    const isPlayable = ie(ringIdx);
    const slotKey = ee(ringIdx, slotIdx);

    if (animatedTargets.has(slotKey)) return null;

    const team = evaluatedSlots[slotKey];
    const pairIdx = re(slotIdx);
    const matchOutcome = isPlayable && team ? ue(ringIdx, slotIdx, evaluatedSlots, pairWinners) : 'idle';
    const isAnimatedSource = animatedSources.has(slotKey);
    const isWinner = matchOutcome === 'winner';
    const isChampionship = ringIdx === 5;
    const hasChampion = !!(isChampionship && D(5, pairIdx, pairWinners));
    const isFinalWinner = isChampionship && isWinner && hasChampion;

    const canSelect = !!(team && (isFirstRing || isPlayable) && (!isWinner || isFinalWinner) && !isAnimatedSource);
    const isSubordinate = !canSelect && !isFirstRing;
    
    const showFlag = !!(
      team &&
      (isFirstRing || isPlayable) &&
      (!isWinner || isFinalWinner) &&
      !isAnimatedSource &&
      !animatedTargets.has(slotKey)
    );
    // A lone inner-ring flag (no opponent yet) is clickable to undo/send back
    const otherSlotIdx = slotIdx % 2 === 0 ? slotIdx + 1 : slotIdx - 1;
    const hasOpponent = !!evaluatedSlots[ee(ringIdx, otherSlotIdx)];
    const isUndoable = isPlayable && !!team && !isFirstRing && !hasOpponent
      && wReverse[ringIdx] !== undefined && !allAnimatedKeys.has(slotKey);
    const isPlayableSelectable = isUndoable ||
      (isPlayable && !!team && matchOutcome !== 'winner' && !allAnimatedKeys.has(slotKey) && E(ringIdx, pairIdx, evaluatedSlots, allAnimatedKeys));
    const passedMatch = (passedPairs.has(te(ringIdx, pairIdx)) || advancingPairs.has(te(ringIdx, pairIdx))) && (isFirstRing || isPlayable && isSubordinate);

    const classes = [
      'circle-points__point',
      isFirstRing ? 'circle-points__point--first-slot' : '',
      !isFirstRing && canSelect ? 'circle-points__point--team' : '',
      isPlayableSelectable ? 'circle-points__point--selectable' : '',
      passedMatch ? 'circle-points__point--passed' : ''
    ].filter(Boolean).join(' ');

    const side = ke(pt.x);
    const style = { left: `${pt.x}%`, top: `${pt.y}%` };

    const defeatedBy = matchOutcome === 'eliminated' ? D(ringIdx, pairIdx, pairWinners) : null;
    const flagEl = showFlag ? <InteractiveFlag team={team} side={side} inactive={matchOutcome === 'eliminated'} beatBy={defeatedBy} /> : null;
    const btnLabel = `Select ${team?.name ?? team?.isoCode}`;
    const clickHandler = () => handleTeamClick(ringIdx, slotIdx);

    if (isFirstRing) {
      return (
        <span key={pt.id} className={classes} style={style}>
          <span className="circle-points__dot-marker" aria-hidden="true"></span>
          {flagEl ? (
            <button
              type="button"
              className="circle-points__flag-button"
              disabled={!isPlayableSelectable}
              aria-pressed="false"
              aria-label={btnLabel}
              onClick={isPlayableSelectable ? clickHandler : undefined}
            >
              {flagEl}
            </button>
          ) : null}
        </span>
      );
    }

    if (canSelect) {
      return (
        <button
          key={pt.id}
          type="button"
          className={classes}
          style={style}
          disabled={!isPlayableSelectable}
          aria-pressed="false"
          aria-label={btnLabel}
          onClick={isPlayableSelectable ? clickHandler : undefined}
        >
          {flagEl}
        </button>
      );
    }

    return <span key={pt.id} className={classes} style={style}></span>;
  }, [evaluatedSlots, pairWinners, animatedTargets, animatedSources, allAnimatedKeys, passedPairs, advancingPairs, handleTeamClick]);

  return (
    <div className="circle-points" ref={ref}>
      {/* Connector lines SVG */}
      <svg className="circle-points__connector" viewBox="0 0 100 100" aria-hidden="true">
        {/* Ring 0 to Ring 1 connectors */}
        {ring0Points.map((pt, idx) => {
          const targetPt = ring1Points[idx];
          return <line key={`connector-${idx}`} x1={pt.x} y1={pt.y} x2={targetPt.x} y2={targetPt.y} />;
        })}

        {/* Ring 1 pair arcs */}
        {Array.from({ length: ring1PairsCount }, (_, idx) => {
          const pt1 = ring1Points[idx * 2];
          const pt2 = ring1Points[idx * 2 + 1];
          return <path key={`pair-arc-${idx}`} d={Ee(pt1, pt2, getRingRadius(1))} />;
        })}

        {/* Ring 1 midpoint to Ring 2 lines */}
        {Array.from({ length: ring1PairsCount }, (_, idx) => {
          const midPt = getPairArcMidpoint(idx, 1);
          const targetPt = ring2Points[idx];
          return <line key={`pair-third-${idx}`} x1={midPt.x} y1={midPt.y} x2={targetPt.x} y2={targetPt.y} />;
        })}

        {/* Ring 2 pair arcs */}
        {Array.from({ length: ring2PairsCount }, (_, idx) => {
          const pt1 = ring2Points[idx * 2];
          const pt2 = ring2Points[idx * 2 + 1];
          return <path key={`third-pair-arc-${idx}`} d={Ee(pt1, pt2, getRingRadius(2))} />;
        })}

        {/* Ring 2 midpoint to Ring 3 lines */}
        {Array.from({ length: ring2PairsCount }, (_, idx) => {
          const midPt = getPairArcMidpoint(idx, 2);
          const targetPt = ring3Points[idx];
          return <line key={`third-fourth-${idx}`} x1={midPt.x} y1={midPt.y} x2={targetPt.x} y2={targetPt.y} />;
        })}

        {/* Ring 3 pair arcs */}
        {Array.from({ length: ring3PairsCount }, (_, idx) => {
          const pt1 = ring3Points[idx * 2];
          const pt2 = ring3Points[idx * 2 + 1];
          return <path key={`fourth-pair-arc-${idx}`} d={Ee(pt1, pt2, getRingRadius(3))} />;
        })}

        {/* Ring 3 midpoint to Ring 4 lines */}
        {Array.from({ length: ring3PairsCount }, (_, idx) => {
          const midPt = getPairArcMidpoint(idx, 3);
          const targetPt = ring4Points[idx];
          return <line key={`fourth-fifth-${idx}`} x1={midPt.x} y1={midPt.y} x2={targetPt.x} y2={targetPt.y} />;
        })}

        {/* Ring 4 pair arcs */}
        {Array.from({ length: ring4PairsCount }, (_, idx) => {
          const pt1 = ring4Points[idx * 2];
          const pt2 = ring4Points[idx * 2 + 1];
          return <path key={`fifth-pair-arc-${idx}`} d={Ee(pt1, pt2, getRingRadius(4))} />;
        })}

        {/* Ring 4 midpoint to Ring 5 lines */}
        {Array.from({ length: ring4PairsCount }, (_, idx) => {
          const midPt = getPairArcMidpoint(idx, 4);
          const targetPt = ring5Points[idx];
          return <line key={`fifth-sixth-${idx}`} x1={midPt.x} y1={midPt.y} x2={targetPt.x} y2={targetPt.y} />;
        })}
      </svg>

      {/* Central FIFA Logo (contrast-swapped with change in light/dark resolved theme) */}
      <div className="circle-points__trophy" aria-hidden="true">
        <img
          src={activeTheme === 'dark' ? '/img/trophy-dm.png' : '/img/trophy-lm.png'}
          alt="FIFA World Cup 2026"
        />
      </div>

      {/* Slots rendering */}
      {ringsData.map(ring => (
        <div key={ring.ringIndex} className={De(ring.ringIndex)}>
          {ring.points.map((pt, idx) => (ring.ringIndex === 1 ? null : renderSlot(ring.ringIndex, pt, idx)))}
        </div>
      ))}

      {/* Pending Target highlight */}
      <div className="circle-points__pending-target-layer" aria-hidden="true">
        {pendingTargetPoints.map(({ key, point }) => (
          <span
            key={key}
            className="circle-points__point circle-points__point--pending-target"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        ))}
      </div>

      {/* Traveling animations layer */}
      <div className="circle-points__traveling-layer" aria-hidden="true">
        {animations.map(anim => (
          <TravelingFlag
            key={anim.id}
            sourceSlotKey={anim.sourceSlotKey}
            pathD={anim.pathD}
            startPosition={anim.startPosition}
            reversed={anim.reversed}
            onComplete={() => handleAnimationComplete(anim.id)}
            team={anim.team}
          />
        ))}
      </div>
    </div>
  );
});

// Full ISO database list for custom selector
const ALL_ISO_CODES = [
  { code: "BRA", name: "Brazil" },
  { code: "JPN", name: "Japan" },
  { code: "CIV", name: "Côte d'Ivoire" },
  { code: "NOR", name: "Norway" },
  { code: "MEX", name: "Mexico" },
  { code: "ECU", name: "Ecuador" },
  { code: "GB-ENG", name: "England" },
  { code: "COD", name: "DR Congo" },
  { code: "ARG", name: "Argentina" },
  { code: "CPV", name: "Cape Verde" },
  { code: "AUS", name: "Australia" },
  { code: "EGY", name: "Egypt" },
  { code: "CHE", name: "Switzerland" },
  { code: "DZA", name: "Algeria" },
  { code: "COL", name: "Colombia" },
  { code: "GHA", name: "Ghana" },
  { code: "SEN", name: "Senegal" },
  { code: "BEL", name: "Belgium" },
  { code: "USA", name: "United States" },
  { code: "BIH", name: "Bosnia and Herzegovina" },
  { code: "ESP", name: "Spain" },
  { code: "AUT", name: "Austria" },
  { code: "PRT", name: "Portugal" },
  { code: "HRV", name: "Croatia" },
  { code: "NLD", name: "Netherlands" },
  { code: "MAR", name: "Morocco" },
  { code: "CAN", name: "Canada" },
  { code: "ZAF", name: "South Africa" },
  { code: "FRA", name: "France" },
  { code: "SWE", name: "Sweden" },
  { code: "DEU", name: "Germany" },
  { code: "PRY", name: "Paraguay" },
  { code: "ITA", name: "Italy" },
  { code: "URY", name: "Uruguay" },
  { code: "CHL", name: "Chile" },
  { code: "CMR", name: "Cameroon" },
  { code: "NGA", name: "Nigeria" },
  { code: "KOR", name: "South Korea" },
  { code: "DNK", name: "Denmark" },
  { code: "UKR", name: "Ukraine" }
];

const PRESETS = {
  v: 1,
  winners: {
    "0-pair-0": "BRA",
    "0-pair-1": "CAN",
    "0-pair-2": "MAR",
    "0-pair-3": "PRY"
  }
};

function Ms(teams) {
  let e = Fe(JSON.stringify(PRESETS), teams);
  if ('error' in e) return {};
  return e.pairWinners;
}

function Ns() {
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

function Ds() {
  let e = new URLSearchParams(window.location.search).get('state');
  return e ? e : null;
}

async function ks(stateStr) {
  try {
    return atob(stateStr);
  } catch (err) {
    throw new Error('Failed to load shared draw: Invalid data format.');
  }
}
function Ne(teams, code) {
  let n = teams.find(e => e.isoCode === code);
  return n ? { isoCode: n.isoCode, name: n.name ?? n.isoCode } : null;
}

function Pe(e) {
  let t = {};
  for (let [n, r] of Object.entries(e)) {
    t[n] = r.isoCode;
  }
  return JSON.stringify({ v: 1, winners: t }, null, 2);
}

function Fe(e, teams) {
  let n;
  try {
    n = JSON.parse(e.trim());
  } catch {
    return { error: 'Invalid JSON.' };
  }
  if (!n || typeof n !== 'object') return { error: 'State must be a JSON object.' };
  let r = n;
  if (r.v !== 1) return { error: 'Unsupported state version. Expected "v": 1.' };
  if (!r.winners || typeof r.winners !== 'object') return { error: 'Missing or invalid "winners" object.' };
  let i = {};
  for (let [eKey, nVal] of Object.entries(r.winners)) {
    if (typeof nVal !== 'string') return { error: `Winner for ${eKey} must be an ISO code string.` };
    let rTeam = Ne(teams, nVal);
    if (!rTeam) return { error: `Unknown team ISO code "${nVal}" for ${eKey}.` };
    i[eKey] = rTeam;
  }
  return { pairWinners: ce(teams, i) };
}

export default function App() {
  const isDebug = Ns();
  const shareId = Ds();

  const TITLE = "FIFA World Cup 2026";
  const SUBTITLE = "Knockout Stage Simulator";

  // Standard Black & White (Light/Dark) Theme Toggle State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    return saved || 'system';
  });

  const positions = useMemo(() => {
    return DEFAULT_TEAMS.map((e, t) => {
      let n = t + 1;
      return {
        position: n,
        pair: Math.ceil(n / 2),
        isoCode: e.isoCode,
        team: e.name
      };
    });
  }, []);

  const [pairWinners, setPairWinners] = useState(() => {
    if (shareId) return {};
    // Always use presets as default, ignore localStorage for now
    return Ms(positions);
  });
  // Live data states
  const [liveError, setLiveError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [triggerKey, setTriggerKey] = useState(0);
  const [debugValue, setDebugValue] = useState('');
  const [debugMsg, setDebugMsg] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(!!shareId);
  const [sharedError, setSharedError] = useState(null);

  const bracketRef = useRef(null);

  // Apply theme class directly to <html> element so it covers the whole page
  useEffect(() => {
    const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.remove('theme-light', 'theme-dark');
      document.documentElement.classList.add(`theme-${resolved}`);
    }, [theme]);

    // Fetch live match data on mount and every 5 minutes (disabled to ensure presets show)
    // useEffect(() => {
    //   let intervalId;
    //   const loadLive = async () => {
    //     try {
    //       const matches = await fetchKnockoutMatches();
    //       const liveWinners = mapMatchesToWinners(matches, DEFAULT_TEAMS);
    //       // Only update if live data exists, otherwise keep presets
    //       if (Object.keys(liveWinners).length > 0) {
    //         setPairWinners(prev => ({ ...prev, ...liveWinners }));
    //       }
    //       setLiveError(null);
    //       setLastRefresh(new Date());
    //     } catch (err) {
    //       console.error('Live match fetch error:', err);
    //       setLiveError(err.message);
    //     }
    //   };
    //   loadLive();
    //   intervalId = setInterval(loadLive, 5 * 60 * 1000);
    //   return () => clearInterval(intervalId);
    // }, []);

  // Save winners to localStorage (disabled for now to ensure presets show)
  // useEffect(() => {
  //   const winnersCodes = {};
  //   for (let [k, v] of Object.entries(pairWinners)) {
  //     winnersCodes[k] = v.isoCode;
  //   }
  //   localStorage.setItem('bracket_winners_state', JSON.stringify(winnersCodes));
  // }, [pairWinners]);

  // Load shared draw
  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;
    (async () => {
      try {
        const dataStr = await ks(shareId);
        if (cancelled) return;
        const res = Fe(dataStr, positions);
        if ('error' in res) {
          setSharedError(res.error);
          return;
        }
        setPairWinners(res.pairWinners);
        setTriggerKey(prev => prev + 1);
      } catch (err) {
        if (!cancelled) {
          setSharedError(err instanceof Error ? err.message : 'Failed to load shared draw.');
        }
      } finally {
        if (!cancelled) setIsLoadingShared(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareId, positions]);

  // Get active light/dark resolved state to set icons and logos dynamically
  const activeResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return theme;
  }, [theme]);

  // Toggle theme explicitly
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      let next = 'dark';
      if (prev === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        next = isSystemDark ? 'light' : 'dark';
      } else {
        next = prev === 'dark' ? 'light' : 'dark';
      }
      localStorage.setItem('theme_preference', next);
      return next;
    });
  }, []);

  const handleCopyCurrent = useCallback(async () => {
    const dataStr = Pe(pairWinners);
    setDebugValue(dataStr);
    setDebugMsg(null);
    try {
      await navigator.clipboard.writeText(dataStr);
      setDebugMsg('Copied to clipboard.');
    } catch {
      setDebugMsg('State updated in textarea (clipboard unavailable).');
    }
  }, [pairWinners]);

  const handleLoadState = useCallback(() => {
    const res = Fe(debugValue, positions);
    if ('error' in res) {
      setDebugMsg(res.error);
      return;
    }
    setPairWinners(res.pairWinners);
    setTriggerKey(prev => prev + 1);
    setDebugMsg('State loaded.');
  }, [debugValue, positions]);

  const handleResetState = useCallback(() => {
    setPairWinners({});
    setTriggerKey(prev => prev + 1);
    setDebugValue('');
    setDebugMsg('Draw reset.');
  }, []);

  const handleOpenShare = useCallback(async () => {
    setShowShareModal(true);
    setShareLink(null);
    setShareError(null);
    setCopiedLink(false);
    setIsUploading(true);
    try {
      const payload = Pe(pairWinners);
      const b64 = btoa(payload);
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('state', b64);
      setShareLink(url.toString());
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to share draw.');
    } finally {
      setIsUploading(false);
    }
  }, [pairWinners]);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
    setShareLink(null);
    setShareError(null);
    setCopiedLink(false);
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        setCopiedLink(true);
      } catch {
        setCopiedLink(false);
      }
    }
  }, [shareLink]);

  const handleExportPNG = async () => {
    const el = bracketRef.current;
    if (!el) return;
    
    const originalBorder = el.style.border;
    const originalBoxSizing = el.style.boxSizing;
    
    el.style.border = '40px solid transparent';
    el.style.boxSizing = 'content-box';

    // Small delay to ensure React has finished rendering the winners
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        useCORS: true,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `${TITLE.toLowerCase().replace(/\s+/g, '-')}-bracket.png`;
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      el.style.border = originalBorder;
      el.style.boxSizing = originalBoxSizing;
    }
  };


  const hasWinners = Object.keys(pairWinners).length > 0;

  // Bracket draw page
  return (
    <main className="app">
      <aside className="app-sidebar">
        <div className="theme-toggle-wrapper">
          <button
            type="button"
            className={`theme-toggle-pill ${activeResolvedTheme === 'dark' ? 'is-dark' : 'is-light'}`}
            aria-label={activeResolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggleTheme}
          >
            <span className="theme-toggle-knob">
              <span className="theme-toggle-icon">
                {activeResolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </span>
            </span>
          </button>
        </div>
        <div className="app-sidebar__header">
          <h1 className="app-sidebar__title">FIFA World Cup 2026</h1>
          <h2 className="app-sidebar__subtitle">Knockout Stage Simulator</h2>
          <p className="app-sidebar__attribution">
            Interactive visualization based on an <a href="https://x.com/mkobach/status/2071353471295430705" target="_blank" rel="noopener noreferrer">original design</a>
          </p>
        </div>
          {lastRefresh && (
            <p className="app-sidebar__text" style={{ fontSize: '0.75rem', opacity: 0.8 }}
              >Live data refreshed {lastRefresh.toLocaleTimeString()}</p
            >
          )}
          {liveError && (
            <p className="app-sidebar__text" style={{ fontSize: '0.75rem', color: 'var(--error)' }}
              >Live data error: {liveError}</p
            >
          )}

        <div className="app-sidebar__actions">
          <button type="button" className="app-action-btn" disabled={!hasWinners || isUploading} onClick={handleOpenShare}>
            Share
          </button>
          <button type="button" className="app-action-btn" onClick={handleResetState}>
            Reset
          </button>
          <button type="button" className="app-action-btn" onClick={handleExportPNG}>
            Export PNG
          </button>
        </div>


        {/* Debug panel (hidden unless debug mode is active) */}
        {isDebug && (
          <section className="app-sidebar__debug" aria-label="Debug panel">
            <h2 className="app-sidebar__debug-title">Debug</h2>
            <p className="app-sidebar__debug-help">Copy the current draw, paste a saved state, then load it.</p>
            <textarea
              className="app-sidebar__debug-input"
              value={debugValue}
              onChange={e => setDebugValue(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder='{"v":1,"winners":{"0-pair-0":"CAN"}}'
            />
            <div className="app-sidebar__debug-actions">
              <button type="button" onClick={handleCopyCurrent}>Copy current</button>
              <button type="button" onClick={handleLoadState}>Load</button>
              <button type="button" onClick={handleResetState}>Reset</button>
            </div>
            {debugMsg && <p className="app-sidebar__debug-message" role="status">{debugMsg}</p>}
          </section>
        )}
      </aside>

      <div className="app-main">
        {isLoadingShared ? (
          <p className="app-main__loading" role="status">Loading shared draw</p>
        ) : sharedError ? (
          <p className="app-main__loading" style={{ color: 'var(--error)' }} role="alert">{sharedError}</p>
        ) : (
          <BracketCircle
            ref={bracketRef}
            positions={positions}
            pairWinners={pairWinners}
            onPairWinnersChange={setPairWinners}
            key={triggerKey}
            activeTheme={activeResolvedTheme}
          />
        )}
      </div>

      {showShareModal && (
        <div className="app-share-modal" role="presentation" onClick={handleCloseShare}>
          <div className="app-share-modal__panel" role="dialog" aria-modal="true" aria-labelledby="share-modal-title" onClick={e => e.stopPropagation()}>
            <h2 id="share-modal-title" className="app-share-modal__title">Share</h2>
            {isUploading ? (
              <p className="app-share-modal__status" role="status">Uploading...</p>
            ) : shareError ? (
              <p className="app-share-modal__error" role="alert">{shareError}</p>
            ) : shareLink ? (
              <div className="app-share-modal__link-block">
                <div className="app-share-modal__link-row">
                  <p className="app-share-modal__link" title={shareLink}>{shareLink}</p>
                  <button type="button" className="app-share-modal__copy" aria-label="Copy share link" onClick={handleCopyShareLink}>
                    <svg className="app-share-modal__copy-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                </div>
                {copiedLink && <p className="app-share-modal__copied" role="status">Copied to clipboard</p>}
              </div>
            ) : null}
            <button type="button" className="app-action-btn" onClick={handleCloseShare}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
