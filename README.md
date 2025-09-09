# TREMOR.LIVE

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Realtime-orange)](https://convex.dev/)

Real-time prediction market tremor monitoring dashboard that tracks and visualizes market movements with intensity scoring.

<!-- ![TREMOR.LIVE Dashboard](https://github.com/sculptdotfun/tremor/assets/tremor-preview.png) -->

## Overview

TREMOR.LIVE monitors prediction markets from Polymarket in real-time, calculating "tremor intensity" scores based on price movements, volume, and market volatility. The dashboard provides instant insights into significant market shifts and emerging trends.

## Features

- **Real-time Market Monitoring** - Tracks prediction markets every 15-60 seconds
- **Tremor Intensity Scoring** - 0-10 scale quantifying market movement significance
- **Multi-timeframe Analysis** - 5-minute, 1-hour, and 24-hour windows
- **Smart Data Prioritization** - Hot/warm/cold market classification for efficient syncing
- **Intensity Filtering** - Filter movements by intensity levels (Extreme, High, Moderate, Low)
- **Visual Indicators** - Color-coded intensity bars and category badges
- **Automated Data Retention** - Daily cleanup to maintain optimal performance

## Tech Stack

- **Framework:** Next.js 15.5.2 with App Router & Turbopack
- **Database:** Convex (real-time, reactive database)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **API:** Polymarket Gamma API
- **Deployment:** Vercel
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Convex account
- Polymarket API access

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment_name
```

### Development

```bash
# Start Convex dev server
pnpm convex dev

# In another terminal, start Next.js
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Deployment

```bash
# Deploy to Convex
pnpm convex deploy

# Deploy to Vercel
vercel
```

## Architecture

### Data Flow

```
Polymarket API → Convex Actions → Database → Scoring Engine → React Frontend
```

### Database Schema

- **events** - Prediction market events with metadata
- **markets** - Individual markets within events
- **priceSnapshots** - Time-series price data (7-day retention)
- **scores** - Computed intensity scores (24-hour retention)
- **baselines** - Statistical baselines for normalization
- **marketSyncState** - Sync priority tracking

### Sync Schedule

- **Hot Markets:** Every 15 seconds (high activity)
- **Warm Markets:** Every 60 seconds (moderate activity)
- **Events:** Every 2 minutes (metadata updates)
- **Scoring:** Every minute (intensity calculations)
- **Baselines:** Daily at 2 AM UTC
- **Cleanup:** Daily at 3 AM UTC

## Intensity Scoring

The Seismo score (0-10) is calculated based on:
- Price movement magnitude
- Trading volume
- Market volatility
- Statistical deviation from baseline

### Intensity Levels

- **🔴 EXTREME** (7.5+): Major market disruption
- **🟠 HIGH** (5.0-7.5): Significant movement
- **🟡 MODERATE** (2.5-5.0): Notable activity
- **⚪ LOW** (0-2.5): Minor fluctuations

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm typecheck    # Run TypeScript checking
pnpm convex dev   # Start Convex dev server
pnpm convex deploy # Deploy to Convex production
```

## Project Structure

```
tremor-live/
├── app/              # Next.js App Router
├── components/       # React components
│   ├── header.tsx   # Main navigation
│   ├── sidebar.tsx  # Filters and controls
│   └── tremor-card.tsx # Market movement cards
├── convex/          # Backend functions
│   ├── actions.ts   # API sync actions
│   ├── scoring.ts   # Intensity calculations
│   ├── cleanup.ts   # Data retention
│   └── schema.ts    # Database schema
├── lib/             # Utilities and types
└── public/          # Static assets
```

## Performance

- Handles ~500 active markets
- Processes ~50k price snapshots/day
- Computes ~1.4k intensity scores/day
- Automatic data cleanup prevents unbounded growth

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Security

For security vulnerabilities, please review our [Security Policy](SECURITY.md) and report issues privately.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Polymarket](https://polymarket.com) for providing market data APIs
- [Convex](https://convex.dev) for real-time backend infrastructure
- [Vercel](https://vercel.com) for hosting and deployment
- All contributors who help improve TREMOR.LIVE

## Support

- **Issues**: [GitHub Issues](https://github.com/sculptdotfun/tremor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sculptdotfun/tremor/discussions)
- **Documentation**: [Wiki](https://github.com/sculptdotfun/tremor/wiki)