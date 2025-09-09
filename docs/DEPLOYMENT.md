# 🚀 Deployment Guide

> Getting TREMOR.LIVE into production

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- A [Convex](https://convex.dev) account
- A [Vercel](https://vercel.com) account (or similar deployment platform)
- Access to environment variables

## 🔧 Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/sculptdotfun/tremor.git
cd tremor
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` with:

```env
# Convex Deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## 📦 Convex Backend Deployment

### Initial Setup

```bash
# Login to Convex
npx convex login

# Initialize new deployment
npx convex init

# Deploy to production
npx convex deploy --prod
```

### Database Initialization

After deployment, the cron jobs will automatically:

1. Start syncing events from Polymarket
2. Begin collecting price snapshots
3. Calculate intensity scores
4. Generate baselines

Initial data population takes ~30 minutes.

### Monitoring Cron Jobs

View active cron jobs:

```bash
npx convex logs --prod
```

Expected cron schedule:

- Event sync: Every 2 minutes
- Hot markets: Every 15 seconds
- Warm markets: Every minute
- Cold markets: Every 5 minutes
- Scoring: Every minute
- Cleanup: Daily at 3 AM UTC

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts to:
# - Link to your Vercel account
# - Configure project settings
# - Set environment variables
```

### Option 2: Self-Hosted

Build for production:

```bash
pnpm build
pnpm start
```

For Docker deployment:

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

### Option 3: Other Platforms

The app works with any Node.js hosting:

- Railway
- Render
- Fly.io
- AWS Amplify
- Netlify (with Next.js adapter)

## 🔍 Production Checklist

### Pre-Launch

- [ ] Environment variables configured
- [ ] Convex deployment successful
- [ ] Cron jobs running
- [ ] Initial data synced (~500 events)
- [ ] Frontend builds without errors
- [ ] Mobile responsiveness tested

### Post-Launch Monitoring

- [ ] Check Convex dashboard for errors
- [ ] Monitor cron job execution
- [ ] Verify real-time updates working
- [ ] Test intensity scoring accuracy
- [ ] Check data retention cleanup

## 📊 Performance Optimization

### Database Indexes

Already configured in schema:

- `by_event_id` on markets
- `by_market_id_and_timestamp` on snapshots
- `by_event_id` on scores

### Caching Strategy

- Static assets: 1 year cache
- API responses: No cache (real-time data)
- Images: Optimized with Next.js Image

### Rate Limiting

Built-in protection:

- Polymarket API: Respects rate limits
- Convex functions: Automatic scaling
- Frontend queries: Debounced

## 🚨 Troubleshooting

### Common Issues

#### "No data showing"

```bash
# Check if cron jobs are running
npx convex logs --prod | grep cron

# Manually trigger sync
npx convex run syncEvents --prod
```

#### "Scores not updating"

```bash
# Check scoring function
npx convex run computeScores --prod

# Verify baselines exist
npx convex run computeBaselines --prod
```

#### "High Convex usage"

- Reduce sync frequencies in `convex/crons.ts`
- Increase data retention cleanup frequency
- Optimize query patterns

## 🔄 Updates & Rollbacks

### Deploying Updates

```bash
# Backend update
npx convex deploy --prod

# Frontend update
vercel --prod
```

### Rollback Procedure

```bash
# Convex rollback
npx convex deploy --prod --version previous-version

# Vercel rollback
vercel rollback
```

## 📈 Scaling Considerations

### Current Capacity

- Handles ~500 concurrent markets
- Processes ~50k snapshots daily
- Serves 1000+ concurrent users

### Scaling Options

1. **Increase sync frequencies** - More real-time data
2. **Add more markets** - Expand coverage
3. **Implement caching layer** - Reduce database load
4. **Use CDN** - Faster global access

## 🔐 Security

### Best Practices

- Keep dependencies updated
- Use environment variables for secrets
- Enable CORS protection
- Implement rate limiting
- Monitor for anomalies

### Regular Maintenance

```bash
# Update dependencies
pnpm update

# Security audit
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

## 📞 Support

Running into issues?

- Check [GitHub Issues](https://github.com/sculptdotfun/tremor/issues)
- Join our [Discord](https://discord.gg/tremor)
- Email: support@tremor.live

---

_Last updated: January 2025_
