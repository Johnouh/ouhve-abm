#!/usr/bin/env node
/**
 * crawlhack — Playwright BFS crawler
 * Usage: node scripts/crawl.mjs <SEED_URL> <OUTPUT_DIR> [--depth=3] [--max=100]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const args = process.argv.slice(2);
const SEED = args[0];
const OUT_DIR = args[1];
const MAX_DEPTH = Number(args.find(a => a.startsWith('--depth='))?.split('=')[1] ?? 3);
const MAX_PAGES = Number(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? 100);

if (!SEED || !OUT_DIR) {
  console.error('Usage: node crawl.mjs <SEED_URL> <OUTPUT_DIR>');
  process.exit(1);
}

const SEED_URL = new URL(SEED);
const SEED_HOST = SEED_URL.hostname;

const visited = new Set();
const failed = [];
const allImages = new Set();
const allVideos = new Set();

function isSameDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname === SEED_HOST;
  } catch { return false; }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  } catch { return null; }
}

function htmlToMarkdown(html, title, url) {
  // very lightweight — strip scripts/styles, collapse whitespace
  let text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '[svg]')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // headings hint (rough — capture h1-h3 before strip would be better, but ok for first pass)
  return `# ${title}\n\nURL: ${url}\n\n${text}\n`;
}

async function downloadAsset(url, outPath) {
  if (existsSync(outPath)) return;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'crawlhack/1.0' } });
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
  } catch (e) {
    // ignore — best effort
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) crawlhack/1.0',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  const queue = [{ url: normalizeUrl(SEED), depth: 0 }];
  let n = 0;

  await mkdir(path.join(OUT_DIR, 'pages'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'images'), { recursive: true });

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const { url, depth } = queue.shift();
    if (!url || visited.has(url) || depth > MAX_DEPTH) continue;
    if (!isSameDomain(url)) continue;
    visited.add(url);
    n += 1;
    const idx = String(n).padStart(3, '0');

    process.stdout.write(`[${idx}/${MAX_PAGES}] (d=${depth}) ${url.slice(0, 80)} ... `);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500); // allow client-side render
      const title = (await page.title()) || '';
      const html = await page.content();
      const md = htmlToMarkdown(html, title, url);
      const screenshotPath = path.join(OUT_DIR, 'pages', `page-${idx}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 30000 });
      await writeFile(path.join(OUT_DIR, 'pages', `page-${idx}.md`), md);

      // extract links
      const links = await page.$$eval('a[href]', as => as.map(a => a.href).filter(Boolean));
      const uniqLinks = [...new Set(links.map(normalizeUrl).filter(Boolean))];
      await writeFile(path.join(OUT_DIR, 'pages', `page-${idx}.links.json`),
        JSON.stringify({ url, links: uniqLinks }, null, 2));
      uniqLinks.forEach(l => {
        if (!visited.has(l)) queue.push({ url: l, depth: depth + 1 });
      });

      // extract images (page-level cap 30)
      const imgs = await page.$$eval('img[src]', is =>
        is.map(i => i.src).filter(s => s && s.startsWith('http'))
      );
      const uniqImgs = [...new Set(imgs)].slice(0, 30);
      for (const imgUrl of uniqImgs) {
        const ext = path.extname(new URL(imgUrl).pathname).slice(0, 6) || '.jpg';
        const hash = createHash('md5').update(imgUrl).digest('hex').slice(0, 16);
        const imgPath = path.join(OUT_DIR, 'images', `${hash}${ext}`);
        allImages.add(imgUrl);
        await downloadAsset(imgUrl, imgPath);
      }

      // extract videos (iframes + video tags)
      const videos = await page.$$eval(
        'video[src], video source[src], iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="vimeo"]',
        els => els.map(e => e.src).filter(Boolean)
      );
      videos.forEach(v => allVideos.add(v));

      console.log(`OK (${uniqLinks.length}L ${uniqImgs.length}I)`);
    } catch (e) {
      console.log(`FAIL: ${e.message.slice(0, 60)}`);
      failed.push({ url, error: e.message });
    }

    // rate-limit
    await page.waitForTimeout(300);
  }

  await browser.close();

  // summary
  const summary = {
    seed: SEED,
    visited: visited.size,
    failed: failed.length,
    images: allImages.size,
    videos: allVideos.size,
    videoUrls: [...allVideos],
    maxDepth: MAX_DEPTH,
    maxPages: MAX_PAGES,
    finishedAt: new Date().toISOString(),
  };
  await writeFile(path.join(OUT_DIR, '_meta.json'),
    JSON.stringify({ visited: [...visited], failed, images: [...allImages], videos: [...allVideos] }, null, 2));
  await writeFile(path.join(OUT_DIR, '_SUMMARY.md'),
    `# Crawl Summary

- Seed: ${SEED}
- Pages crawled: ${summary.visited}
- Failed: ${summary.failed}
- Images: ${summary.images}
- Videos: ${summary.videos}
- Depth cap: ${MAX_DEPTH}
- Page cap: ${MAX_PAGES}
- Finished: ${summary.finishedAt}

## Video URLs
${[...allVideos].map(v => `- ${v}`).join('\n')}

## Failures
${failed.map(f => `- ${f.url}: ${f.error}`).join('\n')}
`);

  console.log('\n=== DONE ===');
  console.log(JSON.stringify(summary, null, 2));
})();
