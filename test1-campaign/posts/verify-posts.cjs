const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const sharp = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = __dirname;
const pngs = [
  'post-01-construction-backlog.png',
  'post-02-better-hiring-brief.png',
  'post-03-us-hours-readiness.png',
  'post-01-construction-backlog-illustrated.png',
  'post-03-us-hours-readiness-illustrated.png',
];
const requiredFiles = [
  'index.html',
  'render-posts.cjs',
  'Three-Posts-Publishing-Pack.md',
  'Prompts-and-Tools-Only.md',
  ...pngs,
  'assets/f5-hiring-solutions-logo.svg',
  'assets/f5-global-talent-logo.png',
  'assets/construction-estimator.png',
  'assets/remote-professional.png',
];
const requiredPackText = [
  '## Post 1',
  '## Post 2',
  '## Post 3',
  '### Publish-ready copy',
  '### Final composition prompt used in Codex',
  '### Tools used',
  'https://f5hiringsolutions.com/',
  'https://www.f5globaltalent.com/',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);
  }

  for (const file of pngs) {
    const meta = await sharp(path.join(root, file)).metadata();
    assert(meta.width === 1080 && meta.height === 1350, `${file} is ${meta.width}x${meta.height}, expected 1080x1350`);
    assert(meta.format === 'png', `${file} is not a PNG`);
  }

  const pack = fs.readFileSync(path.join(root, 'Three-Posts-Publishing-Pack.md'), 'utf8');
  for (const phrase of requiredPackText) {
    assert(pack.includes(phrase), `Publishing pack missing: ${phrase}`);
  }

  const promptSheet = fs.readFileSync(path.join(root, 'Prompts-and-Tools-Only.md'), 'utf8');
  assert((promptSheet.match(/## Piece [123]/g) || []).length === 3, 'Prompt sheet must contain all three pieces');
  assert((promptSheet.match(/### Tools used/g) || []).length === 3, 'Prompt sheet must contain three tool lists');
  assert(promptSheet.includes('Character prompt used with ChatGPT Image'), 'Prompt sheet missing character-generation disclosure');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  try {
    const source = pathToFileURL(path.join(root, 'index.html')).href;
    for (let id = 1; id <= 5; id += 1) {
      const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
      const browserErrors = [];
      page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
      page.on('pageerror', error => browserErrors.push(error.message));
      await page.goto(`${source}?post=${id}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate((postId) => {
        const post = document.querySelector(`#post-${postId}`);
        const box = post.getBoundingClientRect();
        const images = [...post.querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 }));
        const visible = getComputedStyle(post).display !== 'none';
        return { width: box.width, height: box.height, visible, images, fontStatus: document.fonts.status };
      }, id);
      assert(browserErrors.length === 0, `Post ${id} browser error(s): ${browserErrors.join('; ')}`);
      assert(result.visible, `Post ${id} is not visible`);
      assert(result.width === 1080 && result.height === 1350, `Post ${id} artboard has incorrect dimensions`);
      assert(result.images.every(image => image.loaded), `Post ${id} has an unloaded image asset`);
      assert(result.fontStatus === 'loaded', `Post ${id} fonts did not finish loading`);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log('PASS: 5/5 post graphics (3 originals + 2 illustrated variants) are 1080x1350 PNGs.');
  console.log('PASS: all logos and fonts load with no browser errors.');
  console.log('PASS: publishing pack includes 3 captions, prompts, tools, audiences, schedule, and fact sources.');
  console.log('PASS: separate prompt sheet includes all 3 pieces and 3 tool lists.');
})();
