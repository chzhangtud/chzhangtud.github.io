import test from 'node:test';
import assert from 'node:assert/strict';
import { plotGeometry } from '../assets/js/figure-layout.mjs';

test('chart geometry uses the available width without imposing a wider SVG', () => {
  for (const width of [180, 230, 254, 294, 324, 400, 770, 1200]) {
    const box = plotGeometry(width, 844);
    assert.equal(box.width, width);
    assert.ok(box.left >= 0 && box.right < width);
    assert.ok(box.right - box.left > 40);
    assert.ok(box.bottom > box.top + 40);
  }
});

test('charts fit short mobile viewports while retaining space for readable axes', () => {
  const small = plotGeometry(254, 568);
  const portrait = plotGeometry(324, 844);
  const desktop = plotGeometry(770, 900);
  assert.ok(small.height <= 175 && small.height >= 150);
  assert.ok(portrait.height >= 200 && portrait.height <= 250);
  assert.ok(desktop.height <= 250);
  assert.ok(small.bottom + 24 < small.height);
});
