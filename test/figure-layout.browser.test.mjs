import assert from 'node:assert/strict';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

// Opt in with FIGURE_BROWSER_TEST=1 against a built/served site. Set
// PLAYWRIGHT_MODULE to a module path if Playwright is outside this workspace.
test('figures fit desktop and mobile without internal scrolling or clipped labels', {
  skip: process.env.FIGURE_BROWSER_TEST !== '1', timeout: 180000,
}, async () => {
  const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
  const { chromium } = await import(isAbsolute(modulePath) ? pathToFileURL(modulePath).href : modulePath);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.FIGURE_BASE_URL || 'http://127.0.0.1:4173';
  await page.route('**/*', route => new URL(route.request().url()).origin === base
    ? route.continue() : route.abort());
  const slugs = ['probability-statistics', 'density-estimation', 'variational-inference',
    'neural-probability-models', 'trainable-variational-inference', 'variational-autoencoder'];
  const viewports = [{ width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1440, height: 900 }, { width: 1920, height: 1080 }];
  try {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const lang of ['zh', 'en']) for (const slug of slugs) {
        const context = `${lang}/${slug} at ${viewport.width}×${viewport.height}`;
        const response = await page.goto(`${base}/${lang}/${slug}/`, { waitUntil: 'load' });
        assert.equal(response.status(), 200, context);
        await page.waitForFunction(() => [...document.querySelectorAll('.statistics-figure')]
          .every(figure => figure.querySelector('svg, canvas')));
        const failures = await page.locator('.statistics-figure').evaluateAll(figures => {
          const issues = [];
          for (const figure of figures) {
            const name = figure.dataset.statistics || figure.dataset.density || figure.dataset.vae
              || figure.dataset.vaeExplain || figure.dataset.mnist;
            const bounds = figure.getBoundingClientRect();
            if (figure.scrollWidth > figure.clientWidth + 1) issues.push(`${name}: internal horizontal overflow`);
            if (bounds.height > innerHeight - 8) issues.push(`${name}: height ${Math.round(bounds.height)} exceeds viewport`);
            for (const control of figure.querySelectorAll('input, select, button')) {
              const rect = control.getBoundingClientRect();
              if (rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) {
                issues.push(`${name}: control outside figure`);
              }
            }
            for (const svg of figure.querySelectorAll('svg')) {
              if (!svg.getBoundingClientRect().width) continue;
              const view = svg.viewBox.baseVal;
              for (const label of svg.querySelectorAll('text')) {
                const box = label.getBBox();
                if (box.x < -1 || box.x + box.width > view.width + 1
                  || box.y < -1 || box.y + box.height > view.height + 1) {
                  issues.push(`${name}: clipped label ${label.textContent}`);
                }
              }
            }
          }
          return issues;
        });
        assert.deepEqual(failures, [], context);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, context);
        for (const figure of await page.locator('[data-figure-mode="tabs"]').all()) {
          const tabs = figure.locator('[role="tab"]');
          await tabs.last().click();
          assert.equal(await figure.locator('.figure-panel:visible').count(), 1, context);
          assert.equal(await tabs.last().getAttribute('aria-selected'), 'true', context);
          assert.ok(await figure.locator('.figure-panel:visible svg').count(), context);
          const selected = await tabs.last().getAttribute('id');
          await figure.locator('input').first().evaluate(input => {
            input.value = Number(input.value) + (Number(input.step) || 0.01);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
          await page.waitForTimeout(25);
          assert.equal(await figure.locator('[aria-selected="true"]').getAttribute('id'), selected, context);
          await tabs.last().press('ArrowLeft');
          assert.equal(await tabs.first().getAttribute('aria-selected'), 'true', context);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/zh/probability-statistics/`, { waitUntil: 'load' });
    const conditional = page.locator('[data-statistics="conditional"]');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#main')).opacity === '1');
    assert.match(await conditional.locator('.statistics-figure__legend').textContent(), /等密度线/);
    await conditional.screenshot({ path: join(tmpdir(), 'statistics-conditional-mobile.png') });
    await conditional.locator('[role="tab"]').last().click();
    assert.match(await conditional.locator('.statistics-figure__legend').textContent(), /条件密度/);
    assert.doesNotMatch(await conditional.locator('.statistics-figure__legend').textContent(), /等密度线/);
    await conditional.screenshot({ path: join(tmpdir(), 'statistics-density-mobile.png') });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('[data-statistics="conditional"]').dataset.figureMode === 'columns');
    assert.equal(await conditional.locator('.figure-panel:visible').count(), 2);
    await conditional.screenshot({ path: join(tmpdir(), 'statistics-conditional-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-statistics="conditional"]').dataset.figureMode === 'tabs');
    assert.equal(await conditional.locator('[role="tab"]').last().getAttribute('aria-selected'), 'true');
    await conditional.locator('summary').click();
    assert.equal(await conditional.locator('details').evaluate(details => details.open), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
