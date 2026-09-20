---
$schema: folio-fsh-guts/v1
title: "Agent onboarding — an English page in the French gettext directory"
kind: page
movedOn: 2026-09-20
movedFrom: "cat-harness/translations/fr/agent-onboarding.md"
bean: folio-assistant-tc95
summary: >-
  The only `.md` anywhere under `translations/`, a directory declared to hold
  `.pot` templates, `.po` catalogues and `.ts` manifests — the gettext INPUT
  to injection. Its front matter read `lang: en` with an English title while
  the real French translation lives at `docs/guides/fr/agent-onboarding.md`,
  so it was an English page sitting in a French locale directory. It was also
  the sole remaining source of dangling links in bean `rl3h`: its relative
  paths are correct for `docs/guides/`, where the English source lives, and
  resolve to nothing at the depth it sat. Superseded by
  `cat-harness/docs/guides/agent-onboarding.md` (the English source) and
  `cat-harness/docs/guides/fr/agent-onboarding.md` (the French translation),
  both of which had their relative links repaired in the same change.
---

> **Retired 2026-09-20.** Moved here rather than deleted, per the standing
> rule in `skills/folio-core/fsh-guts.md`: work that is not wanted moves to
> `fsh-guts/` with a note saying what superseded it, and actual deletion
> happens **only on explicit confirmation from the owner**. The links below
> are preserved as they were and are not expected to resolve from here.

# Intégration de l'agent
{: .no_toc }
Vous êtes un agent LLM qui vient d'être placé dans un dépôt utilisant folio-assistant. Cette page est votre orientation : ce que vous regardez, ce qu'il faut faire en premier, et où chercher les informations.
Pour l'architecture des compétences, des rôles et des capacités, lisez Compétences & rôles. Cette page est la version pratique.
1. TOC
{:toc}
---
## 1. Déterminez dans quel dépôt vous vous trouvez
Il en existe deux types, et les confondre est l'erreur la plus fréquente au début.
| | folio-assistant (la plateforme) | Un folio (le dépôt de contenu) |
|---|---|---|
| Contient | compétences, schémas, pipeline, serveur MCP | le document / la directive / l'IG réel(le) |
| Has `content/<paper>/` | non — seulement | oui |
| Vous éditez ici pour | modifier le fonctionnement de la rédaction | modifier ce qui est rédigé |
```sh
ls content/          # pipeline/ only  ⇒ platform;  paper dirs ⇒ folio
```
folio-assistant ne contient aucun contenu. Si vous vous apprêtez à y écrire de la matière — un chapitre, une constante, une liste de mots-clés de chapitre — vous êtes dans le mauvais dépôt, ou ce que vous écrivez devrait être des données fournies par le folio. Voir §7.
## 2. Vos cinq premières minutes
```sh
beans prime && beans list      # the work-plan — see §6
scripts/session-start-coord-sweep.sh   # CLI-independent equivalent
bun run src/index.ts --check-deps      # what this environment can do
```
`--check-deps` matters more than it looks. Many checks degrade to `n/a`
rather than failing when a tool is missing (no Lean toolchain, no Atlas,
no LaTeX). **An `n/a` is not a pass.** If you report "all clean" without
knowing what was skipped, you are reporting the absence of data as a
result.
## 3. Trouvez la bonne compétence — n'improvisez pas
Skills are the unit of work here. Before hand-rolling a procedure, check
whether one exists. **Ask for it; do not navigate to it.**
```
skill_list                                      # every skill, with its summary
skill_fetch skill="<id>" package_name="<pkg>"   # the instruction body to follow
work_plan_prime                                 # the work plan — see §6
```
No MCP server attached? The same graph is on disk, and reading it is three
steps rather than a remembered path: open `harness.json` at the repository
root, take each `directories[]` entry whose `graphs` includes `cat-harness`,
and read the `.md` files under it.
**Read [`kg-navigation`](../reference/skill-instructions/kg-navigation.md)
before your first search.** It carries both routes in full, what counts as a
skill (three node kinds under those paths are not skills), and the three ways
the search goes wrong — including the one where you edit the wrong copy of a
skill that exists in three.
This section used to list three directory paths instead. That is the practice
`AGENTS.md` opens by warning against — *"hardcoding a path is how a skill goes
missing the moment the layout moves"* — and one of the three names a graph kind
that has since been renamed. The declaration is the answer; a path is a
snapshot of it.
Two generated references are worth knowing about, and neither is where you
start:
| Where | What it gives you |
|---|---|
| [Skill schema reference](../reference/skills/) | generated input/output contract per skill |
| [Skill instructions](../reference/skill-instructions/) | generated full instruction bodies |
| [Skills & roles](../skills.html) | how skills, roles, and capabilities compose |
Both `reference/` directories are **generated** — never hand-edit them.
Regenerate with `bun run scripts/gen-schema-docs.ts` and
`bun run scripts/gen-skill-docs.ts`.
## 4. The content object model, briefly
A content block is a **triple** sharing a root name:
```
<block>.ts     manifest — label, kind, uses[], lean.ref, cites[]
<block>.md     the narrative a reader actually reads
<block>.lean   the formalisation (when the kind requires one)
<block>.qa.json  QA sidecar — audit results, per criterion
```
The `.ts` manifest is the source of truth for structure. Formalisation
*status* is derived at build time, never stored in the manifest.
## 5. Two dependency relations — do not conflate them
This trips up agents constantly.
- **`uses[]` is editorial.** "What must a reader have read to follow
  this block?" Authored — agent/human maintained.
- **The formal graph is machine-derived** from `lean.ref`, never
  hand-written.
They diverge legitimately in both directions: a proof invokes `simp`
lemmas nobody needs to read about; a theorem is motivated by an example
it never formally cites.
**Never populate `uses[]` from Lean.** It destroys the signal every
ordering metric is computed from. For impact questions ("what breaks if
this changes?") take the union:
```sh
bun run content/pipeline/content-graph.ts content/<paper>
```
Auditing whether `uses[]` is well used is its own skill:
`uses-editorial-review`, plus the mechanical `uses` QA axis.
## 6. Track work in beans, not in your head
`beans` is the **single** todo mechanism — session-local *and*
cross-agent. `beans/` is committed, so a plan survives a resume in a
fresh container.
```sh
beans list
beans create "<title>"
beans update <id> --status in-progress    # CLAIM before you work
```
Claim before working so two sessions don't pick the same item, and never
resolve a sibling's bean, and never delete ANY bean — scrap it with reasons instead. Do not stand up a parallel todo
store. Do not `beans create` bulk machine-generated queues (`*.qa.json`,
witness files) — those stay as bulk JSON.
Full discipline: `skills/folio-core/todo-manager.md`,
`skills/folio-core/bean-coordination.md`.
## 7. QA sidecars and axes
Every block can carry `<block>.qa.json` recording, per criterion, what
each reviewer found — `script`, `agent`, or `human`. Entries carry the
source-file hashes at audit time, so an entry goes **stale** when the
block is edited and must be re-adjudicated.
Criteria are grouped into **axes** (`proof`, `voice`, `detangler`,
`uses`, `canonical`, `compute`, `bibliography`, …). Run one:
```sh
bun run content/pipeline/qa-sweep.ts --axis uses content/<paper>
bun run content/pipeline/qa-staleness.ts content/<paper>
```
Some criteria are `automated: true` (a script decides) and some are
`automated: false` (an agent or human must adjudicate). The second kind
costs real turns — see `semantic-cone.ts` for scoping them by what they
can actually affect.
**Folio-optional axes.** An axis encoding one folio's subject matter is
registered only when the folio opts in:
```json
// harness.config.json
{ "qaAxes": ["q-usage"] }
```
Likewise, folio-specific *data* belongs in the folio, not the platform —
e.g. `content/<paper>/topic-keywords.json` drives
`detangler-topic-coherence`, and absent it the checker reports `n/a`.
## 8. Shipping work
```sh
/prepare-merge [base]
```
Runs the generic recipe plus content-type-specific gates (paper →
content_validate / qa_sweep / proof_status / latex_preflight /
lean_build), then pushes. **It does not merge.**
Watching a sibling PR: `/watch <pr|branch>`.
## 9. Where to look things up
| Question | Answer |
|---|---|
| Project commands, conventions | `AGENTS.md` (the agent-generic source of truth) |
| What a skill does | `skills/**/`, or the generated [instruction bodies](../reference/skill-instructions/) |
| A skill's typed contract | [Skill schema reference](../reference/skills/) |
| What a QA criterion means | `content/pipeline/qa-criteria-registry.ts` — descriptions are the spec |
| The block schema | `schemas/types.ts` |
| The QA sidecar schema | `schemas/block-qa.ts` |
| What this environment can do | `.claude/skills/capabilities/*.json`, `--check-deps` |
| Lean tooling roadmap | [Lean tooling proposal](../proposals/llm-authoring-tool-integration.html) |
## 10. Habits that keep you out of trouble
- **`n/a` is not a pass.** Say what was skipped and why.
- **Claim a bean before durable work.** Others may be running.
- **Don't hardcode a paper name.** A folio may hold several; resolve
  with `findPapers()` / `soleFolioPaper()` from
  `content/pipeline/repo-root.ts`.
- **Don't write content into the platform.** If it names a chapter, a
  constant, or a vocabulary, it is folio data.
- **Regenerate, never hand-edit,** anything under `docs/reference/`.
- **Read the criterion description before acting on a finding.** They
  state severity, intent, and what explicitly does *not* count.