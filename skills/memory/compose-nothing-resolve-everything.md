---
$schema: folio-memory/v1
id: compose-nothing-resolve-everything
label: trap
summary: "compose nothing; resolve everything"
createdAt: 2026-09-19
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
---
The old contents table built every PDF cell as
`${PAGES}/papers/<paper>/chapters/<dir>.pdf` — by convention, checked against
nothing. The folio's `gh-pages` has no `chapters/` directory, so **all
twenty-three chapter links were 404 and always had been**; three of six
appendix links happened to resolve. Every PDF cell is now looked up in a real
`git ls-tree` of the publish ref, and a chapter with no published PDF renders
`—`.

The same script also **described one folio from inside the platform** (paper
directory, title, badges and a `PAGES` constant as literals) in a repo whose
`folio.ts` lists five papers, and resolved its helpers against the folio root
(`bun run scripts/readme-metadata.ts`) where the platform's scripts are not —
so it could only run from a platform checkout, which has no papers.
