# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- [Convex](https://convex.dev) account
- [Vercel](https://vercel.com) account (or similar platform)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/sculptdotfun/tremor.git
cd tremor
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```env
# Convex Deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Convex Backend Deployment

### Initial Setup

```bash
# Login to Convex
npx convex login

# Initialize deployment
npx convex init

# Deploy to production
npx convex deploy --prod
```

### Database Initialization

After deployment, cron jobs will automatically start syncing data from Polymarket.

Expected cron schedule:

- Event sync: Every 2 minutes
- Hot markets: Every 15 seconds
- Warm markets: Every minute
- Cold markets: Every 5 minutes
- Scoring: Every minute
- Cleanup: Daily at 3 AM UTC

## Frontend Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Self-Hosted

Build for production:

```bash
pnpm build
pnpm start
```

Docker example:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Convex deployment successful
- [ ] Cron jobs running
- [ ] Frontend builds without errors
- [ ] Mobile responsiveness tested

## Monitoring

Check Convex dashboard for:

- Function execution logs
- Cron job status
- Database usage
- Error rates

## Troubleshooting

### No data showing

```bash
# Check cron jobs
npx convex logs --prod | grep cron

# Manually trigger sync
npx convex run syncEvents --prod
```

### Scores not updating

```bash
# Check scoring function
npx convex run computeScores --prod
```

### High Convex usage

- Adjust sync frequencies in `convex/crons.ts`
- Increase data cleanup frequency

## Updates

```bash
# Backend update
npx convex deploy --prod

# Frontend update
vercel --prod
```

## Rollback

```bash
# Convex rollback
npx convex deploy --prod --version previous-version

# Vercel rollback
vercel rollback
```

---

_Last updated: January 2025_
