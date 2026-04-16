# 🎮 Bal Tycoon Online

**Bal Tycoon Online** is a free, open-source multiplayer idle tycoon game set in the cyberpunk world of **Aetheria**. Build your syndicate from zero, dominate global markets, form clans, trade stocks, and chat with rival tycoons — all in real time.

> **Play it, fork it, improve it. No restrictions.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖱️ **Idle Economy** | 20 upgrade tiers from Script Kiddie to Singularity — passive income 24/7 |
| 🏢 **Corporate Layer** | Hire workers, build facilities, manage B2B contracts and production chains |
| 📈 **Global Stock Exchange** | Real-time prices shared across all players — buy, sell, earn dividends |
| ⚔️ **Rivals & Diplomacy** | Spy on competitors, declare rivalries, improve relations |
| 🏴 **Clans** | Create or join clans, pool resources, compete on clan leaderboards |
| 🥂 **Personal Life** | Manage stress, buy luxury items, attend social events, build prestige |
| 💬 **Real-time Chat** | Global, clan, and direct messages via Socket.IO |
| 🏆 **60 Achievements** | From your first hack to simulation-master |
| 🏙️ **3D City View** | See your empire rendered live in Three.js |
| 🎨 **6 Visual Themes** | Void, Midnight, Forest, Nebula, Magma, Slate |
| 🖥️ **Desktop App** | Optional Tauri 2 build for Windows, macOS, Linux |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, Framer Motion, Three.js, Recharts, Zustand |
| **Backend** | Node.js 22, Express, Socket.IO 4, TypeScript, esbuild |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Reverse Proxy** | Nginx |
| **Containers** | Docker + Docker Compose |
| **Desktop** | Tauri 2 (optional) |

---

## 🚀 Quick Start with Docker

### Requirements
- Docker 24+ and Docker Compose v2

### 1. Clone
```bash
git clone https://github.com/xandru582/Bal-Tycoon-Online.git
cd Bal-Tycoon-Online
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
# Generate secrets: openssl rand -hex 32
```

### 3. Launch
```bash
docker compose up -d
```

Open **http://localhost**, register an account, and start your empire. That's it.

---

## 💻 Local Development

### Backend
```bash
cd backend
cp .env.example .env   # fill DATABASE_URL, REDIS_URL, JWT secrets
npm install
npm run dev            # http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (proxies /api → :3001)
```

### Desktop (Tauri)
```bash
npm install
npm run tauri dev
```

---

## 📁 Project Structure

```
Bal-Tycoon-Online/
├── backend/                  # Node.js + Express API + Socket.IO
│   └── src/
│       ├── core/economy/     # Game engine (EconomyEngine, Stocks, Contracts, Rivals)
│       ├── routes/           # REST endpoints (auth, game, market, chat, clans...)
│       ├── services/         # Business logic
│       ├── websocket/        # Socket.IO event handlers
│       └── jobs/             # Game loop (1s tick), auction cron
├── frontend/                 # React SPA — server-synced multiplayer
│   └── src/
│       ├── views/            # Dashboard, Market, StockExchange, Social, City...
│       ├── stores/           # Zustand state (game, auth, chat)
│       ├── components/       # UI primitives, ChatPanel, 3D CityScene
│       └── hooks/            # useGameSync (WebSocket ↔ Zustand bridge)
├── src/                      # Tauri desktop version (offline, single-player)
├── docker/                   # Nginx config, PostgreSQL init SQL
├── docker-compose.yml
└── .env.example
```

---

## 🤝 Contributing

**All contributions are welcome** — code, balance tweaks, bug reports, translations, UI improvements, anything.

### How to contribute

1. **Fork** this repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe what you did"`
4. Push: `git push origin feat/your-feature`
5. **Open a Pull Request** — describe what you changed and why

### Good first issues

Check the [Issues tab](https://github.com/xandru582/Bal-Tycoon-Online/issues) — these are tagged for new contributors:

- 📱 Mobile-responsive layout
- 📊 More stock tickers with lore
- 🌍 Localization / i18n (English first, then any language)
- 🧪 Unit tests with Vitest
- ⚖️ Economy balance & upgrade curve tuning
- 🎨 New visual themes

### Code guidelines
- TypeScript strict mode — no `any` without a comment explaining why
- One responsibility per file
- Keep backend async/await, no callbacks
- No unused imports

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## 🗺️ Roadmap

- [ ] In-game tutorial / onboarding flow
- [ ] PvP market attacks and sabotage events
- [ ] Auction house for buildings between players
- [ ] Prestige system with persistent cross-run bonuses
- [ ] Season events with leaderboard prizes
- [ ] Discord bot for game notifications
- [ ] Mobile app (Capacitor or React Native)
- [ ] Admin dashboard for server operators
- [ ] Localization (English, French, German...)

Have an idea? [Open an issue](https://github.com/xandru582/Bal-Tycoon-Online/issues/new) — we'd love to hear it.

---

## 📄 License

**MIT** — free to use, modify, distribute, and build on, for any purpose.

See [LICENSE](LICENSE) for full terms.

---

*Fork it. Break it. Make it better.*
