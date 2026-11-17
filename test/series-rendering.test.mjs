import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// Render the real Liquid layout with real site data. A missing series id must
// select the collection overview, rather than the first collection in YAML.
const result = spawnSync('ruby', ['-rbundler/setup', '-rjekyll', '-rjson', '-e', `
  site = Jekyll::Site.new(Jekyll.configuration("quiet" => true, "exclude_from_localizations" => [], "lang" => "en"))
  site.reset
  site.read
  source = File.read("_layouts/series.html").sub(/\\A---.*?---\\s*/m, "")
  pages = [
    {"lang" => "zh", "url" => "/series/"},
    {"lang" => "en", "url" => "/en/series/"},
    {"lang" => "zh", "series" => "numerical-analysis", "url" => "/zh/series/numerical-analysis/"},
    {"lang" => "zh", "series" => "generative-models", "url" => "/zh/series/generative-models/"}
  ]
  output = pages.map do |page|
    payload = site.site_payload.merge("page" => page)
    site.liquid_renderer.file("_layouts/series.html").parse(source).render!(payload, :registers => { :site => site })
  end
  puts JSON.generate(output)
`], { encoding: 'utf8', cwd: new URL('..', import.meta.url) });
assert.equal(result.status, 0, result.stderr);
const pages = JSON.parse(result.stdout.trim());

for (const [index, lang] of ['zh', 'en'].entries()) {
  test(`${lang} all-collections page shows cards instead of a single reading list`, () => {
    assert.match(pages[index], /class="series-grid"/);
    assert.doesNotMatch(pages[index], /class="series-reading-list"/);
    for (const collection of ['numerical-analysis', 'machine-learning', 'generative-models', 'graphics']) {
      assert.ok(pages[index].includes(`/${lang}/series/${collection}/`), collection);
    }
    if (lang === 'zh') assert.ok(pages[index].includes('/zh/series/cpp/'));
  });
}
test('a selected collection still shows its reading list', () => {
  assert.match(pages[2], /class="series-reading-list"/);
  assert.doesNotMatch(pages[2], /class="series-grid"/);
});
test('the generative-model series lists all eleven articles in reading order', () => {
  assert.equal((pages[3].match(/class="series-reading-list__item"/g) || []).length, 11);
  let previous = -1;
  for (const slug of ['variational-inference', 'neural-probability-models', 'trainable-variational-inference', 'variational-autoencoder',
    'diffusion-intuition', 'denoising-diffusion', 'diffusion-sampling', 'score-based-models', 'normalizing-flows', 'flow-matching', 'generative-geometry']) {
    assert.ok(pages[3].includes(`/zh/${slug}/`));
    const position = pages[3].indexOf(`/zh/${slug}/`);
    assert.ok(position > previous, `${slug}: incorrect reading order`);
    previous = position;
  }
});
