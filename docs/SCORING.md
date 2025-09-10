# 📊 TREMOR Intensity Scoring

> How we measure market earthquakes

## The Concept

Just like seismologists measure earthquakes on the Richter scale, TREMOR measures prediction market movements on an intensity scale. When probabilities shift dramatically, we detect and quantify the "tremor" in the market.

## 🎯 Scoring Scale (0-10)

Our intensity scale maps market movements to easily understood severity levels:

```
┌──────────────────────────────────────────────────────┐
│  0    1    2.5      5.0        7.5           10      │
│  │────│─────│────────│──────────│─────────────│      │
│  ⚪ LOW   🟡 MODERATE  🟠 HIGH    🔴 EXTREME          │
└──────────────────────────────────────────────────────┘
```

### Real-World Examples

| Score | Intensity   | Market Example                 | Earthquake Equivalent |
| ----- | ----------- | ------------------------------ | --------------------- |
| 0.5   | ⚪ Low      | 0.5% price move, $500 volume   | Barely perceptible    |
| 2.0   | ⚪ Low      | 2% price move, $5k volume      | Minor tremor          |
| 4.0   | 🟡 Moderate | 4% price move, $20k volume     | Noticeable shake      |
| 6.0   | 🟠 High     | 8% price move, $50k volume     | Strong movement       |
| 8.0   | 🔴 Extreme  | 15% price move, $100k volume   | Major earthquake      |
| 10.0  | 🔴 Extreme  | 20%+ price move, $200k+ volume | Catastrophic event    |

## 🧮 The Algorithm (v2)

### Core Formula

```javascript
intensity = priceChangeScore × volumeMultiplier
```

### Price Change Mapping

The relationship between price change and base score:

```
Price Change (%)    Base Score    Visual
─────────────────────────────────────────
0-1%               0-1          ▁▁
1-5%               1-5          ▁▁▃▃▅
5-10%              5-7.5        ▅▅▆▇
10-20%             7.5-10       ▇▇█
20%+               10           █████
```

### Volume Multiplier

Volume adds credibility to price movements:

```
Volume ($)         Multiplier    Effect
─────────────────────────────────────────
< $1,000          0.0          No score
$1,000-$5,000     0.1-0.5      Reduced
$5,000-$10,000    0.5-1.0      Gradual
> $10,000         1.0          Full score
```

## 📈 Visual Examples

### Example 1: Moderate Tremor (Score: 4.2)

```
Event: "Will Bitcoin reach $100k by March?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Price Movement:
Before: 35% → After: 39% (4% change)
        ████████░░░░░░░░░░

Volume: $25,000
        ████████████░░░░░░

Intensity: 4.2 🟡 MODERATE
        ████████▌░░░░░░░░░
```

### Example 2: Extreme Tremor (Score: 8.5)

```
Event: "Will the Fed cut rates this month?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Price Movement:
Before: 20% → After: 35% (15% change)
        ████████████████░░

Volume: $150,000
        ██████████████████

Intensity: 8.5 🔴 EXTREME
        █████████████████░
```

### Example 3: Low Activity (Score: 0.0)

```
Event: "Will it rain in Seattle tomorrow?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Price Movement:
Before: 70% → After: 72% (2% change)
        ██░░░░░░░░░░░░░░░░

Volume: $750
        █░░░░░░░░░░░░░░░░░

Intensity: 0.0 (Below threshold)
        ░░░░░░░░░░░░░░░░░░
```

## ⏱️ Time Windows

TREMOR analyzes movements across multiple timeframes:

### 5-Minute Window

- **Purpose**: Catch breaking news
- **Use Case**: "BREAKING: Major announcement"
- **Sensitivity**: Highest
- **Example**: Election results coming in

### 1-Hour Window

- **Purpose**: Identify trending movements
- **Use Case**: Sustained market sentiment shift
- **Sensitivity**: Moderate
- **Example**: Policy announcement digestion

### 24-Hour Window

- **Purpose**: Major narrative changes
- **Use Case**: Complete probability reassessment
- **Sensitivity**: Lower (needs bigger moves)
- **Example**: Black swan events

## 📊 Multi-Market Aggregation

For events with multiple markets, we aggregate intelligently:

```python
def aggregate_event_score(markets):
    # Take the maximum individual market score
    max_score = max(market.score for market in markets)

    # Boost slightly for correlated movements
    if multiple_markets_moving():
        max_score *= 1.1  # 10% boost

    return min(max_score, 10)  # Cap at 10
```

### Example: Presidential Election

```
Event: "2024 Presidential Election"
├── Market A: "Will Trump win?"
│   └── Score: 6.5 🟠
├── Market B: "Will Biden win?"
│   └── Score: 6.3 🟠
└── Market C: "Will there be a third party winner?"
    └── Score: 2.1 ⚪

Event Score: 6.5 🟠 (Maximum of all markets)
```

## 🔄 Evolution History

### v1 (Original)

- Simple linear scaling
- Single time window
- Basic volume threshold

### v2 (Current)

- Non-linear scaling for realistic intensity
- Multi-window analysis
- Graduated volume multiplier
- Better handling of edge cases

### v3 (Future)

- Refined thresholds based on historical data
- Market-specific adjustments
- Improved baseline calculations

## 🎯 Calibration Examples

To ensure our scoring is meaningful, here's how real events would score:

| Real Event            | Market Move | TREMOR Score | Accuracy        |
| --------------------- | ----------- | ------------ | --------------- |
| Trump indictment news | 15% in 1hr  | 8.2 🔴       | ✅ Major event  |
| Fed rate decision     | 8% in 5min  | 6.5 🟠       | ✅ Significant  |
| Celebrity endorsement | 3% in 24hr  | 2.8 🟡       | ✅ Minor news   |
| Random fluctuation    | 1% in 1hr   | 0.8 ⚪       | ✅ Filtered out |

## 🔧 Technical Implementation

### Database Query

```sql
-- Get highest scoring events in last hour
SELECT
  e.title,
  s.maxScore,
  s.topMarket,
  s.metadata
FROM scores s
JOIN events e ON s.eventId = e._id
WHERE s.timestamp > NOW() - INTERVAL '1 hour'
ORDER BY s.maxScore DESC
LIMIT 20
```

### Score Computation

```typescript
// Runs every minute via cron
async function computeScores() {
  const events = await getActiveEvents();

  for (const event of events) {
    const markets = await getEventMarkets(event.id);
    const snapshots = await getRecentSnapshots(markets);

    const scores = {
      score5m: calculateScore(snapshots, '5m'),
      score1h: calculateScore(snapshots, '1h'),
      score24h: calculateScore(snapshots, '24h'),
    };

    await saveScore(event.id, scores);
  }
}
```

## 📈 Future Improvements

- More accurate volume weighting
- Better handling of market-specific patterns
- Improved normalization for different market types
- Refined time window calculations

## 🎓 Understanding the Numbers

### For Traders

- **2.5+**: Worth investigating
- **5.0+**: Significant opportunity/risk
- **7.5+**: Major market event

### For Observers

- **Low (0-2.5)**: Normal market noise
- **Moderate (2.5-5)**: Something interesting
- **High (5-7.5)**: Important development
- **Extreme (7.5+)**: Breaking news territory

---

_The scoring algorithm is continuously refined based on real-world data and user feedback._
