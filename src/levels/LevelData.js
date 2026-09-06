/**
 * LevelData.js
 * Caching and registry for 600 total levels (6 categories x 100 levels each).
 */

import { generateLevel } from './LevelGenerator.js';
import { CATEGORIES, SHAPES_LIST } from './ShapeGenerator.js';

const levelCache = new Map();

export { CATEGORIES };

/**
 * Retrieves a level configuration, generating and caching it on demand.
 * Supports both getLevel(category, levelNum) and legacy getLevel(levelNum).
 */
export function getLevel(categoryOrNum = 'beginner', levelNum = 1) {
  let category = 'beginner';
  let num = 1;

  if (typeof categoryOrNum === 'number') {
    category = 'beginner';
    num = categoryOrNum;
  } else {
    category = categoryOrNum;
    num = levelNum;
  }

  num = Math.max(1, Math.min(100, num));
  const cacheKey = `${category}_${num}`;

  function cloneLevel(lvl) {
    return {
      ...lvl,
      arrows: lvl.arrows.map(a => ({
        ...a,
        points: a.points.map(p => ({ x: p.x, y: p.y })),
        head: { ...a.head },
        tail: { ...a.tail },
        dirVec: { ...a.dirVec }
      }))
    };
  }

  if (levelCache.has(cacheKey)) {
    return cloneLevel(levelCache.get(cacheKey));
  }

  const level = generateLevel(category, num);
  levelCache.set(cacheKey, level);
  return cloneLevel(level);
}

/**
 * Returns shape metadata for a level without full maze generation.
 */
export function getLevelMetadata(category, levelNum) {
  const shapeIndex = (levelNum - 1) % SHAPES_LIST.length;
  const baseShape = SHAPES_LIST[shapeIndex];
  return {
    category,
    levelNumber: levelNum,
    shapeName: baseShape.name
  };
}

/**
 * Returns metadata list for all 100 levels of a category.
 */
export function getCategoryLevelsMetadata(category = 'beginner') {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    list.push(getLevelMetadata(category, i));
  }
  return list;
}
