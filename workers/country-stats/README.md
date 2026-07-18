# Country statistics Worker

This Worker fetches the public Flag Counter country-details page, preserves each source visitor count, and returns normalized labels and flag codes for the site statistics page.

Deploy from this directory with:

```sh
npx wrangler deploy
```

The default `FLAG_COUNTER_DETAILS_URL` points at counter `TSy`. Override it with a Wrangler variable if the counter changes. Configure the deployed `/v1/country-stats` URL in `_config.yml` as `country_stats.endpoint` before publishing the Jekyll site.

