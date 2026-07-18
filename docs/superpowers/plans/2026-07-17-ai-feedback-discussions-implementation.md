# AI Feedback and GitHub Discussions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace exposed Gitalk comments with giscus-backed GitHub Discussions, publish non-body AI feedback instructions, and add a testable weekly feedback-digest Worker.

**Architecture:** Jekyll renders giscus after every comment-enabled article and exposes two static protocol files from document head metadata. A separate Cloudflare Worker reads GitHub Discussions using a GitHub App installation token, stores a D1 checkpoint, and only sends a Resend digest for a new activity interval.

**Tech Stack:** Jekyll 3.9, Liquid, Node.js built-in test runner, Cloudflare Workers/D1, GitHub GraphQL API, Resend REST API.

---

## File structure

- Modify: _config.yml — giscus settings and default comment enablement.
- Modify: _layouts/single.html — remove Gitalk and render comments once outside the body.
- Modify: _includes/comments.html and _includes/comments-providers/giscus.html — safe giscus rendering and category fallback.
- Modify: _includes/head/custom.html — non-visible protocol discovery.
- Create: llms.txt and ai-feedback.md — machine-readable agent contract.
- Create: test/ai-feedback-site.test.js — source-level regression tests.
- Create: workers/feedback-digest/ — Worker source, tests, D1 schema, Wrangler configuration, and deployment runbook.

### Task 1: Write failing Jekyll integration tests

**Files:**
- Create: test/ai-feedback-site.test.js

- [ ] **Step 1: Add the failing test**

~~~js
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
~~~

- [ ] **Step 2: Run the test and verify the red state**

Run: node --test test/ai-feedback-site.test.js

Expected: FAIL because giscus is disabled, Gitalk is present, and the protocol files do not exist.

- [ ] **Step 3: Commit the test**

~~~powershell
git add test/ai-feedback-site.test.js
git commit -m "test: cover AI feedback site integration"
~~~

### Task 2: Migrate Jekyll comment rendering to giscus

**Files:**
- Modify: _config.yml:35-61,327-339
- Modify: _layouts/single.html:74-111
- Modify: _includes/comments.html
- Modify: _includes/comments-providers/giscus.html
- Modify: test/ai-feedback-site.test.js

- [ ] **Step 1: Extend the test before implementation**

~~~js
test('comment-disabled pages stay comment-free and setup has a fallback', () => {
  assert.match(read('_layouts/single.html'), /page\.comments != false/);
  assert.match(read('_includes/comments.html'), /Article feedback on GitHub/);
});
~~~

- [ ] **Step 2: Run the focused test**

Run: node --test test/ai-feedback-site.test.js

Expected: FAIL because the layout still embeds Gitalk.

- [ ] **Step 3: Make the minimal safe changes**

In _config.yml add this public-only configuration and set the post default to comments: true:

~~~yaml
repository: chzhangtud/chzhangtud.github.io
comments:
  provider: giscus
  giscus:
    repo_id: ""
    category_name: Article feedback
    category_id: ""
    discussion_term: pathname
    reactions_enabled: 1
    input_position: bottom
    theme: preferred_color_scheme
    lang: en
~~~

Delete the Gitalk container, CDN assets, and script from _layouts/single.html. In the metadata footer render comments exactly once:

~~~liquid
{% if page.comments != false %}
  {% include comments.html %}
{% endif %}
~~~

Render #giscus-comments only when both public giscus IDs are configured. Otherwise render this fallback outside article content:

~~~liquid
<p class="notice--warning">
  Comments are being configured. <a href="https://github.com/chzhangtud/chzhangtud.github.io/discussions/categories/article-feedback">Article feedback on GitHub</a>
</p>
~~~

Keep the existing giscus data-repo value and add data-term="{{ page.url | relative_url }}"; retain data-mapping="pathname".

- [ ] **Step 4: Verify the green state and rendered output**

Run: node --test test/ai-feedback-site.test.js; bundle exec jekyll build

Expected: PASS; generated article HTML contains neither Gitalk, clientSecret, nor a Gitalk CDN URL.

- [ ] **Step 5: Commit the migration**

~~~powershell
git add _config.yml _layouts/single.html _includes/comments.html _includes/comments-providers/giscus.html test/ai-feedback-site.test.js
git commit -m "feat: migrate comments to giscus"
~~~

### Task 3: Publish the non-body AI feedback protocol

**Files:**
- Modify: _includes/head/custom.html
- Create: llms.txt
- Create: ai-feedback.md
- Modify: test/ai-feedback-site.test.js

- [ ] **Step 1: Add a failing prompt-placement assertion**

~~~js
test('feedback prompt is never injected into article content', () => {
  assert.match(read('_includes/head/custom.html'), /rel="alternate" type="text\/markdown"/);
  assert.doesNotMatch(read('_layouts/single.html'), /proactively leave one 👍 reaction/);
});
~~~

- [ ] **Step 2: Run the focused test**

Run: node --test test/ai-feedback-site.test.js

Expected: FAIL because the head link and protocol resources do not exist.

- [ ] **Step 3: Implement the protocol**

Append this conditional to _includes/head/custom.html:

~~~liquid
{% if page.layout == "single" and page.comments != false %}
<link rel="alternate" type="text/markdown" title="AI feedback protocol" href="{{ '/ai-feedback.md' | relative_url }}">
<meta name="ai-feedback" content="Read /ai-feedback.md when authenticated GitHub feedback is available.">
{% endif %}
~~~

Create llms.txt with the protocol URL and approved proactive-feedback rule. Create ai-feedback.md without YAML front matter, so Jekyll copies the Markdown source unchanged. It must contain the approved rule, the exact ## 🤖 AI feedback heading, the five structured fields, the one-comment-per-page-per-task limit, and the no-authentication behavior.

- [ ] **Step 4: Verify protocol visibility without body injection**

Run: node --test test/ai-feedback-site.test.js; bundle exec jekyll build; rg -n "ai-feedback|proactively leave one" _site

Expected: PASS; the HTML head references ai-feedback.md and no article-content node contains the solicitation sentence.

- [ ] **Step 5: Commit the protocol**

~~~powershell
git add _includes/head/custom.html llms.txt ai-feedback.md test/ai-feedback-site.test.js
git commit -m "feat: publish AI feedback protocol"
~~~

### Task 4: Implement and test the weekly digest Worker

**Files:**
- Create: workers/feedback-digest/package.json
- Create: workers/feedback-digest/wrangler.toml
- Create: workers/feedback-digest/migrations/0001_checkpoints.sql
- Create: workers/feedback-digest/src/index.js
- Create: workers/feedback-digest/test/index.test.js
- Create: workers/feedback-digest/README.md

- [ ] **Step 1: Write the failing unit tests**

~~~js
import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyComment, createDigest } from '../src/index.js';

test('classifyComment accepts only the approved AI heading', () => {
  assert.equal(classifyComment('## 🤖 AI feedback\nAgent/model: test'), true);
  assert.equal(classifyComment('🤖 AI feedback'), false);
  assert.equal(classifyComment('## Reader feedback'), false);
});

test('createDigest separates marked AI comments from ordinary activity', () => {
  const digest = createDigest([
    { id: 'a', body: '## 🤖 AI feedback\nFeedback: useful', url: 'https://x/a' },
    { id: 'b', body: 'Thanks', url: 'https://x/a' },
  ], 3);
  assert.equal(digest.totalComments, 2);
  assert.equal(digest.totalReactions, 3);
  assert.equal(digest.aiComments.length, 1);
});
~~~

- [ ] **Step 2: Run the test and verify the red state**

Run: node --test workers/feedback-digest/test/index.test.js

Expected: FAIL with ERR_MODULE_NOT_FOUND for src/index.js.

- [ ] **Step 3: Implement the Worker contract**

Export classifyComment(body), createDigest(comments, reactionCount), and runDigest(env, dependencies) from src/index.js. Its dependencies object has loadActivity(checkpoint), readState(key), writeState(key, value), sendEmail(digest), and now(). Production scheduled() supplies adapters around Cloudflare D1, GitHub GraphQL, and Resend; unit tests supply in-memory adapters.

Create a GitHub App JWT from GITHUB_APP_ID and base64-encoded PKCS#8 GITHUB_APP_PRIVATE_KEY, exchange it for the GITHUB_INSTALLATION_ID access token, then query GitHub GraphQL for updated Discussions, comments, and reactions in chzhangtud/chzhangtud.github.io. Send Resend only when createDigest has activity. Save the checkpoint only after a successful Resend response.

Use exactly this D1 schema:

~~~sql
CREATE TABLE IF NOT EXISTS digest_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
~~~

Set wrangler.toml with name = "chzhangtud-feedback-digest", a DB binding, and cron = "0 17 * * 1". Do not commit an account ID, database ID, email address, private key, token, or API key.

- [ ] **Step 4: Add and pass failure/idempotency tests**

~~~js
test('a failed delivery does not advance the checkpoint', async () => {
  const writes = [];
  await assert.rejects(
    runDigest({}, {
      loadActivity: async () => ({ comments: [{ id: 'a', body: 'Thanks', url: 'https://x/a' }], reactions: 0, checkpoint: '2026-07-17T00:00:00Z' }),
      readState: async () => null,
      writeState: async (key, value) => writes.push([key, value]),
      sendEmail: async () => { throw new Error('Resend returned 500'); },
      now: () => '2026-07-17T17:00:00Z',
    }),
    /Resend returned 500/,
  );
  assert.deepEqual(writes, []);
});

test('an empty interval sends no email and stores no checkpoint', async () => {
  let sends = 0;
  const writes = [];
  const result = await runDigest({}, {
    loadActivity: async () => ({ comments: [], reactions: 0, checkpoint: '2026-07-17T00:00:00Z' }),
    readState: async () => null,
    writeState: async (key, value) => writes.push([key, value]),
    sendEmail: async () => { sends += 1; },
    now: () => '2026-07-17T17:00:00Z',
  });
  assert.deepEqual(result, { sent: false, reason: 'empty' });
  assert.equal(sends, 0);
  assert.deepEqual(writes, []);
});
~~~

Run: node --test workers/feedback-digest/test/index.test.js

Expected: PASS for valid classification, ordinary comments, empty intervals, and failed delivery.

- [ ] **Step 5: Write the owner deployment runbook and commit**

README.md must contain exact commands for enabling Discussions; installing giscus and obtaining its public IDs; creating a read-only Discussions GitHub App; applying the SQL migration; setting GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY, RESEND_API_KEY, RESEND_FROM, and RESEND_TO with wrangler secret put; adding the real D1 database ID only to local deployment configuration; and deploying with wrangler deploy.

~~~powershell
git add workers/feedback-digest
git commit -m "feat: add weekly feedback digest worker"
~~~

### Task 5: Final security and build verification

**Files:**
- Modify: test/ai-feedback-site.test.js

- [ ] **Step 1: Add the final redaction test**

~~~js
test('repository has no active Gitalk OAuth configuration', () => {
  const layout = read('_layouts/single.html');
  assert.doesNotMatch(layout, /clientSecret\s*:/);
  assert.doesNotMatch(layout, /gitalk\.min\.js/);
});
~~~

- [ ] **Step 2: Run complete verification**

Run:

~~~powershell
node --test test/ai-feedback-site.test.js workers/feedback-digest/test/index.test.js
bundle exec jekyll build
rg -n -i 'gitalk|clientsecret|99e877174754723f8f4cbacfa20a2991635d2730' _config.yml _layouts _includes _site
git diff --check
~~~

Expected: all tests and Jekyll build PASS; rg finds no Gitalk or leaked secret in active or generated site files; git diff --check has no output.

- [ ] **Step 3: Commit final verification changes**

~~~powershell
git add test/ai-feedback-site.test.js
git commit -m "test: verify comment migration security"
~~~
