import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const paths = ['probability-statistics', 'density-estimation'].flatMap((slug) =>
  ['zh', 'en'].map((lang) => `MachineLearning/_posts/2026-10-27-${slug}.${lang}.md`))
  .concat(['variational-inference', 'neural-probability-models', 'trainable-variational-inference', 'variational-autoencoder']
    .flatMap(slug => ['zh', 'en'].map(lang => `ProbabilisticModels/_posts/2026-10-27-${slug}.${lang}.md`)))
  .concat(['zh', 'en'].flatMap(lang => [
    `MachineLearning/_posts/2026-11-03-neural-networks.${lang}.md`,
    `Math/_posts/2026-11-03-matrix-calculus.${lang}.md`,
  ]));
// Exercise Liquid followed by the configured Markdown converter, before MathJax sees
// the page. A successful TeX parse cannot catch math split into HTML table cells.
const result = spawnSync('ruby', ['-rbundler/setup', '-rjekyll', '-rjson', '-e', `
  config = Jekyll.configuration("quiet" => true)
  site = Jekyll::Site.new(config)
  site.data = Jekyll::DataReader.new(site).read("_data")
  output = ARGV.map do |path|
    document = Jekyll::Document.new(File.expand_path(path), :site => site, :collection => site.posts)
    document.read
    document.data["layout"] = nil
    Jekyll::Renderer.new(site, document).run
  end
  puts JSON.generate(output)
`, ...paths], { encoding: 'utf8', cwd: new URL('..', import.meta.url) });
assert.equal(result.status, 0, result.stderr);
const rendered = JSON.parse(result.stdout.trim());

for (const [index, path] of paths.entries()) {
  test(`${path}: prose math must not become extra Markdown tables`, () => {
    const expectedTables = /density-estimation|variational-autoencoder|neural-networks|matrix-calculus/.test(path) ? 2 : 1;
    assert.equal((rendered[index].match(/<table>/g) || []).length, expectedTables,
      'Only explicitly authored comparison and notation tables should render');
  });

  test(`${path}: every inline formula survives Markdown as one intact TeX expression`, () => {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    const withoutDisplayMath = source.replace(/\$\$[\s\S]*?\$\$/g, '');
    const inline = [...withoutDisplayMath.matchAll(/\$([^\n$]+)\$/g)].map((match) => match[0]);
    for (const formula of inline) {
      const encoded = formula.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      assert.ok(rendered[index].includes(encoded), `Markdown split or changed ${formula}`);
    }
  });

  if (/2026-11-03/.test(path)) {
    test(`${path}: native math survives in prose and collapsed derivations`, () => {
      const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
      for (const match of source.matchAll(/\$\$([\s\S]*?)\$\$/g)) {
        const encoded = match[1].trim().replaceAll('\r\n', '\n').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        assert.ok(rendered[index].includes(encoded), `Markdown changed native math: ${match[1]}`);
      }
      assert.match(rendered[index], /<details>\s*<summary>/);
      assert.doesNotMatch(rendered[index], /markdown="1"/);
    });
  }
}
