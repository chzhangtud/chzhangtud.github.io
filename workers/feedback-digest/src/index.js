const AI_FEEDBACK_HEADING = /^## 🤖 AI feedback(?:\r?\n|$)/;
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const RESEND_EMAIL_URL = 'https://api.resend.com/emails';

export function classifyComment(body) {
  return typeof body === 'string' && AI_FEEDBACK_HEADING.test(body);
}

export function createDigest(comments, reactionCount) {
  const safeComments = Array.isArray(comments) ? comments : [];

  return {
    totalComments: safeComments.length,
    totalReactions: Number(reactionCount) || 0,
    aiComments: safeComments.filter((comment) => classifyComment(comment.body)),
  };
}

export async function runDigest(env, dependencies = createProductionDependencies(env)) {
  const previousCheckpoint = await dependencies.readState('last_delivered_at');
  const activity = await dependencies.loadActivity(previousCheckpoint);
  const digest = createDigest(activity.comments, activity.reactions);

  if (digest.totalComments === 0 && digest.totalReactions === 0) {
    return { sent: false, reason: 'empty' };
  }

  const checkpoint = dependencies.now();
  await dependencies.sendEmail({ ...digest, previousCheckpoint, checkpoint });
  await dependencies.writeState('last_delivered_at', checkpoint);

  return { sent: true, checkpoint };
}

function createProductionDependencies(env) {
  return {
    async loadActivity(checkpoint) {
      const token = await createInstallationToken(env);
      return loadGitHubActivity(token, checkpoint, env.GITHUB_OWNER || 'chzhangtud', env.GITHUB_REPOSITORY || 'chzhangtud.github.io');
    },
    async readState(key) {
      const row = await env.DB.prepare('SELECT value FROM digest_state WHERE key = ?1').bind(key).first();
      return row?.value ?? null;
    },
    async writeState(key, value) {
      await env.DB.prepare(
        'INSERT INTO digest_state (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
      ).bind(key, value).run();
    },
    async sendEmail(digest) {
      const response = await fetch(RESEND_EMAIL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${required(env, 'RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: required(env, 'RESEND_FROM'),
          to: [required(env, 'RESEND_TO')],
          subject: `Weekly article feedback: ${digest.totalComments} comments, ${digest.totalReactions} reactions`,
          html: renderDigestHtml(digest),
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend returned ${response.status}`);
      }
    },
    now: () => new Date().toISOString(),
  };
}

async function createInstallationToken(env) {
  const jwt = await createGitHubAppJwt(env);
  const response = await fetch(
    `https://api.github.com/app/installations/${required(env, 'GITHUB_INSTALLATION_ID')}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'User-Agent': 'chzhangtud-feedback-digest',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub installation token request returned ${response.status}`);
  }

  const payload = await response.json();
  return payload.token;
}

async function createGitHubAppJwt(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: required(env, 'GITHUB_APP_ID') }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(required(env, 'GITHUB_APP_PRIVATE_KEY')),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

async function loadGitHubActivity(token, checkpoint, owner, repository) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'chzhangtud-feedback-digest',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      query: `query FeedbackActivity($owner: String!, $repository: String!) {
        repository(owner: $owner, name: $repository) {
          discussions(first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
            nodes {
              updatedAt
              reactionGroups { users { totalCount } }
              comments(first: 100) { nodes { id body url createdAt } }
            }
          }
        }
      }`,
      variables: { owner, repository },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request returned ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${payload.errors[0].message}`);
  }

  const since = checkpoint ? new Date(checkpoint).getTime() : 0;
  const discussions = payload.data?.repository?.discussions?.nodes ?? [];
  const comments = [];
  let reactions = 0;

  for (const discussion of discussions) {
    if (new Date(discussion.updatedAt).getTime() <= since) {
      continue;
    }
    reactions += (discussion.reactionGroups ?? []).reduce((total, group) => total + (group.users?.totalCount ?? 0), 0);
    for (const comment of discussion.comments?.nodes ?? []) {
      if (new Date(comment.createdAt).getTime() > since) {
        comments.push(comment);
      }
    }
  }

  return { comments, reactions };
}

function required(env, name) {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function pemToBytes(value) {
  const base64 = value
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function renderDigestHtml(digest) {
  const aiItems = digest.aiComments.map((comment) => {
    const excerpt = escapeHtml(comment.body.replace(AI_FEEDBACK_HEADING, '').trim().slice(0, 600));
    return `<li><a href="${escapeHtml(comment.url)}">Feedback comment</a><br>${excerpt}</li>`;
  }).join('');
  const aiSection = digest.aiComments.length ? `<h2>AI feedback</h2><ul>${aiItems}</ul>` : '';

  return `<h1>Weekly article feedback</h1><p>${digest.totalComments} new comments and ${digest.totalReactions} reactions.</p>${aiSection}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export default {
  scheduled(_controller, env, context) {
    context.waitUntil(runDigest(env));
  },
};
