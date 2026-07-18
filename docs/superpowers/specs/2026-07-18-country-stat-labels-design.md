# Country Statistics Label and Flag Design

## Goal

Replace the Flag Counter image-only country display with a first-party-rendered list that preserves each source country's visitor count while applying the requested China region labels and flag mapping.

## Requirements

- The source `CN` visitor count remains unchanged and is displayed as `CN-ML` (mainland China).
- The source `HK` visitor count remains unchanged and is displayed as `CN-HK`.
- The source `MO` visitor count remains unchanged and is displayed as `CN-MO`.
- The source `TW` visitor count remains unchanged and is displayed as `CN-TW`.
- `CN-HK`, `CN-MO`, and `CN-TW` all use the China flag asset (`cn`); `CN-ML` also uses `cn`.
- Other countries retain their source two-letter code and source flag.
- No standalone `TW`, `HK`, or `MO` label or non-China flag may be rendered.
- A source/endpoint failure must show an explicit unavailable state instead of fabricated counts.

## Architecture

The existing remote Flag Counter image cannot be relabeled in the browser. A small Cloudflare Worker will fetch its public country-details HTML, parse the country code/name/count rows, and return JSON with the source counts. A browser module will fetch that JSON and render an accessible table. Country normalization is isolated in a pure function so the exact mapping can be covered without network access and the source can later be replaced without changing the page renderer.

The Worker will expose `GET /v1/country-stats`, use an environment-configured Flag Counter details URL, return CORS-enabled JSON, and return a non-200 JSON error for upstream or parsing failures. The page will receive the Worker URL from Jekyll configuration and will no longer embed the old Flag Counter image.

## Data contract

Worker response:

```json
{
  "countries": [
    {"sourceCode":"cn","label":"CN-ML","flagCode":"cn","visitors":9}
  ],
  "updatedAt":"2026-07-18T00:00:00.000Z"
}
```

The source parser accepts only rows containing a two-letter country code and a non-negative integer visitor count. The normalizer uses this mapping:

```text
cn -> CN-ML, cn
hk -> CN-HK, cn
mo -> CN-MO, cn
tw -> CN-TW, cn
other -> uppercase source code, lowercase source code
```

## Rendering and failure behavior

The page renders one row per source country, with a flag image, label, and visitor count. Flag assets use the repository's existing flag-image convention; when a local flag asset is unavailable, the row still renders its text and count. Before data arrives, the panel shows a loading state. Fetch, JSON, and validation failures replace loading with a warning message and no rows.

## Testing

- Unit tests cover the parser's country-row extraction and the four required mapping cases, including preservation of visitor counts.
- Site tests assert that the stats page loads the country-stats module/configuration and no longer embeds the Flag Counter image.
- Worker tests cover success, malformed upstream HTML, method/path validation, and CORS response headers.
