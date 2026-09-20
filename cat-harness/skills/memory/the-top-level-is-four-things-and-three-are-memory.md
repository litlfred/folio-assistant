---
$schema: folio-memory/v1
id: the-top-level-is-four-things-and-three-are-memory
label: stable
summary: "top level = bootstrap/ + one directory per repo + beans/ todos/ fsh-guts/, which stay because they ARE the instance's memory"
createdAt: 2026-09-20
roles:
  - platform-boundary-guard
  - code-reviewer
agents:
  - platform-boundary-guard
---
Owner, 2026-09-20: the top level is *"the contents of repos"* except
`bootstrap/`, `beans/`, `todos/`, and `fsh-guts/` — the last *"created in
tooling of cat-harness. keep it here (like beans and todos/) as this instance's
own working memory."*

**Memory is the reason, and it beats the one previously written down.** These
three were justified as "never overlaid" — a criterion two readers answered
differently. They are the instance's MEMORY: `beans/` the agent's plan,
`todos/` the person's items, `fsh-guts/` what was discarded and kept. One
repository has one memory, so it cannot be composed from parts; "never
overlaid" is the consequence, not the rule.

**Tooling and store separate.** The tools and graph kinds for all three are
introduced by **cat-harness**; the stores stay top-level. So "beans is a
cat-harness concept" and "beans/ is not inside cat-harness/" are both true.
`bootstrap/` introduces none of them — it is read before any harness resolves.

`scope: "repository"` means exactly these four. A closed list, not a judgement.
