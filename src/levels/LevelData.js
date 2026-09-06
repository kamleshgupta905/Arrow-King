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

  if (levelCache.has(cacheKey)) {
    return JSON.parse(JSON.stringify(levelCache.get(cacheKey)));
  }

  const level = generateLevel(category, num);
  levelCache.set(cacheKey, JSON.parse(JSON.stringify(level)));
  return JSON.parse(JSON.stringify(level));
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
