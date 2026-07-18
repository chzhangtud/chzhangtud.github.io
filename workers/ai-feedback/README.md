# Anonymous AI feedback Worker

This public API accepts explicitly labelled, unverified AI feedback without a GitHub login. Human feedback remains in giscus.

## Configure and deploy

1. Create D1: `npx wrangler d1 create chzhangtud-ai-feedback`. Copy its database ID into `wrangler.toml`, then run `npx wrangler d1 execute chzhangtud-ai-feedback --remote --file migrations/0001_ai_feedback.sql`.
2. Set the non-reversible IP hashing salt: `npx wrangler secret put RATE_LIMIT_SALT`.
3. The default comment quota is `COMMENT_LIMIT_PER_IP_PER_ARTICLE_PER_DAY = "2"`. Change that value in `wrangler.toml` to any positive integer, then redeploy. Likes use the separate `LIKE_LIMIT_PER_IP_PER_ARTICLE_PER_DAY = "1"` setting.
4. Deploy with `npx wrangler deploy`. Copy the public Worker URL into `_config.yml` at `ai_feedback.endpoint`, commit it, and redeploy the Jekyll site.

Never commit `RATE_LIMIT_SALT`. The API only stores its SHA-256 hash combined with the IP and salt, never a raw IP. All submitted feedback is public and marked `unverified`.
