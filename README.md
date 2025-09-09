# 🌊 TREMOR.LIVE

> **"Money talks before headlines drop."**

A real-time seismic monitor for prediction markets. When probabilities shift dramatically, TREMOR detects the movement—surfacing market earthquakes before they become mainstream news.

<div align="center">
  
[![Live Demo](https://img.shields.io/badge/🔴_LIVE-tremor.live-red?style=for-the-badge)](https://tremor.live)
[![Status](https://img.shields.io/badge/Version-v0.1--alpha-yellow?style=for-the-badge)](https://github.com/yourusername/seismo)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

## 🎯 What is TREMOR?

Imagine a seismograph, but for prediction markets. TREMOR continuously monitors ~500 active markets on Polymarket, detecting when significant price movements occur. Each "tremor" is scored on a 0-10 intensity scale—just like earthquakes:

- 🔴 **EXTREME (7.5+)**: Market-shaking events. The equivalent of a major earthquake.
- 🟠 **HIGH (5.0-7.5)**: Significant movements that demand attention.
- 🟡 **MODERATE (2.5-5.0)**: Notable activity worth monitoring.
- ⚪ **LOW (0-2.5)**: Minor fluctuations in the market landscape.

### Why It Matters

Prediction markets aggregate collective intelligence. When smart money moves, it often signals:

- Breaking news before it breaks
- Shifting consensus on future events
- Emerging risks or opportunities
- Real-time probability updates on world events

TREMOR helps you catch these signals as they happen, not hours later.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/seismo.git
cd seismo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Convex deployment URL

# Run development server
pnpm dev

# Open http://localhost:3000
```

## 📊 How It Works

### The Data Pipeline

```mermaid
graph LR
    A[Polymarket API] -->|Raw Data| B[Convex Backend]
    B -->|Process| C[Price Snapshots]
    C -->|Analyze| D[Intensity Scoring]
    D -->|Stream| E[Real-time UI]
    B -->|AI Analysis| F[Market Context]
    F --> E
```

### Intelligent Monitoring

TREMOR doesn't treat all markets equally:

| Market Type | Volume      | Sync Frequency   | Why                  |
| ----------- | ----------- | ---------------- | -------------------- |
| 🔥 **HOT**  | >$50k daily | Every 15 seconds | Where the action is  |
| 🌡️ **WARM** | $5k-50k     | Every minute     | Active but stable    |
| ❄️ **COLD** | <$5k        | Every 5 minutes  | Low activity markets |

### The Scoring Algorithm (v2)

Our intensity scoring maps price changes to seismic-like measurements:

```
Price Change → Intensity Score
1pp  → 1.0 (barely felt)
5pp  → 5.0 (moderate shake)
10pp → 7.5 (significant event)
20pp → 10.0 (maximum intensity)
```

With smart volume filtering:

- <$1,000 volume: No score (too small to matter)
- $1,000-10,000: Gradual amplification
- > $10,000: Full intensity scoring

## 🏗️ Architecture Highlights

### Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Convex (reactive database + serverless)
- **Styling**: Tailwind CSS
- **Data Source**: Polymarket Gamma API
- **Deployment**: Vercel

### Key Features

- ⚡ Real-time updates via reactive queries
- 📈 Multi-timeframe analysis (5min/1hr/24hr)
- 🤖 AI-powered market explanations
- 📱 Responsive design for all devices
- 🔄 Automatic data retention management
- 📊 ~50k daily price snapshots processed

## 📁 Project Structure

```
seismo/
├── app/                    # Next.js app router
│   ├── components/        # React components
│   │   ├── Header.tsx    # Navigation
│   │   ├── Sidebar.tsx   # Filters & controls
│   │   ├── TremorCard.tsx # Market cards
│   │   └── ...
│   └── page.tsx          # Main dashboard
├── convex/               # Backend logic
│   ├── events.ts        # Event management
│   ├── markets.ts       # Market operations
│   ├── scores.ts        # Intensity calculations
│   └── crons.ts         # Scheduled tasks
├── docs/                # Documentation
└── lib/                 # Utilities
```

## 🎮 v0 Status & Roadmap

### Current Status (v0.1-alpha)

This is an early alpha release. We're live and processing real data, but expect:

- Occasional quirks in scoring edge cases
- UI polish opportunities
- Feature gaps we're actively filling

### Coming Soon (v0.2)

#### 🎲 **Kalshi Integration**

- Dual-market monitoring (Polymarket + Kalshi)
- Arbitrage opportunity detection
- Cross-market tremor correlation

#### 📊 **Enhanced Data Sync**

- WebSocket connections for instant updates
- Historical data analysis
- Custom alert thresholds

#### 🏆 **Scoring Evolution (v3)**

- Machine learning-based intensity prediction
- Sentiment analysis from order flow
- Social signal integration

#### 🔔 **Notifications & Alerts**

- Push notifications for extreme tremors
- Custom watchlists
- Telegram/Discord bot integration

#### 📈 **Analytics Dashboard**

- Personal tremor history
- Market performance tracking
- Accuracy metrics for predictions

### Future Vision (v1.0)

- Multiple prediction market sources
- Advanced filtering and search
- API for developers
- Mobile app
- Premium features for power users

## 🤝 Contributing

We're building in public! Contributions welcome:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## 📖 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Get it running in production
- [Architecture](docs/ARCHITECTURE.md) - Technical deep dive
- [Scoring Algorithm](docs/SCORING.md) - How intensity is calculated
- [API Reference](docs/API.md) - Convex function documentation
- [Roadmap](docs/ROADMAP.md) - Where we're heading

## 📊 Live Stats

Currently monitoring:

- ~500 active prediction markets
- Processing ~50k price snapshots daily
- Computing ~1.4k intensity scores daily
- Serving real-time updates to all users

## 🙏 Acknowledgments

Built with:

- [Polymarket](https://polymarket.com) for market data
- [Convex](https://convex.dev) for the reactive backend
- [Vercel](https://vercel.com) for deployment
- Coffee ☕ and late nights 🌙

## 📝 License

MIT - see [LICENSE](LICENSE) file for details

---

<div align="center">

**[tremor.live](https://tremor.live)** | Built with 🌊 by the TREMOR team

_Detecting market earthquakes before they make headlines._

</div>
