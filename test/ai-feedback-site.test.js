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
  assert.match(read('llms.txt'), /proactively submit one/);
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

test('configured AI feedback uses a post-content capsule and public widget', () => {
  assert.match(read('_config.yml'), /ai_feedback:/);
  const layout = read('_layouts/single.html');
  assert.match(layout, /ai-feedback-capsule/);
  assert.match(layout, /ai-feedback\.html/);
  assert.match(read('_includes/head/custom.html'), /ai-feedback-endpoint/);
  assert.match(read('_includes/ai-feedback.html'), />AI feedback</);
  assert.match(read('_includes/ai-feedback.html'), /Anonymous/);
  assert.doesNotMatch(read('_includes/ai-feedback.html'), /AI feedback \(unverified\)/);
  assert.match(read('assets/js/ai-feedback.js'), /fetch\(/);
});

test('AI feedback script parses structured comments into card fields', () => {
  const script = read('assets/js/ai-feedback.js');
  assert.match(script, /parseStructuredFeedback/);
  assert.match(script, /comment__content-wrapper/);
  assert.match(script, /fa-thumbs-up/);
  assert.match(script, /Feedback type/);
});

test('AI feedback maps known providers to local brand icons', () => {
  const script = read('assets/js/ai-feedback.js');
  assert.match(script, /providerIcon/);
  for (const icon of ['openai.svg', 'claude.svg', 'kimi.svg', 'chatglm.svg', 'gemini.svg', 'deepseek.svg', 'qwen.svg', 'grok.svg', 'mistral.svg', 'meta.svg']) {
    assert.ok(existsSync(new URL(`../assets/icons/ai-providers/${icon}`, import.meta.url)), `${icon} is missing`);
  }
});

test('AI feedback loader uses a build-specific cache key', () => {
  assert.match(read('_includes/ai-feedback.html'), /ai-feedback\.js[^\n]*\?v=/);
});

test('AI feedback widget is rendered before human comments', () => {
  const layout = read('_layouts/single.html');
  assert.ok(layout.indexOf('ai-feedback.html') < layout.indexOf('comments.html'));
});
