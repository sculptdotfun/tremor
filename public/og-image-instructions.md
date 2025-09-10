# OG Image Generation Instructions

## Quick Method (Recommended)

1. **Open the SVG in browser**: 
   - Open `/public/og-image.svg` in Chrome/Safari
   - It will display at 1200x630 pixels

2. **Convert to PNG**:
   - **Option A**: Screenshot (Mac: Cmd+Shift+4, select area)
   - **Option B**: Use online converter like https://cloudconvert.com/svg-to-png
   - **Option C**: Use ImageMagick: `convert og-image.svg og-image.png`

3. **Save as**: `public/og-image.png`

## Alternative: HTML Version

We also have an HTML version with animations at `/public/og-image-generator.html`
- Open in browser
- Set viewport to 1200x630
- Take screenshot
- Save as `public/og-image.png`

## Testing

After generating, test your OG image:
1. Deploy to production
2. Test with: https://www.opengraph.xyz/url/https://tremor.live
3. Test with: https://cards-dev.twitter.com/validator

## Current Design

The OG image features:
- 🌊 TREMOR branding with wave emoji
- "Where Money Talks First" tagline
- Seismograph visualization in background
- Key stats: ~500 markets, 15s updates, 0-10 scale, 24/7 monitoring
- Intensity bar showing the scale gradient
- Live indicator badge
- Clean dark theme with red accents

## Files

- `og-image.svg` - Static vector version (ready to convert)
- `og-image-generator.html` - Animated HTML version
- `og-image.png` - Final image (needs to be generated)