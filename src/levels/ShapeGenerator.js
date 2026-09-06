/**
 * ShapeGenerator.js
 * 50 iconic shape silhouette definitions matching the reference photos.
 * Generates 100 levels per category (Beginner, Intermediate, Advanced, Expert, Master, Hacker).
 * Strictly forbids self-looping and self-colliding arrows (Anti-Self-Loop rule).
 */

// PRNG for deterministic level generation
function pseudoRandom(seed) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const CATEGORIES = [
  { id: 'beginner', name: 'Beginner', levelsCount: 100, minArrows: 20, maxArrows: 36 },
  { id: 'intermediate', name: 'Intermediate', levelsCount: 100, minArrows: 32, maxArrows: 52 },
  { id: 'advanced', name: 'Advanced', levelsCount: 100, minArrows: 46, maxArrows: 72 },
  { id: 'expert', name: 'Expert', levelsCount: 100, minArrows: 62, maxArrows: 92 },
  { id: 'master', name: 'Master', levelsCount: 100, minArrows: 78, maxArrows: 118 },
  { id: 'hacker', name: 'Hacker', levelsCount: 100, minArrows: 35, maxArrows: 62, isTimed: true }
];

export const SHAPES_LIST = [
  // 1. Triangle
  {
    id: 1,
    name: 'TRIANGLE',
    width: 16,
    height: 16,
    mask: (x, y, w, h) => {
      const midX = w / 2;
      const topY = 2;
      const botY = h - 2;
      if (y < topY || y > botY) return false;
      const prog = (y - topY) / (botY - topY);
      return Math.abs(x - midX) <= prog * (w / 2 - 2);
    }
  },
  // 2. Circle
  {
    id: 2,
    name: 'CIRCLE',
    width: 16,
    height: 16,
    mask: (x, y, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2 - 2;
      return Math.hypot(x - cx, y - cy) <= r;
    }
  },
  // 3. Arrow
  {
    id: 3,
    name: 'ARROW',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const midX = w / 2;
      if (y >= 2 && y <= h * 0.45) {
        const prog = (y - 2) / (h * 0.45 - 2);
        return Math.abs(x - midX) <= prog * (w / 2 - 1.5);
      }
      if (y > h * 0.45 && y <= h - 2) {
        return Math.abs(x - midX) <= w * 0.22;
      }
      return false;
    }
  },
  // 4. Heart
  {
    id: 4,
    name: 'HEART',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = (x - w / 2) / (w / 3.2);
      const ny = -(y - h / 2 + 1) / (h / 3.2);
      const a = nx * nx + ny * ny - 1;
      return (a * a * a - nx * nx * ny * ny * ny) <= 0;
    }
  },
  // 5. Mushroom
  {
    id: 5,
    name: 'MUSHROOM',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const cx = w / 2;
      if (y >= 2 && y <= h * 0.6) {
        const rx = w / 2 - 2;
        const ry = h * 0.35;
        const cy = h * 0.35;
        if (Math.hypot((x - cx) / rx, (y - cy) / ry) <= 1) return true;
      }
      if (y > h * 0.55 && y <= h - 2) {
        const rx = w * 0.26;
        const ry = h * 0.24;
        const cy = h * 0.74;
        if (Math.hypot((x - cx) / rx, (y - cy) / ry) <= 1) return true;
      }
      return false;
    }
  },
  // 6. Dog
  {
    id: 6,
    name: 'DOG',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (nx >= 0.05 && nx <= 0.18 && ny >= 0.22 && ny <= 0.45) return true;
      if (nx >= 0.15 && nx <= 0.72 && ny >= 0.35 && ny <= 0.7) return true;
      if (nx >= 0.12 && nx <= 0.32 && ny >= 0.65 && ny <= 0.95) return true;
      if (nx >= 0.58 && nx <= 0.76 && ny >= 0.65 && ny <= 0.95) return true;
      if (nx >= 0.55 && nx <= 0.78 && ny >= 0.12 && ny <= 0.4) return true;
      if (nx >= 0.75 && nx <= 0.95 && ny >= 0.18 && ny <= 0.35) return true;
      if (nx >= 0.58 && nx <= 0.7 && ny >= 0.05 && ny <= 0.18) return true;
      return false;
    }
  },
  // 7. Star
  {
    id: 7,
    name: 'STAR',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return true;
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      const armAngle = (Math.PI * 2) / 5;
      const mod = angle % armAngle;
      const half = armAngle / 2;
      const t = Math.abs(mod - half) / half;
      const maxR = 2.5 + t * (w / 2 - 4.5);
      return dist <= maxR;
    }
  },
  // 8. Diamond
  {
    id: 8,
    name: 'DIAMOND',
    width: 16,
    height: 16,
    mask: (x, y, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      return (Math.abs(x - cx) / (w / 2 - 2) + Math.abs(y - cy) / (h / 2 - 2)) <= 1;
    }
  },
  // 9. Fish
  {
    id: 9,
    name: 'FISH',
    width: 20,
    height: 16,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.4) / 0.35, (ny - 0.5) / 0.35) <= 1) return true;
      if (nx >= 0.65 && nx <= 0.95 && Math.abs(ny - 0.5) <= (nx - 0.65) * 0.9) return true;
      return false;
    }
  },
  // 10. Duck
  {
    id: 10,
    name: 'DUCK',
    width: 20,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.65) / 0.16, (ny - 0.25) / 0.16) <= 1) return true;
      if (nx >= 0.78 && nx <= 0.95 && ny >= 0.22 && ny <= 0.32) return true;
      if (Math.hypot((nx - 0.45) / 0.35, (ny - 0.65) / 0.25) <= 1) return true;
      if (nx >= 0.1 && nx <= 0.25 && ny >= 0.5 && ny <= 0.65) return true;
      return false;
    }
  },
  // 11. Cat
  {
    id: 11,
    name: 'CAT',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.32, (ny - 0.55) / 0.32) <= 1) return true;
      if (nx >= 0.18 && nx <= 0.38 && ny >= 0.15 && ny <= 0.4) return true;
      if (nx >= 0.62 && nx <= 0.82 && ny >= 0.15 && ny <= 0.4) return true;
      return false;
    }
  },
  // 12. Butterfly
  {
    id: 12,
    name: 'BUTTERFLY',
    width: 20,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.08 && ny >= 0.15 && ny <= 0.85) return true;
      if (Math.hypot((nx - 0.28) / 0.25, (ny - 0.35) / 0.25) <= 1) return true;
      if (Math.hypot((nx - 0.72) / 0.25, (ny - 0.35) / 0.25) <= 1) return true;
      if (Math.hypot((nx - 0.32) / 0.2, (ny - 0.68) / 0.2) <= 1) return true;
      if (Math.hypot((nx - 0.68) / 0.2, (ny - 0.68) / 0.2) <= 1) return true;
      return false;
    }
  },
  // 13. Elephant
  {
    id: 13,
    name: 'ELEPHANT',
    width: 22,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.35, (ny - 0.45) / 0.3) <= 1) return true;
      if (nx >= 0.22 && nx <= 0.35 && ny >= 0.65 && ny <= 0.95) return true;
      if (nx >= 0.55 && nx <= 0.68 && ny >= 0.65 && ny <= 0.95) return true;
      if (nx >= 0.7 && nx <= 0.95 && ny >= 0.25 && ny <= 0.8) return true;
      return false;
    }
  },
  // 14. House
  {
    id: 14,
    name: 'HOUSE',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny <= 0.45 && ny >= 0.1) {
        const prog = (ny - 0.1) / 0.35;
        return Math.abs(nx - 0.5) <= prog * 0.42;
      }
      if (ny > 0.45 && ny <= 0.9) return Math.abs(nx - 0.5) <= 0.38;
      return false;
    }
  },
  // 15. Car
  {
    id: 15,
    name: 'CAR',
    width: 22,
    height: 16,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (nx >= 0.3 && nx <= 0.7 && ny >= 0.18 && ny <= 0.5) return true;
      if (nx >= 0.1 && nx <= 0.9 && ny >= 0.45 && ny <= 0.8) return true;
      return false;
    }
  },
  // 16. Tree
  {
    id: 16,
    name: 'TREE',
    width: 18,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.38) / 0.3) <= 1) return true;
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.6 && ny <= 0.95) return true;
      return false;
    }
  },
  // 17. Apple
  {
    id: 17,
    name: 'APPLE',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.06 && ny >= 0.08 && ny <= 0.22) return true;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.58) / 0.35) <= 1) return true;
      return false;
    }
  },
  // 18. Key
  {
    id: 18,
    name: 'KEY',
    width: 22,
    height: 16,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.25) / 0.18, (ny - 0.5) / 0.35) <= 1) return true;
      if (nx >= 0.4 && nx <= 0.85 && Math.abs(ny - 0.5) <= 0.1) return true;
      if (nx >= 0.72 && nx <= 0.85 && ny >= 0.5 && ny <= 0.82) return true;
      return false;
    }
  },
  // 19. Guitar
  {
    id: 19,
    name: 'GUITAR',
    width: 22,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.25) <= 0.08 && ny >= 0.1 && ny <= 0.55) return true;
      if (Math.hypot((nx - 0.55) / 0.3, (ny - 0.65) / 0.25) <= 1) return true;
      return false;
    }
  },
  // 20. Boat
  {
    id: 20,
    name: 'BOAT',
    width: 20,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (nx >= 0.45 && nx <= 0.8 && ny >= 0.15 && ny <= 0.6) {
        const prog = (ny - 0.15) / 0.45;
        if (nx - 0.45 <= prog * 0.35) return true;
      }
      if (ny >= 0.65 && ny <= 0.88 && Math.abs(nx - 0.5) <= 0.42) return true;
      return false;
    }
  },
  // 21. Rocket
  {
    id: 21,
    name: 'ROCKET',
    width: 18,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.1 && ny <= 0.75 && Math.abs(nx - 0.5) <= 0.18) return true;
      if (ny >= 0.65 && ny <= 0.9 && Math.abs(nx - 0.5) <= 0.38) return true;
      return false;
    }
  },
  // 22. Skull
  {
    id: 22,
    name: 'SKULL',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.4) / 0.3) <= 1) return true;
      if (Math.abs(nx - 0.5) <= 0.24 && ny >= 0.6 && ny <= 0.88) return true;
      return false;
    }
  },
  // 23. Coffee
  {
    id: 23,
    name: 'COFFEE',
    width: 20,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.45) <= 0.3 && ny >= 0.3 && ny <= 0.85) return true;
      if (nx >= 0.7 && nx <= 0.92 && ny >= 0.42 && ny <= 0.72) return true;
      return false;
    }
  },
  // 24. Crown
  {
    id: 24,
    name: 'CROWN',
    width: 20,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.65 && ny <= 0.85 && Math.abs(nx - 0.5) <= 0.4) return true;
      if (ny >= 0.25 && ny <= 0.65) {
        if (Math.abs(nx - 0.2) <= 0.12 || Math.abs(nx - 0.5) <= 0.12 || Math.abs(nx - 0.8) <= 0.12) return true;
      }
      return false;
    }
  },
  // 25. Bell
  {
    id: 25,
    name: 'BELL',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.2 && ny <= 0.78) {
        const prog = (ny - 0.2) / 0.58;
        return Math.abs(nx - 0.5) <= 0.15 + prog * 0.25;
      }
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.78 && ny <= 0.92) return true;
      return false;
    }
  },
  // 26. Turtle
  {
    id: 26,
    name: 'TURTLE',
    width: 22,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.32, (ny - 0.5) / 0.3) <= 1) return true;
      if (nx >= 0.8 && nx <= 0.95 && Math.abs(ny - 0.5) <= 0.15) return true;
      if (Math.abs(nx - 0.5) <= 0.42 && (Math.abs(ny - 0.2) <= 0.1 || Math.abs(ny - 0.8) <= 0.1)) return true;
      return false;
    }
  },
  // 27. Panda
  {
    id: 27,
    name: 'PANDA',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.35, (ny - 0.55) / 0.32) <= 1) return true;
      if (Math.hypot((nx - 0.25) / 0.12, (ny - 0.22) / 0.12) <= 1) return true;
      if (Math.hypot((nx - 0.75) / 0.12, (ny - 0.22) / 0.12) <= 1) return true;
      return false;
    }
  },
  // 28. Rabbit
  {
    id: 28,
    name: 'RABBIT',
    width: 18,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.08 && ny <= 0.4 && (Math.abs(nx - 0.38) <= 0.08 || Math.abs(nx - 0.62) <= 0.08)) return true;
      if (Math.hypot((nx - 0.5) / 0.32, (ny - 0.65) / 0.28) <= 1) return true;
      return false;
    }
  },
  // 29. Sword
  {
    id: 29,
    name: 'SWORD',
    width: 16,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.1 && ny <= 0.65) return true;
      if (Math.abs(nx - 0.5) <= 0.4 && ny >= 0.65 && ny <= 0.73) return true;
      if (Math.abs(nx - 0.5) <= 0.08 && ny >= 0.73 && ny <= 0.92) return true;
      return false;
    }
  },
  // 30. Glasses
  {
    id: 30,
    name: 'GLASSES',
    width: 22,
    height: 16,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.28) / 0.2, (ny - 0.5) / 0.3) <= 1) return true;
      if (Math.hypot((nx - 0.72) / 0.2, (ny - 0.5) / 0.3) <= 1) return true;
      if (Math.abs(nx - 0.5) <= 0.12 && Math.abs(ny - 0.5) <= 0.08) return true;
      return false;
    }
  },
  // 31. Moon
  {
    id: 31,
    name: 'MOON',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      const inOuter = Math.hypot(nx - 0.5, ny - 0.5) <= 0.42;
      const inInner = Math.hypot(nx - 0.68, ny - 0.45) <= 0.36;
      return inOuter && !inInner;
    }
  },
  // 32. Sun
  {
    id: 32,
    name: 'SUN',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      return Math.hypot(nx - 0.5, ny - 0.5) <= 0.4;
    }
  },
  // 33. Flower
  {
    id: 33,
    name: 'FLOWER',
    width: 20,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot(nx - 0.5, ny - 0.5) <= 0.18) return true;
      if (Math.hypot(nx - 0.5, ny - 0.22) <= 0.18) return true;
      if (Math.hypot(nx - 0.5, ny - 0.78) <= 0.18) return true;
      if (Math.hypot(nx - 0.22, ny - 0.5) <= 0.18) return true;
      if (Math.hypot(nx - 0.78, ny - 0.5) <= 0.18) return true;
      return false;
    }
  },
  // 34. Anchor
  {
    id: 34,
    name: 'ANCHOR',
    width: 20,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.1 && ny >= 0.15 && ny <= 0.85) return true;
      if (Math.hypot(nx - 0.5, ny - 0.2) <= 0.15) return true;
      if (ny >= 0.65 && ny <= 0.9 && Math.abs(nx - 0.5) <= 0.42) return true;
      return false;
    }
  },
  // 35. Camel
  {
    id: 35,
    name: 'CAMEL',
    width: 22,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (nx >= 0.25 && nx <= 0.75 && ny >= 0.25 && ny <= 0.65) return true;
      if (nx >= 0.75 && nx <= 0.92 && ny >= 0.15 && ny <= 0.5) return true;
      if ((Math.abs(nx - 0.35) <= 0.08 || Math.abs(nx - 0.68) <= 0.08) && ny >= 0.65 && ny <= 0.95) return true;
      return false;
    }
  },
  // 36. Dinosaur
  {
    id: 36,
    name: 'DINOSAUR',
    width: 24,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (nx >= 0.05 && nx <= 0.3 && ny >= 0.4 && ny <= 0.6) return true;
      if (nx >= 0.28 && nx <= 0.72 && ny >= 0.35 && ny <= 0.7) return true;
      if (nx >= 0.68 && nx <= 0.92 && ny >= 0.12 && ny <= 0.45) return true;
      if (Math.abs(nx - 0.45) <= 0.1 && ny >= 0.68 && ny <= 0.95) return true;
      return false;
    }
  },
  // 37. Penguin
  {
    id: 37,
    name: 'PENGUIN',
    width: 18,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      return Math.hypot((nx - 0.5) / 0.32, (ny - 0.5) / 0.42) <= 1;
    }
  },
  // 38. Cactus
  {
    id: 38,
    name: 'CACTUS',
    width: 20,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.1 && ny <= 0.9) return true;
      if (nx >= 0.18 && nx <= 0.42 && ny >= 0.3 && ny <= 0.6) return true;
      if (nx >= 0.58 && nx <= 0.82 && ny >= 0.4 && ny <= 0.7) return true;
      return false;
    }
  },
  // 39. Cupcake
  {
    id: 39,
    name: 'CUPCAKE',
    width: 18,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.38) / 0.28) <= 1) return true;
      if (ny >= 0.45 && ny <= 0.88 && Math.abs(nx - 0.5) <= 0.32) return true;
      return false;
    }
  },
  // 40. Airplane
  {
    id: 40,
    name: 'AIRPLANE',
    width: 22,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.1 && ny <= 0.9) return true;
      if (ny >= 0.38 && ny <= 0.55 && Math.abs(nx - 0.5) <= 0.45) return true;
      if (ny >= 0.78 && ny <= 0.9 && Math.abs(nx - 0.5) <= 0.28) return true;
      return false;
    }
  },
  // 41. Shield
  {
    id: 41,
    name: 'SHIELD',
    width: 18,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny <= 0.5) return Math.abs(nx - 0.5) <= 0.4;
      const prog = (ny - 0.5) / 0.45;
      return Math.abs(nx - 0.5) <= (1 - prog) * 0.4;
    }
  },
  // 42. Lightning
  {
    id: 42,
    name: 'LIGHTNING',
    width: 18,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny <= 0.55 && Math.abs(nx - (0.65 - ny * 0.4)) <= 0.18) return true;
      if (ny > 0.45 && Math.abs(nx - (0.55 - (ny - 0.45) * 0.4)) <= 0.18) return true;
      return false;
    }
  },
  // 43. Ghost
  {
    id: 43,
    name: 'GHOST',
    width: 18,
    height: 20,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.4) / 0.3) <= 1) return true;
      if (ny >= 0.4 && ny <= 0.88 && Math.abs(nx - 0.5) <= 0.38) return true;
      return false;
    }
  },
  // 44. Palm Tree
  {
    id: 44,
    name: 'PALM TREE',
    width: 20,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.abs(nx - 0.5) <= 0.1 && ny >= 0.35 && ny <= 0.95) return true;
      if (Math.hypot((nx - 0.5) / 0.42, (ny - 0.28) / 0.2) <= 1) return true;
      return false;
    }
  },
  // 45. Helicopter
  {
    id: 45,
    name: 'HELICOPTER',
    width: 22,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.15 && ny <= 0.22 && Math.abs(nx - 0.45) <= 0.42) return true;
      if (Math.hypot((nx - 0.4) / 0.28, (ny - 0.5) / 0.25) <= 1) return true;
      if (nx >= 0.65 && nx <= 0.92 && Math.abs(ny - 0.45) <= 0.08) return true;
      return false;
    }
  },
  // 46. Dolphin
  {
    id: 46,
    name: 'DOLPHIN',
    width: 22,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.45) / 0.4, (ny - 0.45) / 0.25) <= 1) return true;
      if (nx >= 0.75 && nx <= 0.95 && Math.abs(ny - 0.65) <= 0.18) return true;
      return false;
    }
  },
  // 47. Crab
  {
    id: 47,
    name: 'CRAB',
    width: 22,
    height: 18,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.3, (ny - 0.55) / 0.25) <= 1) return true;
      if (Math.hypot((nx - 0.2) / 0.15, (ny - 0.3) / 0.18) <= 1) return true;
      if (Math.hypot((nx - 0.8) / 0.15, (ny - 0.3) / 0.18) <= 1) return true;
      return false;
    }
  },
  // 48. Castle
  {
    id: 48,
    name: 'CASTLE',
    width: 22,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (ny >= 0.4 && ny <= 0.9 && Math.abs(nx - 0.5) <= 0.42) return true;
      if (ny >= 0.18 && ny <= 0.5 && (Math.abs(nx - 0.2) <= 0.12 || Math.abs(nx - 0.8) <= 0.12)) return true;
      return false;
    }
  },
  // 49. Dragon
  {
    id: 49,
    name: 'DRAGON',
    width: 24,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.38, (ny - 0.5) / 0.32) <= 1) return true;
      if (nx >= 0.7 && nx <= 0.95 && ny >= 0.15 && ny <= 0.4) return true;
      if (nx <= 0.35 && ny >= 0.2 && ny <= 0.5) return true;
      return false;
    }
  },
  // 50. Trophy
  {
    id: 50,
    name: 'TROPHY',
    width: 22,
    height: 22,
    mask: (x, y, w, h) => {
      const nx = x / w;
      const ny = y / h;
      if (Math.hypot((nx - 0.5) / 0.32, (ny - 0.35) / 0.25) <= 1) return true;
      if (Math.abs(nx - 0.5) <= 0.45 && ny >= 0.22 && ny <= 0.45) return true;
      if (Math.abs(nx - 0.5) <= 0.12 && ny >= 0.55 && ny <= 0.78) return true;
      if (Math.abs(nx - 0.5) <= 0.32 && ny >= 0.78 && ny <= 0.92) return true;
      return false;
    }
  }
];

const DIRS = [
  { name: 'UP', dx: 0, dy: -1 },
  { name: 'DOWN', dx: 0, dy: 1 },
  { name: 'LEFT', dx: -1, dy: 0 },
  { name: 'RIGHT', dx: 1, dy: 0 }
];

function segKey(x1, y1, x2, y2) {
  if (x1 > x2 || (x1 === x2 && y1 > y2)) {
    return `${x2},${y2}-${x1},${y1}`;
  }
  return `${x1},${y1}-${x2},${y2}`;
}

function ptKey(x, y) {
  return `${x},${y}`;
}

/**
 * Anti-Self-Loop test:
 * Returns true if the arrow's head ray intersects ANY previous segment of its own body.
 * Prevents arrows from forming closed square loops or pointing into themselves.
 */
function arrowHitsSelf(path, dirName) {
  const head = path[path.length - 1];
  const dx = dirName === 'RIGHT' ? 1 : dirName === 'LEFT' ? -1 : 0;
  const dy = dirName === 'DOWN' ? 1 : dirName === 'UP' ? -1 : 0;

  // Test against all segments of this arrow except the one directly connecting into head
  for (let i = 0; i < path.length - 2; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    if (dx !== 0) {
      if (p1.x === p2.x) {
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        if (head.y >= minY && head.y <= maxY) {
          const dist = (p1.x - head.x) * dx;
          if (dist > 0) return true;
        }
      } else if (p1.y === p2.y && p1.y === head.y) {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const segClosest = dx > 0 ? minX : maxX;
        const dist = (segClosest - head.x) * dx;
        if (dist > 0) return true;
      }
    } else if (dy !== 0) {
      if (p1.y === p2.y) {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        if (head.x >= minX && head.x <= maxX) {
          const dist = (p1.y - head.y) * dy;
          if (dist > 0) return true;
        }
      } else if (p1.x === p2.x && p1.x === head.x) {
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        const segClosest = dy > 0 ? minY : maxY;
        const dist = (segClosest - head.y) * dy;
        if (dist > 0) return true;
      }
    }
  }
  return false;
}

/**
 * Returns rotational cross-product sign: +1 (clockwise) or -1 (counter-clockwise).
 */
function getTurnDirection(d1, d2) {
  const cross = d1.dx * d2.dy - d1.dy * d2.dx;
  return cross > 0 ? 1 : -1;
}

/**
 * Generates an Arrow Maze guaranteed 100% solvable with ZERO self-looping arrows.
 * High complexity & density: multi-cell straight runs, category-scaled labyrinth grids,
 * and deep dependency chains.
 */
export function generateArrowMaze(category = 'beginner', levelNum = 1) {
  const catDef = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const num = Math.max(1, Math.min(100, levelNum));

  // Pick shape from the 50 shapes catalogue
  const shapeIndex = (num - 1) % SHAPES_LIST.length;
  const baseShape = SHAPES_LIST[shapeIndex];

  // Category dimension scaling factor
  const catScale = {
    beginner: 1.0,
    intermediate: 1.15,
    advanced: 1.3,
    expert: 1.45,
    master: 1.6,
    hacker: 1.25
  }[catDef.id] || 1.0;

  // Progressive scaling across levels 1..100 (+20% gradual growth)
  const progScale = 1.0 + ((num - 1) / 99) * 0.2;
  const totalScale = catScale * progScale;

  const width = Math.round(baseShape.width * totalScale);
  const height = Math.round(baseShape.height * totalScale);
  const mask = baseShape.mask;

  // Target arrows interpolated across category range
  const targetArrows = Math.round(
    catDef.minArrows + ((num - 1) / 99) * (catDef.maxArrows - catDef.minArrows)
  );

  const seed = (catDef.id.charCodeAt(0) * 10007) + (num * 1013) + (shapeIndex * 73);
  const rng = pseudoRandom(seed);

  // Collect points inside shape mask
  const inShape = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask(x, y, width, height)) {
        inShape.push({ x, y });
      }
    }
  }

  // High-performance flat Uint8Arrays for sub-millisecond point and segment lookups
  // gridPts[y * width + x] = 1 if point occupied
  const gridPts = new Uint8Array(width * height);
  // hSeg[y * width + minX] = 1 if horizontal segment occupied
  const hSeg = new Uint8Array(width * height);
  // vSeg[minY * width + x] = 1 if vertical segment occupied
  const vSeg = new Uint8Array(width * height);

  let availablePoints = [...inShape];
  const placedArrows = [];

  function isRayClear(hx, hy, dir) {
    let curX = hx + dir.dx;
    let curY = hy + dir.dy;
    while (curX >= 0 && curX < width && curY >= 0 && curY < height) {
      const prevX = curX - dir.dx;
      const prevY = curY - dir.dy;
      if (dir.dx !== 0) {
        const minX = Math.min(prevX, curX);
        if (hSeg[curY * width + minX]) return false;
      } else {
        const minY = Math.min(prevY, curY);
        if (vSeg[minY * width + curX]) return false;
      }
      if (gridPts[curY * width + curX]) return false;
      curX += dir.dx;
      curY += dir.dy;
    }
    return true;
  }

  let attempts = 0;
  const maxAttempts = 6000;

  // Segment straight length allowed (1 to maxSegLen)
  const maxSegLen = catDef.id === 'beginner' ? 2 : (catDef.id === 'intermediate' ? 3 : 4);
  // Max turns: 1 to 3 turns (2 to 4 segments)
  const maxTurns = catDef.id === 'beginner' ? 2 : (catDef.id === 'intermediate' || catDef.id === 'hacker' ? 3 : 4);

  while (attempts < maxAttempts && placedArrows.length < targetArrows && availablePoints.length > 0) {
    attempts++;

    const startIdx = Math.floor(rng() * availablePoints.length);
    const startPt = availablePoints[startIdx];
    const path = [{ x: startPt.x, y: startPt.y }];
    let curPt = { ...startPt };

    const numSegments = 1 + Math.floor(rng() * maxTurns);
    let lastDir = null;
    let lastTurnRot = 0; // +1 or -1

    for (let seg = 0; seg < numSegments; seg++) {
      const possibleDirs = DIRS.filter(d => {
        // Can never go backwards
        if (lastDir && d.dx === -lastDir.dx && d.dy === -lastDir.dy) return false;

        // Anti-Loop rule: never turn twice in the exact same rotational direction (prevents square loop!)
        if (lastDir && (d.dx !== lastDir.dx || d.dy !== lastDir.dy)) {
          const turnRot = getTurnDirection(lastDir, d);
          if (lastTurnRot !== 0 && turnRot === lastTurnRot) {
            return false; // Forbid closing a box!
          }
        }

        const nx = curPt.x + d.dx;
        const ny = curPt.y + d.dy;
        if (!mask(nx, ny, width, height)) return false;
        if (gridPts[ny * width + nx]) return false;
        if (d.dx !== 0) {
          if (hSeg[curPt.y * width + Math.min(curPt.x, nx)]) return false;
        } else {
          if (vSeg[Math.min(curPt.y, ny) * width + curPt.x]) return false;
        }
        return true;
      });

      if (possibleDirs.length === 0) break;

      const chosenDir = possibleDirs[Math.floor(rng() * possibleDirs.length)];
      if (lastDir && (chosenDir.dx !== lastDir.dx || chosenDir.dy !== lastDir.dy)) {
        lastTurnRot = getTurnDirection(lastDir, chosenDir);
      }

      // Multi-cell straight run: gives arrows realistic length and creates labyrinth corridors
      const runLength = 1 + Math.floor(rng() * maxSegLen);
      for (let s = 0; s < runLength; s++) {
        const nx = curPt.x + chosenDir.dx;
        const ny = curPt.y + chosenDir.dy;
        if (!mask(nx, ny, width, height)) break;
        if (gridPts[ny * width + nx]) break;
        if (chosenDir.dx !== 0) {
          if (hSeg[curPt.y * width + Math.min(curPt.x, nx)]) break;
        } else {
          if (vSeg[Math.min(curPt.y, ny) * width + curPt.x]) break;
        }

        curPt = { x: nx, y: ny };
        path.push(curPt);
      }

      lastDir = chosenDir;
    }

    if (path.length < 2) continue;

    const head = path[path.length - 1];
    const headDir = lastDir;

    // Strict Anti-Self-Collision Check: Arrowhead must NEVER point towards its own body!
    if (arrowHitsSelf(path, headDir.name)) {
      continue;
    }

    // Must have clear exit ray out of current placed arrows
    if (!isRayClear(head.x, head.y, headDir)) {
      continue;
    }

    const arrowId = `arrow_${placedArrows.length + 1}`;
    const arrow = {
      id: arrowId,
      points: path,
      dir: headDir.name,
      dirVec: headDir,
      head: { ...head },
      tail: { ...path[0] }
    };

    for (let i = 0; i < path.length; i++) {
      gridPts[path[i].y * width + path[i].x] = 1;
      if (i > 0) {
        const p1 = path[i - 1];
        const p2 = path[i];
        if (p1.y === p2.y) {
          hSeg[p1.y * width + Math.min(p1.x, p2.x)] = 1;
        } else {
          vSeg[Math.min(p1.y, p2.y) * width + p1.x] = 1;
        }
      }
    }

    placedArrows.push(arrow);
    // Remove occupied points from availablePoints ONLY when an arrow is placed
    availablePoints = availablePoints.filter(p => !gridPts[p.y * width + p.x]);
  }

  // Reverse so that initially unblocked arrows can escape first
  placedArrows.reverse();

  // Time limit for Hacker mode: ~1.6s per arrow, min 30s, max 90s
  const timeLimit = catDef.isTimed ? Math.max(30, Math.min(90, Math.round(placedArrows.length * 1.6))) : 0;

  return {
    category: catDef.id,
    categoryName: catDef.name,
    levelNumber: num,
    shapeName: baseShape.name,
    isTimed: !!catDef.isTimed,
    timeLimit,
    width,
    height,
    arrows: placedArrows
  };
}

export function getCategoryDef(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
}
