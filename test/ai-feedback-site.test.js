import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('comments use giscus instead of Gitalk', () => {
  const config = read('_config.yml');
  const layout = read('_layouts/single.html');

  assert.match(config, /provider\s+: giscus/);
  assert.match(config, /repository\s+: chzhangtud\/chzhangtud\.github\.io/);
  assert.doesNotMatch(layout, /Gitalk|gitalk-container|clientSecret/);
});

test('AI feedback resources are non-body resources linked from head', () => {
  assert.ok(existsSync(new URL('../llms.txt', import.meta.url)));
  assert.ok(existsSync(new URL('../ai-feedback.md', import.meta.url)));
  assert.match(read('_includes/head/custom.html'), /ai-feedback\.md/);
  assert.match(read('llms.txt'), /proactively leave one/);
  assert.match(read('ai-feedback.md'), /## 🤖 AI feedback/);
});

test('comment-disabled pages stay comment-free and setup has a fallback', () => {
  assert.match(read('_layouts/single.html'), /page\.comments != false/);
  assert.match(read('_includes/comments.html'), /Article feedback on GitHub/);
});

test('feedback prompt is never injected into article content', () => {
  assert.match(read('_includes/head/custom.html'), /rel="alternate" type="text\/markdown"/);
  assert.doesNotMatch(read('_layouts/single.html'), /proactively leave one 👍 reaction/);
});
