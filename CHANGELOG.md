# Changelog

All notable changes to TREMOR.LIVE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source release preparation
- MIT License
- Contributing guidelines
- Code of Conduct
- Security policy
- GitHub issue and PR templates
- Improved documentation and badges

### Changed
- Removed hardcoded Convex URL for security
- Updated package.json with proper metadata
- Cleaned up console.log statements with proper logger utility

## [0.1.0] - 2025-01-09

### Added
- Initial release of TREMOR.LIVE
- Real-time prediction market monitoring from Polymarket
- Tremor intensity scoring algorithm (0-10 scale)
- Multi-timeframe analysis (5-minute, 1-hour, 24-hour windows)
- Smart data prioritization with hot/warm/cold market classification
- Intensity filtering (Extreme, High, Moderate, Low)
- Visual indicators with color-coded intensity bars
- Automated data retention and cleanup
- Real-Time Social Intelligence powered by Grok AI
- X/Twitter source citations for market movements
- Responsive design for desktop and mobile
- Dark theme optimized for data visualization
- Convex backend for real-time data synchronization
- Next.js 15.5 with App Router and Turbopack

### Technical Stack
- Framework: Next.js 15.5.2
- Database: Convex (real-time, reactive)
- Language: TypeScript
- Styling: Tailwind CSS
- AI: Grok API for social intelligence
- Deployment: Vercel

[Unreleased]: https://github.com/sculptdotfun/tremor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sculptdotfun/tremor/releases/tag/v0.1.0