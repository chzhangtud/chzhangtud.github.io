import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const chapters = {
  'variational-inference': 5,
  'neural-probability-models': 5,
  'trainable-variational-inference': 6,
  'variational-autoencoder': 7,
};
const paths = Object.keys(chapters).flatMap(slug => ['zh', 'en'].map(lang =>
  `ProbabilisticModels/_posts/2026-10-27-${slug}.${lang}.md`));
// Exercise real Liquid and Kramdown before inspecting the resulting HTML.
// A details tag embedded in a paragraph can leave every proof visible while
// still preserving its TeX, so checking source strings alone is insufficient.
const result = spawnSync('ruby', ['-rbundler/setup', '-rjekyll', '-rnokogiri', '-rjson', '-e', `
  site = Jekyll::Site.new(Jekyll.configuration("quiet" => true))
  site.data = Jekyll::DataReader.new(site).read("_data")
  output = ARGV.map do |path|
    document = Jekyll::Document.new(File.expand_path(path), :site => site, :collection => site.posts)
    document.read
    document.data["layout"] = nil
    html = Nokogiri::HTML.fragment(Jekyll::Renderer.new(site, document).run)
    headings = html.css("h2, h3").map do |heading|
      number = heading.text[/\\A\\d+(?:\\.\\d+)*/]
      following = []
      node = heading.next_element
      while node && !(node.name == "h2" || (heading.name == "h3" && node.name == "h3"))
        following << node
        node = node.next_element
      end
      {"number" => number, "intro" => heading.next_element&.[]("class").to_s.split.include?("pgm-section-intro"),
       "summary" => following.any? { |n| n["class"].to_s.split.any? { |c| ["pgm-section-summary", "pgm-section-wrapup"].include?(c) } }}
    end
    details = html.css("details.pgm-derivation").map do |detail|
      {"summary" => detail.element_children.first&.name == "summary" && !detail.at_css("summary").text.strip.empty?,
       "content" => !detail.css("p, pre").empty?, "closed" => !detail.key?("open"),
       "parent" => detail.parent.name, "headings" => detail.css("h2, h3").length,
       "figures" => detail.css(".statistics-figure").length}
    end
    notes = html.css(".pgm-section-intro, .pgm-section-summary, .pgm-section-wrapup")
    {"headings" => headings, "details" => details,
     "plain_notes" => notes.all? { |n| n.at_css("strong") && !n.text.include?("$") && !n.text.include?("**") },
     "figures" => html.css(".statistics-figure").length}
  end
  puts JSON.generate(output)
`, ...paths], { encoding: 'utf8', cwd: new URL('..', import.meta.url) });
assert.equal(result.status, 0, result.stderr);
const rendered = JSON.parse(result.stdout.trim());

for (const [index, path] of paths.entries()) {
  const slug = Object.keys(chapters).find(slug => path.includes(`-${slug}.`));
  const page = rendered[index];
  test(`${path}: technical sections have a plain purpose and visible takeaway`, () => {
    const sections = page.headings.filter(h => Number(h.number.split('.')[0]) <= chapters[slug]);
    assert.ok(sections.length > 5);
    for (const section of sections) {
      assert.ok(section.intro, `${section.number}: no purpose before the detail`);
      assert.ok(section.summary, `${section.number}: no visible takeaway`);
    }
    assert.ok(page.plain_notes, 'Reading notes must render as plain prose');
  });
  test(`${path}: optional details actually contain the proof or code`, () => {
    assert.ok(page.details.length >= 3);
    for (const detail of page.details) {
      assert.ok(detail.summary, 'Details need a direct, named summary');
      assert.ok(detail.content, 'Proof or code escaped its details element');
      assert.ok(detail.closed, 'Details should start closed');
      assert.notEqual(detail.parent, 'p', 'Details must be a block, not an inline paragraph child');
      assert.equal(detail.headings, 0, 'Section headings must stay outside collapsed details');
      assert.equal(detail.figures, 0, 'Interactive figures must stay visible');
    }
    assert.ok(page.figures >= 2);
  });
}
