import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyComment, createDigest, runDigest } from '../src/index.js';

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
  assert.deepEqual(digest.aiComments.map(({ id }) => id), ['a']);
});

test('a failed delivery does not advance the checkpoint', async () => {
  const writes = [];

  await assert.rejects(
    runDigest({}, {
      loadActivity: async () => ({
        comments: [{ id: 'a', body: 'Thanks', url: 'https://x/a' }],
        reactions: 0,
        checkpoint: '2026-07-17T00:00:00Z',
      }),
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
    loadActivity: async () => ({
      comments: [],
      reactions: 0,
      checkpoint: '2026-07-17T00:00:00Z',
    }),
    readState: async () => null,
    writeState: async (key, value) => writes.push([key, value]),
    sendEmail: async () => { sends += 1; },
    now: () => '2026-07-17T17:00:00Z',
  });

  assert.deepEqual(result, { sent: false, reason: 'empty' });
  assert.equal(sends, 0);
  assert.deepEqual(writes, []);
});

test('a successful interval is checkpointed once after delivery', async () => {
  const writes = [];
  const sent = [];

  const result = await runDigest({}, {
    loadActivity: async () => ({
      comments: [{ id: 'a', body: '## 🤖 AI feedback\nFeedback: useful', url: 'https://x/a' }],
      reactions: 1,
      checkpoint: '2026-07-17T16:00:00Z',
    }),
    readState: async () => null,
    writeState: async (key, value) => writes.push([key, value]),
    sendEmail: async (digest) => sent.push(digest),
    now: () => '2026-07-17T17:00:00Z',
  });

  assert.deepEqual(result, { sent: true, checkpoint: '2026-07-17T17:00:00Z' });
  assert.equal(sent.length, 1);
  assert.deepEqual(writes, [['last_delivered_at', '2026-07-17T17:00:00Z']]);
});
