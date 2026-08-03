# Javascript RPG - Modern Edition (Vite + React + TypeScript)

This is a modernized version of the 2D Javascript RPG. Originally imported from `faireye-hive/Javascript-RPG`, it has been upgraded to a **Vite + React + TypeScript + Tailwind CSS** architecture with sound effects, customizable menus, persistent game state, and zero-config deployment to **GitHub Pages**.

## 🎮 Features

- **Start & Pause Menu**: Play New Game, Resume Game, Settings, Controls, and GitHub Pages Deploy Guide.
- **Audio Sound Effects & Retro BGM**: Integrated Web Audio API retro sound synthesizer with volume controls for sword slashes, enemy hits, victory chime, and ambient melody.
- **Persistent Game State**: Auto-saves your map position, explored tiles, and stats in `localStorage`.
- **In-Game HUD Overlay**: Displays coordinates `(X, Y)`, enemies slain, time elapsed, mute button, and pause button.
- **Virtual D-Pad**: Touch controls support for mobile and tablet devices.
- **GitHub Pages Ready**: Configured with `base: './'` in `vite.config.ts` for instant deployment on static hosts like GitHub Pages.

## 🚀 How to Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## 🌐 Deploy to GitHub Pages

### Method 1: `gh-pages` CLI

1. Install helper package:
   ```bash
   npm install -D gh-pages
   ```
2. Add scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run deploy:
   ```bash
   npm run deploy
   ```

### Method 2: GitHub Actions

Push to your GitHub repository and set up `.github/workflows/deploy.yml` to automatically build and deploy `dist/` on push to `main`.
