# Program data

data/programs.json is the canonical source for every program in this repository. The README is generated from that file so that the public list and structured records do not drift.

The machine-readable contract is data/programs.schema.json.

## Record fields

| Field | Meaning |
|---|---|
| slug | Stable kebab-case identifier used by future detail pages |
| name, provider | Display name and provider |
| categories | One or more list sections |
| program_type | Machine-readable program classification |
| benefits | One or more benefit objects with type and human-readable label |
| eligibility | Structured stages, regions, and free-form requirements |
| status | active, needs_review, paused, expired, or unknown |
| application_state | open, rolling, invite_only, closed, or unknown |
| deadline | ISO date when a known deadline exists |
| application_url | Direct application or official program destination |
| official_url | Provider-owned source of truth |
| source_urls | Evidence URLs; must include official_url |
| separate_application | Whether a separate application step is known |
| referral_only | Whether access is referral-only when known |
| last_verified_at | Date the provider page and current terms were checked |
| verification_method | How the record was verified |
| verification_notes | Short evidence and caveats |

## Status policy

- **active**: the official source confirms current availability and the record was manually verified within 30 days.
- **needs_review**: the record exists, but current availability or terms need confirmation.
- **paused**: the provider explicitly says applications or access are paused.
- **expired**: the offer or deadline has ended.
- **unknown**: the record has not yet been classified.

An HTTP success response is not sufficient evidence for active. A page that returns 403, 429, or requires a browser challenge must be reviewed manually.

## Migration state

The initial structured-data migration imports the curated README entries with status needs_review and no last_verified_at. This is intentional: it avoids presenting an unverified import as fresh availability. Individual records may move to active only after an official-page review with supporting notes.

Run the checks locally:

    node scripts/validate-programs.mjs
    node scripts/generate-readme.mjs
