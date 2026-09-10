const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = __dirname;
const source = pathToFileURL(path.join(root, 'index.html')).href;
const outputs = [
  ['1', 'post-01-construction-backlog.png'],
  ['2', 'post-02-better-hiring-brief.png'],
  ['3', 'post-03-us-hours-readiness.png'],
  ['4', 'post-01-construction-backlog-illustrated.png'],
  ['5', 'post-03-us-hours-readiness-illustrated.png'],
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });

  try {
    for (const [id, filename] of outputs) {
      const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
      await page.goto(`${source}?post=${id}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(`#post-${id}`).screenshot({ path: path.join(root, filename) });
      await page.close();
      console.log(`Rendered ${filename}`);
    }
  } finally {
    await browser.close();
  }
})();
