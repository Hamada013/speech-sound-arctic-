// Draws the app icons from assets/logo.webp. Needs Playwright: SOUNDS_PLAYWRIGHT or an installed playwright package.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..'), logo = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'assets/logo.webp')).toString('base64');
// Platforms that round or mask the icon themselves get the logo zoomed past its own rounded corners.
const sizes = [['icon-192', 192, 1, false], ['icon-512', 512, 1, false], ['maskable-512', 512, 1.2, true], ['apple-touch-icon', 180, 1.16, true], ['favicon-32', 32, 1, false], ['favicon-16', 16, 1, false]];
(async () => {
  const browser = await chromium.launch();
  for (const [name, size, zoom, solid] of sizes) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<body style="margin:0;overflow:hidden;width:${size}px;height:${size}px;background:${solid ? '#fbe69c' : 'transparent'}"><img src="${logo}" style="display:block;width:${size}px;height:${size}px;transform:scale(${zoom})">`);
    await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth);
    await page.screenshot({ path: path.join(root, `icons/${name}.png`), omitBackground: !solid });
    await page.close();
  }
  await browser.close();
})();
