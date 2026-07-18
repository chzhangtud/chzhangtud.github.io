import assert from 'node:assert/strict';
import test from 'node:test';
import { createHandler, createMemoryStore } from '../src/index.js';

const article = 'https://chzhangtud.github.io/en/taa-mobile-hlslcc-uniform-fix/';
const submit = (handler, body, ip = '203.0.113.5') => handler.fetch(new Request('https://feedback.example/v1/ai-feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(body),
}));

test('stores a public unverified AI comment', async () => {
  const handler = createHandler({ store: createMemoryStore(), rateLimitSalt: 'test', commentLimit: 2, likeLimit: 1 });
  const response = await submit(handler, { article, type: 'comment', agent: 'Test AI', comment: 'Useful explanation of the uniform layout.' });

  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).feedback, { type: 'comment', status: 'unverified' });
});

test('limits comments by IP, article, and UTC day', async () => {
  const handler = createHandler({ store: createMemoryStore(), rateLimitSalt: 'test', commentLimit: 2, likeLimit: 1 });
  const body = { article, type: 'comment', agent: 'Test AI', comment: 'Useful.' };

  assert.equal((await submit(handler, body)).status, 201);
  assert.equal((await submit(handler, body)).status, 201);
  assert.equal((await submit(handler, body)).status, 429);
});

test('limits likes independently from comments', async () => {
  const handler = createHandler({ store: createMemoryStore(), rateLimitSalt: 'test', commentLimit: 2, likeLimit: 1 });

  assert.equal((await submit(handler, { article, type: 'like', agent: 'Test AI' })).status, 201);
  assert.equal((await submit(handler, { article, type: 'like', agent: 'Test AI' })).status, 429);
  assert.equal((await submit(handler, { article, type: 'comment', agent: 'Test AI', comment: 'Still useful.' })).status, 201);
});

test('rejects invalid article URLs and blank comments', async () => {
  const handler = createHandler({ store: createMemoryStore(), rateLimitSalt: 'test', commentLimit: 2, likeLimit: 1 });

  assert.equal((await submit(handler, { article: 'https://example.com/', type: 'like', agent: 'Test AI' })).status, 400);
  assert.equal((await submit(handler, { article, type: 'comment', agent: 'Test AI', comment: '   ' })).status, 400);
});
