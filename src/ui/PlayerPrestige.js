/**
 * PlayerPrestige.js
 * Real royal rank, daily court streak, and cleared-court totals.
 * Used by the opening screen so stats are earned, not decorative.
 */

const STREAK_KEY = 'arrow_king_court_streak';

function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function touchStreak() {
  const today = localDate(0);
  const yesterday = localDate(-1);
  let count = 1;

  try {
    const saved = JSON.parse(localStorage.getItem(STREAK_KEY) || 'null');
    if (saved && saved.last === today) {
      count = saved.count || 1;
    } else if (saved && saved.last === yesterday) {
      count = (saved.count || 1) + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count, last: today }));
  } catch (_) {
    /* storage unavailable — streak stays cosmetic */
  }

  return count;
}

export function rankForStars(stars) {
  if (stars >= 420) return { name: 'Arrow King', tier: 'VI', title: 'THE CROWN' };
  if (stars >= 220) return { name: 'Crown Prince', tier: 'V', title: 'HEIR' };
  if (stars >= 110) return { name: 'Duke', tier: 'IV', title: 'HIGH COURT' };
  if (stars >= 45) return { name: 'Baron', tier: 'III', title: 'NOBLE' };
  if (stars >= 12) return { name: 'Knight', tier: 'II', title: 'SWORN' };
  return { name: 'Squire', tier: 'I', title: 'RISING' };
}

export function countClearedCourts(starsMap) {
  let cleared = 0;
  for (const value of Object.values(starsMap || {})) {
    if (typeof value === 'number' && value > 0) cleared += 1;
  }
  return cleared;
}

export function totalStars(starsMap) {
  return Object.values(starsMap || {}).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
}

export function getPrestige(progress) {
  const stars = totalStars(progress?.stars);
  const streak = touchStreak();
  const courts = countClearedCourts(progress?.stars);
  const rank = rankForStars(stars);
  return { stars, streak, courts, rank };
}
