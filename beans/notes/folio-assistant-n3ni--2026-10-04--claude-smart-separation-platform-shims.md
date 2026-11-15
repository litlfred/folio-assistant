---
# note on folio-assistant-n3ni from claude/smart-separation-platform-shims
$schema: folio-bean-note/v1
bean: folio-assistant-n3ni
branch: "claude/smart-separation-platform-shims"
created: "2026-10-04"
---
## PR #1860 finished: one import seam per staged smart-* instance; guard covers every staged instance

Finished by a Merge Manager salvage dispatch (2026-10-04) on branch claude/smart-separation-platform-shims, PR #1860. Taking over the stalled branch; beans:claim refused (in-progress on main with no recorded holder), so this note is the holder record.

- One seam per instance: smart-base/platform.ts (from the original session) and now smart-trust/platform.ts, which re-exports VIEW_PAGE from fhir-harness. smart-trust/scripts/tests/pages-markdown.test.ts now imports it through the shim. That is the exact climb #2082 measured failing in the seeded fork.
- cat-harness/scripts/tests/instance-separation-imports.test.ts now covers EVERY staged instance (repository != livesAt), not only those with a platform.ts. Platform layers are an explicit, checked exemption list; who-iris is a not-yet-shimmed ceiling of 18 climbs that may only fall. Calibrated: with the old smart-trust import the guard fails and names that line.
- The stage-E paragraph this branch had added to the bean def was dropped in the merge from main: its 'half met' claim is overtaken by #2082's measured fork result.
- Open owner question carried from #2082, not decided here: 'The fork needs the platform: either stage F's subscription or a folio-assistant submodule (owner's choice, asked)'. The seam makes re-pointing a one-file edit per instance, but the fork runs only once that is answered.
