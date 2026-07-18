import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('statistics page uses the normalized country-stats renderer', () => {
  const page = read('_pages/stats.md');
  const config = read('_config.yml');
  const script = read('assets/js/country-stats.js');
  assert.match(page, /id="country-stats"/);
  assert.match(page, />Country Distribution<\/h2>/);
  assert.match(page, /data-endpoint="\{\{ site\.country_stats\.endpoint \}\}"/);
  assert.match(page, /country-stats\.js/);
  assert.match(page, /data-country-stats-status/);
  assert.match(page, /class="country-stats-table-wrap" data-country-stats-table/);
  assert.doesNotMatch(page, /s01\.flagcounter\.com\/count2\//);
  assert.doesNotMatch(page, /min-width:\s*720px/);
  assert.doesNotMatch(page, /overflow-x:\s*auto/);
  assert.match(page, /overflow-wrap:\s*anywhere/);
  assert.match(script, /Country\/Region/);
  assert.match(script, /GROUPS_PER_ROW/);
  assert.match(config, /country_stats:/);
  assert.match(config, /endpoint:/);
});

