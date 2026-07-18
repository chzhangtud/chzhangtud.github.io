import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHandler,
  normalizeCountry,
  parseFlagCounterCountries,
} from '../src/index.js';

const fixture = `
<table>
<tr><td><a href=/flag_details/cn/TSy><img class="flag-cn-png"></a></td><td><a href=/factbook/cn/TSy><u>China</u></a></td><td>9</td></tr>
<tr><td><a href=/flag_details/hk/TSy><img class="flag-hk-png"></a></td><td><a href=/factbook/hk/TSy><u>Hong Kong</u></a></td><td>4</td></tr>
<tr><td><a href=/flag_details/mo/TSy><img class="flag-mo-png"></a></td><td><a href=/factbook/mo/TSy><u>Macau</u></a></td><td>3</td></tr>
<tr><td><a href=/flag_details/tw/TSy><img class="flag-tw-png"></a></td><td><a href=/factbook/tw/TSy><u>Taiwan</u></a></td><td>2</td></tr>
<tr><td><a href=/flag_details/jp/TSy><img class="flag-jp-png"></a></td><td><a href=/factbook/jp/TSy><u>Japan</u></a></td><td>1</td></tr>
</table>`;

test('parses Flag Counter country rows and preserves visitor counts', () => {
  assert.deepEqual(parseFlagCounterCountries(fixture), [
    { sourceCode: 'cn', name: 'China', visitors: 9 },
    { sourceCode: 'hk', name: 'Hong Kong', visitors: 4 },
    { sourceCode: 'mo', name: 'Macau', visitors: 3 },
    { sourceCode: 'tw', name: 'Taiwan', visitors: 2 },
    { sourceCode: 'jp', name: 'Japan', visitors: 1 },
  ]);
});

test('parses Flag Counter visitor counts wrapped in font tags', () => {
  const sourceHtml = '<tr><td><a href=/flag_details/tw/TSy><img></a></td><td><a href=/factbook/tw/TSy><u>Taiwan</u></a></td><td><font face=arial size=2>2</font></td></tr>';
  assert.deepEqual(parseFlagCounterCountries(sourceHtml), [
    { sourceCode: 'tw', name: 'Taiwan', visitors: 2 },
  ]);
});

test('maps China source codes to mainland and region labels using the China flag', () => {
  assert.deepEqual(normalizeCountry({ sourceCode: 'cn', name: 'China', visitors: 9 }), {
    sourceCode: 'cn', name: 'China', visitors: 9, label: 'CN-ML', flagCode: 'cn',
  });
  assert.deepEqual(normalizeCountry({ sourceCode: 'hk', name: 'Hong Kong', visitors: 4 }), {
    sourceCode: 'hk', name: 'Hong Kong', visitors: 4, label: 'CN-HK', flagCode: 'cn',
  });
  assert.deepEqual(normalizeCountry({ sourceCode: 'mo', name: 'Macau', visitors: 3 }), {
    sourceCode: 'mo', name: 'Macau', visitors: 3, label: 'CN-MO', flagCode: 'cn',
  });
  assert.deepEqual(normalizeCountry({ sourceCode: 'tw', name: 'Taiwan', visitors: 2 }), {
    sourceCode: 'tw', name: 'Taiwan', visitors: 2, label: 'CN-TW', flagCode: 'cn',
  });
});

test('keeps ordinary countries unchanged', () => {
  assert.deepEqual(normalizeCountry({ sourceCode: 'jp', name: 'Japan', visitors: 1 }), {
    sourceCode: 'jp', name: 'Japan', visitors: 1, label: 'JP', flagCode: 'jp',
  });
});

test('serves normalized country data with CORS', async () => {
  const handler = createHandler({
    sourceUrl: 'https://counter.example/countries/TSy/',
    fetchImpl: async () => new Response(fixture, { status: 200 }),
  });
  const response = await handler.fetch(new Request('https://stats.example/v1/country-stats'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.deepEqual((await response.json()).countries[1], {
    sourceCode: 'hk', name: 'Hong Kong', visitors: 4, label: 'CN-HK', flagCode: 'cn',
  });
});

test('rejects unsupported methods and malformed upstream data', async () => {
  const handler = createHandler({
    sourceUrl: 'https://counter.example/countries/TSy/',
    fetchImpl: async () => new Response('<html>no country rows</html>', { status: 200 }),
  });
  const methodResponse = await handler.fetch(new Request('https://stats.example/v1/country-stats', { method: 'POST' }));
  assert.equal(methodResponse.status, 405);
  const malformedResponse = await handler.fetch(new Request('https://stats.example/v1/country-stats'));
  assert.equal(malformedResponse.status, 502);
});
