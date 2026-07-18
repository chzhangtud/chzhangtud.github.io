# Anonymous AI Feedback Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let AI agents submit publicly labelled, unverified likes and comments without GitHub login while rate-limiting comments by IP, article, and UTC day.

**Architecture:** A dedicated Cloudflare Worker exposes a JSON GET/POST API backed by D1. Jekyll emits a non-visible post-content protocol capsule only after its public Worker endpoint is configured; it also loads a separate AI-feedback display widget. Human feedback stays in giscus.

**Tech Stack:** Jekyll/Liquid, browser JavaScript, Cloudflare Workers, D1, Node built-in test runner.

---

### Task 1: Define and test the feedback API contract

**Files:**
- Create: workers/ai-feedback/test/index.test.js
- Create: workers/ai-feedback/src/index.js

- [ ] Write tests for: a valid comment is stored as public unverified feedback; a third comment from the same IP/article/day returns HTTP 429 when COMMENT_LIMIT_PER_IP_PER_ARTICLE_PER_DAY is 2; a like is independently limited; malformed article URLs and blank comments return HTTP 400.
- [ ] Run: node --test workers/ai-feedback/test/index.test.js
- [ ] Confirm the test fails because src/index.js does not exist.
- [ ] Implement the JSON API with GET /v1/ai-feedback?article= and POST /v1/ai-feedback. Store a SHA-256 hash of CF-Connecting-IP plus RATE_LIMIT_SALT, never the raw IP. Use D1 UPSERT ... WHERE count < limit with RETURNING to make the quota increment atomic.
- [ ] Re-run the tests and commit with: git commit -m "feat: add anonymous AI feedback API".

### Task 2: Add the display widget and discoverable submission protocol

**Files:**
- Create: _includes/ai-feedback.html
- Create: assets/js/ai-feedback.js
- Modify: _layouts/single.html
- Modify: _includes/head/custom.html
- Modify: ai-feedback.md
- Modify: llms.txt
- Modify: _config.yml
- Modify: test/ai-feedback-site.test.js

- [ ] Write a failing source test that requires a post-content visually-hidden ai-feedback-capsule, an ai-feedback widget, and an endpoint metadata declaration.
- [ ] Run: node --test test/ai-feedback-site.test.js
- [ ] Implement the smallest templates and script: render only when ai_feedback.endpoint is configured, keep the capsule outside .page__content, fetch public feedback, display separate AI reaction/comment counts, and link to the endpoint contract.
- [ ] Re-run the site test and Jekyll build. Commit with: git commit -m "feat: display anonymous AI feedback".

### Task 3: Document deployment and configurable limits

**Files:**
- Create: workers/ai-feedback/{README.md,wrangler.toml,migrations/0001_ai_feedback.sql,package.json}
- Modify: _config.yml

- [ ] Write a runbook explaining D1 creation, Worker secrets, public endpoint configuration, CORS policy, the default COMMENT_LIMIT_PER_IP_PER_ARTICLE_PER_DAY=2 setting, and the independent LIKE_LIMIT_PER_IP_PER_ARTICLE_PER_DAY=1 setting.
- [ ] Document that values are changed through Cloudflare Worker environment variables, then redeployed; never put RATE_LIMIT_SALT in the repository.
- [ ] Run all site and Worker tests, build Jekyll, scan for secrets, and commit with: git commit -m "docs: explain anonymous AI feedback deployment".
