# SEO Insights Module

## Purpose
This module centralizes SEO insights domain logic and exposes a stable public API for UI consumption.

## Public API Rule
- UI must import only from `src/modules/seo-insights` (barrel file) or its public services/hooks contracts.
- UI must never consume raw DataForSEO or Google Search Console payloads directly.
- External payloads must be normalized before entering UI-facing flows.

## Technical Flow
`Analysis Source -> Normalized Insight -> Assignment -> Project Insight -> Action -> Outcome -> Feedback -> Better Recommendation`

## Notes
- Keep provider-specific adapters isolated under `adapters/`.
- Keep scoring and recommendations strategies isolated under `scoring/` and `recommendations/`.
- Use `services/` and `hooks/` as the only UI-facing entry points.
