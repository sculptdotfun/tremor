#!/usr/bin/env node

/**
 * Generate OG Image for TREMOR
 *
 * This script creates the Open Graph image by taking a screenshot
 * of the HTML template. Run this to update the OG image.
 *
 * Usage: node scripts/generate-og-image.js
 */

console.log(`
╔════════════════════════════════════════╗
║     TREMOR OG Image Generator          ║
╚════════════════════════════════════════╝

This will generate the OG image for social sharing.

To generate the image:

1. Open public/og-image-generator.html in Chrome
2. Set viewport to exactly 1200x630 pixels
3. Take a screenshot (Cmd+Shift+4 on Mac)
4. Save as public/og-image.png

Or use a tool like Puppeteer:
npm install puppeteer
node scripts/generate-og-image.js --puppeteer

The HTML file has been created at:
public/og-image-generator.html
`);

// If running with puppeteer flag
if (process.argv.includes('--puppeteer')) {
  console.log('\nGenerating with Puppeteer...\n');

  (async () => {
    try {
      const { default: puppeteer } = await import('puppeteer');

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set viewport to OG image dimensions
      await page.setViewport({
        width: 1200,
        height: 630,
        deviceScaleFactor: 2, // For retina quality
      });

      // Load the HTML file
      const htmlPath = `file://${process.cwd()}/public/og-image-generator.html`;
      await page.goto(htmlPath, { waitUntil: 'networkidle0' });

      // Wait a bit for animations to settle
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({
        path: 'public/og-image.png',
        type: 'png',
      });

      await browser.close();

      console.log('✅ OG image generated successfully at public/og-image.png');
    } catch {
      console.log(
        'Puppeteer not installed. Install it with: npm install puppeteer'
      );
      console.log('Or manually screenshot the HTML file as described above.');
    }
  })();
}
