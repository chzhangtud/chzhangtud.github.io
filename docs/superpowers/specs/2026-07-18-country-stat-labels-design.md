# Country Statistics Label and Flag Design

## Goal

Replace the Flag Counter image-only country display with a first-party-rendered list that merges the `CN`, `HK`, `MO`, and `TW` source counts into one China entry.

## Requirements

- The displayed `CN` count equals the sum of the source `CN`, `HK`, `MO`, and `TW` counts.
- The merged entry is displayed as `CN` and uses the China flag asset (`cn`).
- Other countries retain their source two-letter code and source flag.
- No standalone `HK`, `MO`, or `TW` entry may be returned or rendered.
- A source/endpoint failure must show an explicit unavailable state instead of fabricated counts.

## Architecture

The existing remote Flag Counter image cannot be relabeled in the browser. A small Cloudflare Worker fetches its public country-details HTML, parses the country code/name/count rows, merges the four China-related source codes, and returns normalized JSON. A browser module fetches that JSON and renders an accessible table. Country aggregation is isolated in a pure function so the exact mapping can be covered without network access and the source can later be replaced without changing the page renderer.

The Worker will expose `GET /v1/country-stats`, use an environment-configured Flag Counter details URL, return CORS-enabled JSON, and return a non-200 JSON error for upstream or parsing failures. The page will receive the Worker URL from Jekyll configuration and will no longer embed the old Flag Counter image.

## Data contract

Worker response:

```json
{
  "countries": [
    {"sourceCode":"cn","label":"CN","flagCode":"cn","visitors":18}
  ],
  "updatedAt":"2026-07-18T00:00:00.000Z"
}
```

The source parser accepts only rows containing a two-letter country code and a non-negative integer visitor count. The normalizer uses this aggregation:

```text
cn + hk + mo + tw -> CN, cn
other -> uppercase source code, lowercase source code
```

## Rendering and failure behavior

The page renders one row per source country, with a flag image, label, and visitor count. Flag assets use the repository's existing flag-image convention; when a local flag asset is unavailable, the row still renders its text and count. Before data arrives, the panel shows a loading state. Fetch, JSON, and validation failures replace loading with a warning message and no rows.

## Testing

- Unit tests cover the parser's country-row extraction and verify that the four China-related counts are summed into one `CN` entry.
- Site tests assert that the stats page loads the country-stats module/configuration and no longer embeds the Flag Counter image.
- Worker tests cover success, malformed upstream HTML, method/path validation, and CORS response headers.
