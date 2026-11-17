import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

// Run against a Jekyll build with FIGURE_BROWSER_TEST=1. Source JS/CSS is served
// directly so this catches regressions before rebuilding the generated site.
test('native slider drags keep controls fixed across numeric output changes', {
  skip: process.env.FIGURE_BROWSER_TEST !== '1', timeout: 180000,
}, async () => {
  const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
  const { chromium } = await import(isAbsolute(modulePath) ? pathToFileURL(modulePath).href : modulePath);
  const root = fileURLToPath(new URL('..', import.meta.url));
  const mime = { '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const relative = path.replace(/^\/+/, '') + (path.endsWith('/') ? 'index.html' : '');
      const built = resolve(root, '_site', relative);
      if (!built.startsWith(resolve(root, '_site') + sep)) throw new Error('Invalid path');
      const source = resolve(root, relative);
      const bytes = path.startsWith('/assets/')
        ? await readFile(source).catch(() => readFile(built)) : await readFile(built);
      response.writeHead(200, { 'Content-Type': mime[extname(relative)] || 'application/octet-stream' });
      response.end(bytes);
    } catch {
      response.writeHead(404); response.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: process.env.FIGURE_BROWSER_CHANNEL || 'msedge', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.route('**/*', route => route.request().url().startsWith(base + '/')
    ? route.continue() : route.abort());
  const slugs = process.env.FIGURE_DRAG_SLUGS?.split(',') || ['probability-statistics', 'density-estimation', 'variational-inference',
    'neural-probability-models', 'trainable-variational-inference', 'variational-autoencoder'];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let checked = 0;
  try {
    for (const width of process.env.FIGURE_DRAG_WIDTHS?.split(',').map(Number) || [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of process.env.FIGURE_DRAG_LANGS?.split(',') || ['zh', 'en']) for (const slug of slugs) {
        await page.goto(`${base}/${lang}/${slug}/`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => [...document.querySelectorAll('.statistics-figure')]
          .every(root => root.querySelector('svg, canvas') && root.querySelector('.statistics-figure__readout').textContent.length));
        for (const figure of await page.locator('.statistics-figure').all()) {
          for (const input of await figure.locator('input[type="range"]:visible').all()) {
            await input.evaluate(node => {
              node.value = Number(node.min) + (Number(node.max) - Number(node.min)) * 0.15;
              node.dispatchEvent(new Event('input', { bubbles: true }));
              node.dispatchEvent(new Event('change', { bubbles: true }));
            });
            await page.waitForTimeout(40);
            await input.evaluate(node => scrollBy(0, node.getBoundingClientRect().top - 160));
            await page.waitForTimeout(40);
            const position = async () => input.evaluate(node => {
              const box = node.getBoundingClientRect();
              const output = node.parentElement.querySelector('output');
              const outputBox = output.getBoundingClientRect();
              return { x: box.x, y: box.y, width: box.width, height: box.height,
                relativeY: box.y - node.closest('figure').getBoundingClientRect().y,
                min: Number(node.min), max: Number(node.max), value: Number(node.value),
                outputX: outputBox.x, outputWidth: outputBox.width, outputHeight: outputBox.height };
            });
            const before = await position();
            const start = before.x + 8 + (before.width - 16) * (before.value - before.min) / (before.max - before.min);
            const end = before.x + before.width - 8;
            const y = before.y + before.height / 2;
            await page.mouse.move(start, y);
            await page.mouse.down();
            const samples = [await position()];
            try {
              for (let i = 1; i <= 12; i++) {
                await page.mouse.move(start + (end - start) * i / 12, y);
                await page.waitForTimeout(20);
                samples.push(await position());
              }
            } finally {
              await page.mouse.up();
            }
            const context = `${lang}/${slug}, ${width}px, ${await input.getAttribute('data-param')}`;
            for (const key of ['x', 'y', 'relativeY', 'width', 'height', 'outputX', 'outputWidth', 'outputHeight']) {
              const drift = Math.max(...samples.map(s => s[key])) - Math.min(...samples.map(s => s[key]));
              // Scroll anchoring rounds page scroll offsets to whole pixels;
              // the control's position inside the figure must stay fixed.
              const tolerance = key === 'y' ? 1 : 0.5;
              assert.ok(drift <= tolerance, `${context}: ${key} moved ${drift.toFixed(2)}px during a straight drag`);
            }
            assert.ok(samples.at(-1).value > samples[0].value, `${context}: drag did not update the value`);
            assert.ok(samples.slice(1).every((s, i) => s.value >= samples[i].value), `${context}: value reversed while dragging right`);
            assert.ok(before.outputX + before.outputWidth <= (await figure.boundingBox()).x + (await figure.boundingBox()).width,
              `${context}: output overflows figure`);
            checked++;
          }
        }
        console.log(`Stable drags: ${lang}/${slug} at ${width}px (${checked} sliders checked)`);
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
