/**
 * LevelGenerator.js
 * Generates playable, 100% solvable puzzle levels with arrow mazes
 * across 6 categories (including Hacker timed mode) and 100 levels each.
 */

import { generateArrowMaze, getCategoryDef } from './ShapeGenerator.js';

export function generateLevel(category = 'beginner', levelNum = 1) {
  return generateArrowMaze(category, levelNum);
}

export function getCategory(categoryId) {
  return getCategoryDef(categoryId);
}
