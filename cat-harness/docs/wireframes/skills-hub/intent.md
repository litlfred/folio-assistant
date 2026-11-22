# Skills hub visualiser — as-is intent

**Covers:** `cat-harness/skills`, the visualiser cat-harness declares as `{"id": "skills", "renderedBy": "skill-docs"}` (owner card "Skills hub", option A, 2026-11-18). Its page, `docs/en/cat-harness/skills/index.html`, is written by `skills:docs` (`cat-harness-tools/scripts/gen-skill-docs.ts`, `skillsHubPage`). It is a forwarding page: it sends the reader to the skill-instructions index, `reference/skill-instructions/index.html`, carrying the query and fragment. So what a reader sees is that index, and that is what this wireframe draws.

**Who it is for:** a person or agent who opens **Skills** in the C@T Harness sidebar to find out what an agent is told by a skill.

**What they need to do:** see every skill, grouped by the package it belongs to, and open one skill's instruction page; reach the schema reference and the concepts page from the lede.

**What it must show** (read off the generator): the title "Skill instructions"; the lede on instruction bodies and `skill_fetch`; links to the schema reference and to Skills & roles; one section per package group with a four-column table (skill, id, schema, summary); and the link to Unresolved code references.

## Observed

Rendered locally from `skills:docs` at cat-harness-tools `300e8bf4`: 23 sections and 260 skill rows. The hub forwards with no visible page of its own; with scripts off, its fallback is one sentence and a link.

## Findings

1. **Four columns at phone width.** At 390 px the index table has the same four columns, and the Schema column is "—" for most rows. The drawing drops that column below 800 px; the generated page does not, so it is the first candidate for a narrow-screen fix.
2. **Summaries are the first line of the body,** not a declared description, so several read as metadata ("Skill id: evidence-review · Package: folio-core") or are empty.
3. **One long page.** 260 rows in 23 sections with no in-page contents or filter; finding one skill means scrolling or the browser's find.
