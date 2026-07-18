# Weekly feedback digest Worker

This Worker reads GitHub Discussions activity for the site and emails one
weekly digest when there is new activity. It does not accept public feedback
submissions.

## Owner setup

1. Enable Discussions in `chzhangtud/chzhangtud.github.io`, create the `Article feedback` category, install the [giscus app](https://github.com/apps/giscus), and copy the public repository and category IDs from [giscus.app](https://giscus.app/) into `_config.yml`.
2. Create a GitHub App, grant it repository Discussions read access, install it only on this repository, and record its app ID and installation ID.
3. Generate the GitHub App private key, convert the PEM to base64 without line breaks, and keep the original PEM private.
4. Create a D1 database, replace `database_id` in `wrangler.toml` locally, and apply the schema:

   ```powershell
   npx wrangler d1 execute chzhangtud-feedback-digest --remote --file migrations/0001_checkpoints.sql
   ```

5. Configure secrets. None of these values belong in Git:

   ```powershell
   npx wrangler secret put GITHUB_APP_ID
   npx wrangler secret put GITHUB_INSTALLATION_ID
   npx wrangler secret put GITHUB_APP_PRIVATE_KEY
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RESEND_FROM
   npx wrangler secret put RESEND_TO
   ```

6. Install dependencies and deploy:

   ```powershell
   npm install
   npx wrangler deploy
   ```

The cron expression runs Monday at 17:00 UTC, which is Monday morning in Pacific
time. The Worker writes its checkpoint only after Resend accepts an email. An
empty interval sends no email.
