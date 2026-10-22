# The Crown That Held the Dark
### *A Whimsical Storybook Action-Platformer*

[![Integrity Tests](https://img.shields.io/badge/Integrity%20Audit-86%2F86%20PASSED-success?style=flat-square)](scripts/verify_game_integrity.cjs)
[![Engine](https://img.shields.io/badge/Phaser-4.2.1-blue?style=flat-square)](https://phaser.io/)
[![Build](https://img.shields.io/badge/Vite-8.3.5-646CFF?style=flat-square)](https://vitejs.dev/)
[![Language](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=flat-square)](https://www.typescriptlang.org/)

> **"A kingdom is not forged from gold or stone, but from the memories of those who wander beneath its skies."**

**The Crown That Held the Dark** is a 2D indie action-platformer built with Phaser 4 and TypeScript. Styled as an interactive, hand-drawn fantasy storybook, the game takes players through the fall, corruption, and dawn of the kingdom of Lumenfall.

---

## 🎨 Art Direction

The game features an authentic, hand-drawn 2D indie storybook aesthetic:
- **Warm Charcoal Ink Outlines:** Slightly wobbly, organic ink lines (`#2c221e`) giving every character, prop, and platform a hand-inked illustration feel.
- **Earthy Pastel Palette:** Warm parchment creams, moss greens, dusty teals, terracotta corals, soft ochres, and restrained corruption plums.
- **Cel Shading & Minimalist Depth:** Soft hand-painted lighting without sterile gradients, plastic 3D shaders, or pixel-art dithering.
- **Storybook Codex Interface:** Illuminated manuscript dialogue panels, parchment HUD pill badges, and wax-sealed codex modals.

---

## 📖 Story & Journey

Follow a young wanderer and an ancient guardian mascot across six story acts:

| Act | Title | Setting & Objective |
| :---: | :--- | :--- |
| **Prologue** | *Echoes of Lumenfall* | The coronation of King Aurel and the tragic awakening of the void crown. |
| **Act I** | *Lumenfall Outskirts* | Wake in the peaceful outskirts, rescue your companion mascot, and learn sword combat against roaming forest slimes. |
| **Act II** | *The Corrupted Lands* | Venture past deadwood trees and purple-tinged blight, overcoming corrupted beasts and reading ancient murals. |
| **Act III** | *The Forgotten Sanctuary* | Navigate sacred stone ruins, collect 40 golden coins to forge the Castle Key, and overcome the Sanctuary Chimera. |
| **Act IV** | *Castle Ramparts & Grand Throne* | Ascend sunset castle battlements, bypass royal automated defenses, and confront the corrupted King Aurel on his throne. |
| **Act V** | *The Shattered Arena* | Enter the cosmic void rift. Awaken the 3 Memory Anchors, face the Void Colossus, and make the fateful nonlethal choice. |
| **Epilogue** | *A Kingdom Without a Crown* | Walk the restored sunlit hills alongside the redeemed king, celebrating a peaceful dawn without tyrannical crowns. |

---

## ⚔️ Controls

| Action | Primary Key | Secondary / Mouse |
| :--- | :---: | :---: |
| **Move Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> | <kbd>←</kbd> / <kbd>→</kbd> |
| **Jump** | <kbd>W</kbd> / <kbd>Space</kbd> | <kbd>↑</kbd> |
| **Climb Ladder** | <kbd>W</kbd> (Up) / <kbd>S</kbd> (Down) | <kbd>↑</kbd> / <kbd>↓</kbd> |
| **Attack (3-Hit Combo)** | <kbd>J</kbd> | <kbd>Z</kbd> / Left Click |
| **Guard / Block** | <kbd>Shift</kbd> | <kbd>C</kbd> / Right Click |
| **Lumen Blade (Skill Wave)**| <kbd>K</kbd> | <kbd>X</kbd> / Skill UI Button |
| **Interact / Talk / Read** | <kbd>E</kbd> | <kbd>Enter</kbd> |
| **Codex / Pause / Story Guide**| <kbd>Esc</kbd> | Controls UI Button |
| **Toggle Mute / Sound** | <kbd>M</kbd> | Sound UI Badge |

---

## 🛠️ Tech Stack & Architecture

- **Core Game Engine:** [Phaser 4](https://phaser.io/) with Arcade Physics and custom fixed-timestep delta synchronization.
- **Build Tooling:** [Vite 8](https://vitejs.dev/) with instantaneous HMR and optimized production asset chunking.
- **Language:** Strict [TypeScript](https://www.typescriptlang.org/) with typed game state, scene parameters, and narrative milestones.
- **UI & Styling:** Vanilla CSS design system using CSS custom properties, styled parchment cards, and Google Fonts (**Cinzel** and **Outfit**).
- **Asset Suite:** Hand-drawn vector SVGs (`public/assets/svg/`) and sliced 2D sprite sheets for characters, bosses, and seamless ground tiles.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) (version 9 or later)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
npm install
```

### Running Locally (Development Server)
```bash
npm run dev
```
Open `http://localhost:3000/` in your browser to play the game with hot-reload enabled.

### Automated Integrity Testing
Run the 86-test verification suite covering character portraits, NPC sheets, boss animations, tile assets, platform reach mathematics, economy balance, and narrative milestones:
```bash
npm test
```

### Building for Production
```bash
npm run build
```
Compiled, production-ready static assets are output to the [`dist/`](dist/) folder.

### Previewing the Production Build
```bash
npm run preview
```

---

## 🌐 Deployment

The production build in `dist/` is configured with relative base paths (`base: './'`), making it deployable on any static hosting provider out of the box:

### Vercel / Netlify / Cloudflare Pages
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### GitHub Pages
1. Build the production output: `npm run build`
2. Push the contents of the `dist/` directory to your `gh-pages` branch, or setup GitHub Actions:
```yaml
name: Deploy Game to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

### itch.io (HTML5 Playable)
1. Run `npm run build`.
2. Zip the contents of the `dist/` directory (make sure `index.html` is at the root of the archive).
3. Upload the `.zip` file as an HTML5 web playable game on itch.io.

---

## 📁 Repository Structure

```
gamer/
├── dist/                  # Built static production bundle
├── public/                # Public static game assets
│   ├── assets/
│   │   ├── sprites/       # Hero, Mascot, NPC, and Boss sprite sheets
│   │   ├── svg/           # Storybook vector items, crates, relics, and UI
│   │   ├── tiles/         # Seamless ground and platform textures (Acts 1-5)
│   │   └── audio/         # Sound effects and ambient audio
│   └── favicon.ico        # Storybook mascot icon
├── scripts/               # Offline asset slicing and 86-step integrity test runner
│   └── verify_game_integrity.cjs
├── src/
│   ├── core/              # GameMaster, StrategicLayoutEngine, AudioDirector
│   ├── scenes/            # Boot, Preloader, Title, Acts 1-5, and Epilogue scenes
│   ├── systems/           # GameState, DialogueDirector, SaveSystem, InputManager
│   ├── main.ts            # Entrypoint and Phaser configuration
│   └── style.css          # Storybook design system, HUD tokens, and modals
├── index.html             # Main HTML entry with storybook typography
├── tsconfig.json          # TypeScript compiler configuration
├── vite.config.ts         # Vite build configuration with relative base path
└── package.json           # Dependencies and project scripts
```

---

## 📜 License & Credits

Created with ❤️ for whimsical indie fantasy adventure fans. Built using Phaser, Vite, and hand-crafted vector art.
