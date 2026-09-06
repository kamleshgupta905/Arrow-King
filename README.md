# 👑 Arrow King

> **The Ultimate Vector Arrow Maze Puzzle Game**  
> 600 Solvable Levels • 6 Tiers • Zero Self-Collisions • Fast-Paced Hacker Timed Mode

![Arrow King Banner](https://raw.githubusercontent.com/kamleshgupta905/Arrow-King/main/public/favicon.svg)

---

## 🎮 Overview
**Arrow King** is a minimalist, beautifully crafted puzzle game where players tap interwoven arrows in the exact sequence required to clear them from the board without collisions.

### ✨ Key Features
- **👑 600 Handcrafted Levels**: 100 levels across 6 distinct difficulty tiers:
  - **Beginner** (100 Levels): Gentle introductions to cornering and priority unblocking.
  - **Intermediate** (100 Levels): Complex multi-turn arrows and density puzzles.
  - **Advanced** (100 Levels): Intricate spatial mazes requiring deep forward planning.
  - **Expert** (100 Levels): Master-level track sequences with tight clearances.
  - **Master** (100 Levels): Grandmaster challenges for true puzzle connoisseurs.
  - **⚡ Hacker** (100 Levels - Timed Mode): Race against an active countdown timer! If time expires, the board auto-restarts.
- **🚫 Zero Self-Collisions**: Mathematically guaranteed clean vector paths. Arrows never loop onto themselves or point at their own body.
- **💫 Realistic Slither Mechanics**:
  - Unblocked arrows slither fluidly off the board like sleek snakes.
  - Obstructed arrows slither forward, impact the blocking arrow with sparks and a shudder, and recoil back to their starting position.
- **⭐ 3-Star Lives System**: Each collision costs 1 star. If all 3 stars are lost, the level automatically resets.
- **⚡ Zero Gradients & Flat Aesthetic**: Human-crafted, sleek minimalist design with pure solid colors, tactile controls, and high-DPI canvas rendering.
- **📱 Offline & Mobile Ready**: Built with responsive touch controls, sound effects synthesizer, and installable as an Android APK.

---

## 🚀 Quick Start (Web)

```bash
# Clone the repository
git clone https://github.com/kamleshgupta905/Arrow-King.git
cd Arrow-King

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

---

## 📱 Android APK Download

Every commit to `main` automatically triggers our **GitHub Actions CI/CD Pipeline**, compiling a native Android APK:

1. Navigate to the **[Actions Tab](https://github.com/kamleshgupta905/Arrow-King/actions)**.
2. Click on the latest workflow run.
3. Download the **`ArrowKing-Debug-APK`** artifact, install on your Android device, and play!

---

## 🛠 Tech Stack
- **Engine**: Pure Vanilla JavaScript (ES Modules) + High-DPI HTML5 Canvas
- **Bundler**: Vite 5
- **Audio**: Web Audio API Procedural Synthesizer (Zero external audio asset lag)
- **Mobile Runtime**: Capacitor 6 (Android)
- **CI/CD**: GitHub Actions (Java 17 + Gradle APK Builder)

---

## 📄 License
MIT License © 2026 Kamlesh Gupta.
