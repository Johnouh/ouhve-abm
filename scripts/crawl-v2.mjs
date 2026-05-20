#!/usr/bin/env node
/**
 * crawlhack v2 — SPA-aware deep crawler
 * - Notion-style SPA 콘텐츠 추출 강화 (innerText 사용)
 * - role=button / cursor:pointer div도 클릭 후보로 탐색
 * - 페이지당 대기 시간 증가 (네트워크 idle + 3초)
 *
 * Usage: node scripts/crawl-v2.mjs <SEED> <OUT_DIR> [--depth=4] [--max=200]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const args = process.argv.slice(2);
const SEED = args[0];
const OUT_DIR = args[1];
const MAX_DEPTH = Number(args.find(a => a.startsWith('--depth='))?.split('=')[1] ?? 4);
const MAX_PAGES = Number(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? 200);

if (!SEED || !OUT_DIR) { console.error('Usage: node crawl-v2.mjs <SEED> <OUT>'); process.exit(1); }

const SEED_URL = new URL(SEED);
const visited = new Set();
const failed = [];
const allImages = new Set();
const allVideos = new Set();

function normalizeUrl(u) {
  try { const x = new URL(u); x.hash = ''; return x.toString(); } catch { return null; }
}
function sameDomain(u) {
  try { return new URL(u).hostname === SEED_URL.hostname; } catch { return false; }
}

async function downloadAsset(url, outPath) {
  if (existsSync(outPath)) return;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'crawlhack/2.0' } });
    if (!res.ok) return;
    await writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  } catch {}
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh) crawlhack/2.0',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  const queue = [{ url: normalizeUrl(SEED), depth: 0 }];
  let n = 0;
  await mkdir(path.join(OUT_DIR, 'pages-v2'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'images'), { recursive: true });

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const { url, depth } = queue.shift();
    if (!url || visited.has(url) || depth > MAX_DEPTH || !sameDomain(url)) continue;
    visited.add(url);
    n += 1;
    const idx = String(n).padStart(3, '0');
    process.stdout.write(`[${idx}] (d=${depth}) ${url.slice(0, 70)} ... `);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000); // SPA late render

      const title = (await page.title()) || '';
      // 핵심: innerText로 렌더된 텍스트 추출
      const innerText = await page.evaluate(() => document.body?.innerText || '');
      const md = `# ${title}\n\nURL: ${url}\n\n${innerText.slice(0, 50000)}\n`;
      await writeFile(path.join(OUT_DIR, 'pages-v2', `page-${idx}.md`), md);
      await page.screenshot({ path: path.join(OUT_DIR, 'pages-v2', `page-${idx}.png`), fullPage: true, timeout: 30000 });

      // <a href> 링크
      const aLinks = await page.$$eval('a[href]', as => as.map(a => a.href).filter(Boolean));
      // role=link / data-href / 카드 류 (Notion/Framer/SPA 패턴)
      const cardLinks = await page.$$eval(
        '[role="link"], [data-href], [data-url], [data-route]',
        els => els.map(e =>
          e.getAttribute('data-href') || e.getAttribute('data-url') || e.getAttribute('data-route') || e.getAttribute('href') || ''
        ).filter(Boolean)
      );
      // 모든 cursor:pointer 가진 div의 onclick에서 URL 패턴 찾기 (best-effort)
      const onClickUrls = await page.$$eval(
        '[onclick]',
        els => els.map(e => {
          const oc = e.getAttribute('onclick') || '';
          const m = oc.match(/['"]\/?([\w-]+\/?[\w/-]*)['"]/);
          return m ? m[0].replace(/['"]/g, '') : '';
        }).filter(Boolean)
      );

      // 모든 링크 통합 + 절대화
      const allLinks = [...new Set([...aLinks, ...cardLinks, ...onClickUrls])]
        .map(l => {
          try { return new URL(l, url).toString(); } catch { return null; }
        })
        .filter(Boolean)
        .map(normalizeUrl)
        .filter(Boolean);

      await writeFile(path.join(OUT_DIR, 'pages-v2', `page-${idx}.links.json`),
        JSON.stringify({ url, count: allLinks.length, links: allLinks }, null, 2));
      allLinks.forEach(l => { if (!visited.has(l)) queue.push({ url: l, depth: depth + 1 }); });

      // 이미지 (캡 30) — 동일 도메인 우선
      const imgs = await page.$$eval('img[src]', is =>
        is.map(i => i.src).filter(s => s && s.startsWith('http'))
      );
      const uniqImgs = [...new Set(imgs)].slice(0, 30);
      for (const imgUrl of uniqImgs) {
        const ext = path.extname(new URL(imgUrl).pathname).slice(0, 6) || '.jpg';
        const hash = createHash('md5').update(imgUrl).digest('hex').slice(0, 16);
        await downloadAsset(imgUrl, path.join(OUT_DIR, 'images', `${hash}${ext}`));
        allImages.add(imgUrl);
      }

      // 영상
      const videos = await page.$$eval(
        'video[src], video source[src], iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="vimeo"]',
        es => es.map(e => e.src).filter(Boolean)
      );
      videos.forEach(v => allVideos.add(v));

      console.log(`OK ${allLinks.length}L ${uniqImgs.length}I ${innerText.length}c`);
    } catch (e) {
      console.log(`FAIL ${e.message.slice(0, 50)}`);
      failed.push({ url, error: e.message });
    }
    await page.waitForTimeout(300);
  }

  await browser.close();

  await writeFile(path.join(OUT_DIR, '_meta-v2.json'),
    JSON.stringify({ visited: [...visited], failed, images: [...allImages], videos: [...allVideos] }, null, 2));
  await writeFile(path.join(OUT_DIR, '_SUMMARY-v2.md'),
    `# Crawl v2 Summary\n\n- Pages: ${visited.size}\n- Failed: ${failed.length}\n- Images: ${allImages.size}\n- Videos: ${allVideos.size}\n- Depth: ${MAX_DEPTH}, Max: ${MAX_PAGES}\n`);

  console.log(`\n=== v2 DONE: ${visited.size} pages, ${allImages.size} images, ${allVideos.size} videos ===`);
})();
