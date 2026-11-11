# Concrete workflow guides

Approved scope: document the ten portable-state use cases in Markdown and on the website, with runnable examples, expected results and capability boundaries.

1. Add shared Markdown guides and synthetic source files for all ten workflows.
2. Generate downloadable packs; verify byte restoration and case-specific data invariants, including router encoding/reading.
3. Replace the use-case index with documentation navigation; pre-render the Markdown routes and add on-demand browser verification.
4. Verify generation, build, all ten browser checks, mobile/desktop layout and invalid routes.

Scope ruling: retain the existing website framework and styling. These added pages and checks use static content; converting the whole application to GitHub Pages is separate work. Existing runtime changes and benchmark baselines are preserved.

Progress: content, fixtures, generator and routes implemented. All ten Node round trips and data invariants passed. Web verification pending.

Verification completed:
- All 10 Node examples passed file-list, byte restoration and case-specific invariant checks; router bundle decoding also passed.
- Production build passed and pre-rendered all 10 guide routes. Existing repository lint warnings remain; no build errors.
- All 10 browser decode/checksum checks passed on the production build.
- Index count, invalid route 404, mobile overflow, missing-download error/retry, zero page errors and calculator $48 → $60 interaction passed.
- Desktop index and mobile guide screenshots inspected. Impeccable detector reported no findings.
- Scoped independent review found no blocking issues; two copy mismatches corrected.
- git diff --check passed. No commit or deployment performed.
