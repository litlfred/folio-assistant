---
# folio-assistant-wggr
title: 'SPLIT: invert the stub pattern — <stub>/docs not docs/<stub>, so a repo is one directory'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T11:51:29Z
updated_at: 2026-09-19T18:04:06Z
parent: folio-assistant-vke6
---

Owner direction, 2026-09-19: "dont do docs/<stub> tools/<stub> etc, rather do <stub>/docs and <stub>/tools. update the references/graph/dirs and then move is much cleaer.... this dir is this repo. and we can do more QA here before separation. so there would be in top-level only bootstrap/ cat-harness/ f-a-core/ etc. all content migrated to respective expexted dirs. also keeps URI/IRIs not so redundant."

## What changes

The stub pattern INVERTS. `docs/<stub>/`, `tools/<stub>/`, `skills/<stub>/` become `<stub>/docs/`, `<stub>/tools/`, `<stub>/skills/`. The top level then holds one directory per instance and nothing else that belongs to an instance.

WHY IT IS BETTER, and each reason is independent:

1. SEPARATION BECOMES A MOVE, NOT A SIFT. Today extracting cat-harness means walking every top-level directory and taking the `cat-harness/` subdirectory out of each. After, it is one `git mv` of one directory. The current `repo-partition.ts` exists precisely because the cut is hard to compute; under the inversion the directory IS the answer.
2. THIS DIRECTORY IS THIS REPO. A reader opening `cat-harness/` sees everything that repository will contain, rather than reconstructing it from eight places.
3. THE IRIs STOP REPEATING THEMSELVES. `.../folio-assistant/docs/folio-assistant/...` is the shape today. The stub appears once.
4. QA BEFORE SEPARATION. Everything can be checked in one checkout while the pieces are still together — which is the argument for doing this BEFORE the split rather than as part of it.

## How to do it, and the order is the whole plan

DECLARATION AND READERS FIRST, FILES SECOND. Update `harness.json`, `schemas/cat-harness.ts` defaults, and every consumer to resolve the new shape while the files are still where they are; verify green; and only then `git mv`. That way the move is the cheap half and the gates prove it landed rather than being the thing that discovers the breakage. The reverse order makes every gate red at once with no way to tell which failure is which.

This is affordable now in a way it was not this morning: `directoryForGraph()` and `kgRoots()` exist and 90 of 127 hardcoded declared-path literals are drained, so most consumers already ask the declaration. `check:declared-paths` names the ones that do not — the remaining 37 are the work list, not a guess.

## Two questions the owner has not answered

- DOES `bootstrap/` BECOME A STUB LIKE THE REST, or stay top-level? It is already in the new shape, which is a useful accident. But it is also the one thing that must be readable BEFORE any stub is resolved, so an argument exists for it being special. Asked, not assumed.
- DO `beans/` AND `todos/` STAY TOP-LEVEL? The owner said earlier they do not take the stub pattern, because they are never overlaid. If that holds, the top level is `bootstrap/ cat-harness/ f-a-core/ beans/ todos/` — five entries, not three.

## Collision to watch: fsh-guts

PR #403 (`claude/brave-hypatia-r820sf`) adds `fsh-guts/` as a NEW top-level directory — the not-rendered store for deprecated material — and moves the four proposals into it. That is a sixth top-level entry and it is not an instance stub, so whatever rule this bean settles has to say where a non-instance top-level directory stands. Verified on the branch, not from its description.

Same PR is a live conflict for a different reason: it deletes `docs/folio-assistant/proposals/`, which now holds `bootstrap.md` created after they branched. Raised on the PR rather than resolved unilaterally.

## Sibling sessions in flight, measured 2026-09-19 ~11:50 UTC

Four PRs opened within the hour, all of which this move would conflict with if it landed first: #410 (roadmap epics, beans only), #409 (readme:audit in CI — which will make a dead README link a RED BUILD once this moves docs), #408 (note anchors), #403 (fsh-guts, above). `ListAgents` reports no live peer session, so coordination is through this bean and the PRs, not messaging.

THE SEQUENCING CONSEQUENCE: this touches nearly every path in the repo, so it should land when the in-flight set is small, and the four above should merge first. A move of this size that jumps the queue costs four sessions a conflict each.

## Answered — bootstrap is top-level, and is the ONE exception

Owner, 2026-09-19: "boottreap is top level but will be a part of cat-harness (one exception for top-leve vs repo name)".

THE RULE, stated fully: a top-level directory's name IS a repository name. Exactly one directory breaks it — `bootstrap/`, which sits at top level but SHIPS INSIDE cat-harness.

WHY THE EXCEPTION IS THE RIGHT ONE, and it is not convenience. Bootstrap's whole job is to be readable BEFORE the reader knows which stub to resolve. Putting it at `cat-harness/bootstrap/` makes that circular: an agent would have to already know cat-harness is the harness in order to find the file that tells it what a harness is. Every other directory can be found once you know the instance; this one is what you read to find out.

So `bootstrap/` is top-level for RESOLUTION and part of cat-harness for OWNERSHIP, and those two facts do not have to agree. Worth saying plainly because a later reader will see a top-level directory that no repository is named after and try to tidy it away.

## Still open, and the answer above sharpens rather than settles it

"One exception" and the earlier rule that `beans/` and `todos/` take no stub cannot both be read the loose way. Two readings reconcile them and they lead to different trees:

(a) THEY STAY TOP-LEVEL — then there are three exceptions, not one, and the rule as stated is wrong.

(b) THEY LIVE IN EXACTLY ONE STUB — `cat-harness/beans/`, `cat-harness/todos/`. "Takes no stub pattern" then means what it originally meant: they are never OVERLAID across instances, one directory per instance merging into a whole. That is a different claim from "sits at the top level", and (b) keeps the exception count at one.

(b) is the reading consistent with both statements, so it is what this bean assumes until told otherwise. Recorded rather than silently adopted because it moves two committed stores and every path that reads them, and being wrong about it is expensive.

`fsh-guts/` from PR #403 is a third case the rule has to answer: a top-level directory that is neither a repository name nor bootstrap. Under (b) it is a second exception, which the rule as stated does not allow.

## Answered — beans/ and todos/ stay top-level (reading (a))

Owner, 2026-09-19: "beans/ todos/ stay top-level". This bean had recorded reading (b) as its working assumption and (b) is WRONG. Corrected here rather than edited away, because the next reader should see that the loose reading was tried and rejected.

WHAT THE RULE ACTUALLY IS, restated so it covers every case now known:

The top level holds three kinds of thing.

1. INSTANCE STUBS, each named after the repository it becomes: `cat-harness/`, `f-a-core/`, `f-a-sci/`. This is the set separation walks.
2. NON-INSTANCE STORES that are never overlaid and belong to no single instance: `beans/`, `todos/`, and `fsh-guts/` (PR #403). "Takes no stub pattern" means exactly this — not that they sit anywhere in particular, but that there is one of each and it is not composed from per-instance parts.
3. `bootstrap/` — instance-SHAPED (it ships inside cat-harness) but not named after a repository. This is the one exception the owner named, and it is an exception within category 1, not against the whole top level.

So "one exception for top-level vs repo name" is a claim about the INSTANCE-shaped directories: every one is named after its repository except bootstrap. It was never a claim that the top level contains nothing else.

That reading makes all three owner statements consistent — beans takes no stub, bootstrap is the one exception, top level holds bootstrap/ cat-harness/ f-a-core/ — where (b) had to contradict the first to keep the second.

## What this settles for the migration

The directories that MOVE are exactly the per-instance parts of `docs/`, `tools/`, `skills/`, `schemas/`, `library/`, `voices/`, `translations/`. The stores that DO NOT move are `beans/`, `todos/`, `fsh-guts/`, and `bootstrap/` is already where it will stay.

That is a smaller migration than the first framing implied, and it removes the expensive half: no committed work-plan store moves, so no path that reads a bean or a todo changes, and `.beans.yml` and `WORKFLOW_DIR` — the two duplicates `check:harness-dirs` gates because neither can be removed — are untouched.

## Measured — a config file that names the site root will NOT be caught by the code guard

_2026-09-19T13:40Z, on `0f110b294`._ Pass 1 moved the site root by changing one
function, and every one of 73 code references already went through
`siteDir`/`siteDirFor`. That was true, and it is why the code half looked free.

`.gitignore` is not code. It named the site root **five times**, every one
still `docs/`, while `docs-site.yml` had already been pointed at
`./folio-assistant/docs` — so it broke in both directions at once:

- `!docs/assets/js/` and `!docs/_includes/*.js` stopped reaching the moved
  tree, so the blanket `*.js` rule swallowed it. The three files already there
  survive only because git does not untrack what is tracked; a NEW asset under
  the site root would have been invisible to `git add`. **The comment beside
  that negation records this exact failure happening before**, verbatim:
  "`git add` reported nothing and the file would simply never have deployed."
- `docs/.bundle/` and `docs/vendor/` stopped reaching it too, unignoring the
  bundler gem tree — which the same comment prices at **3,080 files and 53 MB**
  that any `git add -A` sweeps into a commit. Measured that morning;
  reintroduced that afternoon by this move.

**Neither was visible, and the reason generalises past `.gitignore`.** A
working tree that predates the move still HAS a `docs/`, holding build
residue, so the stale rules went on matching something. A rule that matches
the wrong thing reads exactly like a rule that matches the right thing —
which is why "I moved the site root and nothing broke" was not evidence.

Fixed, and guarded in `site-dir-single-answer.test.ts`: it asserts what git
DOES to a probe path (assets stay addable, build state stays ignored) rather
than how the rule is spelled, and it is perturbed both ways — reverting either
half fails it alone.

### What this means for the `cat-harness` rename, which is the next step

The guard composes its probes from `siteDirFor(ROOT)`, so renaming the stub
flips it to red until `.gitignore` follows. That is the intended behaviour and
should not be worked around.

Checked each non-`.ts` file that can name the site root, rather than assuming:

- [ ] **`.github/workflows/*.yml` — outstanding, and the largest.**
      `docs-site.yml` carries `folio-assistant/docs` in five places, including
      a literal `source: ./folio-assistant/docs` and the `paths:` trigger that
      decides whether the workflow fires AT ALL; `feature-staging.yml` the
      same. A stale `paths:` is the `xom7` shape — the site silently stops
      redeploying, and nothing says so.
- [x] **`eslint.config.mjs` — already fixed in pass 1, and it is the pattern
      to copy.** Its ignore glob was `docs/**/_includes/`, which broke the
      moment the stub inverted and got a Jekyll Liquid fragment linted as
      TypeScript. It is now `**/docs/**/_includes/`, which the comment states
      "survives the site root moving in EITHER direction" — a glob loose
      enough to be indifferent to the layout beats a literal that has to be
      maintained, wherever correctness does not need the precision.
- [x] `.gitignore` — fixed and guarded above.

**`folio-assistant/docs/_config.yml` is a TRAP, not a to-do.** It carries
`baseurl: "/folio-assistant"`, and I nearly listed it as something the rename
must update. It must NOT be touched. `baseurl` is the PUBLISHED base path,
which on GitHub Pages follows the REPOSITORY name — it is unrelated to the
stub directory the sources happen to sit in. Renaming `folio-assistant/` to
`cat-harness/` changes where the sources live and nothing about where they
publish. Anyone running a find-and-replace of `folio-assistant` across the
repo breaks every published URL in one commit, and the site would still build
green.

That is the same `canonicalUrl`-vs-path distinction the declaration already
draws, arriving in a file that is not the declaration.

The lesson to carry, not just the list: **pass 1's "it was one function" was a
measurement over `.ts` only.** Every config format in the repo spells the site
root a second time, none is covered by the guard that made pass 1 look cheap,
and one of them looks like it needs updating when it must be left alone.

## Claimed, first slice landed — and the scope list contradicts the owner's quote

_2026-09-19, PR #434, branch `claude/fervent-mccarthy-nw4olk`._ #413 landed
`docs/` and `tools/`. `voices/` -> `folio-assistant/voices/` is in.

**One declaration edit, nothing else.** `harness.json`'s `voices` path, and no
consumer needed touching — `check-voices.ts` resolves through
`directoryForGraph`, so 36 voice rules kept resolving. That is this bean's
"declaration and readers first" paying off as a measurement: the readers were
already done, so the move was the cheap half exactly as predicted.

**`DEFAULT_DIRECTORIES` was deliberately NOT changed**, and the reasoning
generalises to every remaining slice. The defaults are the fallback for an
instance that declares nothing; moving this instance's directory is a fact about
THIS declaration. Editing the default would relocate the voices directory of
every unmigrated downstream folio — and the breakage would appear in their
repository, not in the commit that caused it. So: `harness.json` changes, the
defaults do not, and **a consumer that needs an edit is telling you it hardcodes
a path.**

### The hazard for the next slice is a YAML trigger, not code

`.github/workflows/docs-site.yml` fires on `folio-assistant/docs/**` (correct
after #413) and ALSO on `processes/**`, `schemas/**` and
`content/docs/**`. Move any of those three without moving the trigger and the
site silently stops rebuilding on a skill or schema edit — green CI, stale
site, nothing saying so. The `xom7` shape, and no code guard covers it. This is
the same class as the `.gitignore` finding above: pass 1's "it was one function"
was a measurement over `.ts` only, and every config format spells the root a
second time. `voices/` is in no trigger, which is part of why it went first.

### The scope list and the owner's quote disagree — NOT resolved here

§"What this settles for the migration" names the movers as the per-instance
parts of `docs/`, `tools/`, `skills/`, `schemas/`, `library/`, `voices/`,
`translations/`. It omits `src/`, `scripts/`, `content/` and `adapters/`.

The owner's direction quoted at the top of this bean is *"so there would be in
top-level only bootstrap/ cat-harness/ f-a-core/ etc. all content migrated to
respective expexted dirs"* — and those four are neither instance stubs nor
category-2 stores (`beans/`, `todos/`, `fsh-guts/`) nor `bootstrap/`. Under the
rule as restated above they have no category to sit in, so either the list is
incomplete or the rule needs a fourth category for shared platform code.

~1000 tracked files of difference. Put to the owner rather than picked.

Blast radius, measured, so the answer can be priced:

| directory | tracked | ts literals | in the list? |
|---|---|---|---|
| `skills/` | 290 | 64 | yes |
| `schemas/` | 122 | 65 | yes |
| `library/` | 1402 | 26 | yes |
| `translations/` | 199 | 24 | yes |
| `scripts/` | 375 | 153 | **no** |
| `content/` | 593 | 156 | **no** |
| `src/` | 54 | 96 | **no** |
| `adapters/` | 30 | 25 | **no** |

## `skills/` was attempted and REVERTED — the inventory is the deliverable

_2026-09-19, on `c22b561b4`._ Tried as slice three, reverted rather than pushed.
`voices/` and `translations/` stand; `skills/` stays at top level for now.

**Why reverted:** the move left `kg:audit` generating **243 sidecars where main
generates 251**, and I could not explain the 8. Measured both ways rather than
assumed — main regenerated from scratch keeps all 251 and its own
`kg:audit:check` exits 0, so those 8 are audited there and my tree lost them.
The 8 are all one level deeper than a package (`folio-core/bib-qa/qa-tags`,
`folio-core/coordinate/protocol`, `folio-paper-adapter/formalizer/*`,
`folio-paper-adapter/lean-environment-setup/mathlib-cache-fallback`), which
points at `isPartOfASkill()` in `scripts/kg-audit.ts` classifying them
differently under the new path. Not chased further.

**A green gate over 243 of 251 subjects is worse than a red one**, so it was not
going to be pushed either way.

### The defect I introduced and fixed, because it will be re-introduced

`kg-audit.ts` hardcodes `KG_ROOT = join(root, "skills")`. My first fix was
`directoryForGraph(root, "cat-harness")` and it was **wrong in the silent
direction**: `harness.json` has TWO entries declaring that graph, because
`schemas/` carries `["schemas", "cat-harness"]` (a schema IS a KG node), and a
by-graph lookup returns the first. The audit walked `schemas/`, wrote **37**
sidecars, and exited **0**.

`kgDirectories()` in `scripts/known-skills.ts` already guards exactly this and
its comment names this very collision. The correct form is
`kgDirectories(root).find((d) => d.id === "cat-harness")?.absPath`.

This is the SECOND time today the id-vs-graph distinction has bitten this
migration — #413's session hit it in `gen-skill-docs` and recorded that
`harness.json` says "ids are stable across a relocation, paths are not". **A
by-graph lookup is not a weaker version of a by-id lookup; for `cat-harness` it
resolves to a different directory.**

### What `skills/` actually costs, measured — for whoever takes it next

Not 290 files and one declaration edit. Eight distinct surfaces:

| surface | what | found by |
|---|---|---|
| `harness.json` | `cat-harness` path | — |
| 2 workflow triggers | `docs-site.yml` `processes/**`, `feature-staging.yml` `skills/**` | nothing; YAML has no guard |
| `scripts/kg-audit.ts` | hardcoded `KG_ROOT`, resolve BY ID | `kg:audit` ENOENT |
| `src/skills/corpus-grep.ts` | imports `../../skills/framework/types.js` | `tsc` |
| `folio-assistant/skills/framework/types.ts` | outward import depth `../../` -> `../../../` | `tsc` |
| README/AGENTS markdown | 37 link targets (8 + 28 + 1) | `readme:audit`, `check:declared-assets` |
| 2 `.ts` path lists | `schemas/translation-tools.ts` (4), `content/docs/publication-workflow/publication-workflow.ts` (3) | `check:workflow-refs` |
| `test/results/kg-qa/` tree | 250 sidecars MIRROR the subject path, so they relocate | `kg:audit:check` stale |

**My earlier "`skills/` has 0 imports" was a measurement artefact** — the grep
pattern `from "\.\./*skills/` cannot match `../../skills/`. It has at least one,
and one file inside the tree imports outward, so the depth changes. `skills/` is
not a data-only directory.

### Order for what remains, from the trigger survey

`voices/` and `translations/` appear in no workflow trigger, which is why they
landed. Everything left is named in at least one, and a stale trigger is silent:

- `skills/` — `docs-site.yml`, `feature-staging.yml`
- `schemas/` — `docs-site.yml` (`schemas/**`), plus **93 relative imports**
- `library/` — `jsonld-gen-check.yml` (`library/**/structure.json`, `candidates.json`)
- `content/` — `docs-site.yml` (`content/docs/**`), if it is in scope at all

`schemas/` is the genuinely hard one and should go last: 93 imports is the
"rewrites every relative import" step #413 deferred.

## Progress — PR #437

<https://github.com/litlfred/folio-assistant/pull/437>. Unit suite **106 → 0**
failures; all **35 CI gates** green (`render:bpmn:check` needs a browser and
passes with `--with-browser`).

**The declaration gained `scope: "repository"`** — on a directory entry and on
an asset. Four directories (`beans/`, `todos/`, `fsh-guts/`, `bootstrap/skills/`)
and both assets (`AGENTS.md`, `README.md`) belong to the CHECKOUT rather than to
any instance in it. `rootForScope` is the one place it becomes a directory, so
**no consumer changed**. Two alternatives were rejected and why matters:
`"../beans/"` spells the mechanism, states no fact, and is refused by
`check-harness-dirs`, which rejects every dot-prefixed segment; a second
`harness.json` at the repository root would have made every consumer of those
four directories look in two places, which is the criticism `.beans/` already
paid. A repository-scoped entry is **not inherited** — the never-overlaid
property of `beans/` and `todos/` is now held by the resolver rather than
remembered.

**`findInstanceRoot` / `instanceRootFor`.** Nine scripts read this instance's
declaration from `process.cwd()`, which was a claim about the working directory
rather than about the instance. Each passes `import.meta.dir` now, and the
helper walks up to the nearest `harness.json` rather than counting `..`.

**Five checks were reporting clean runs over empty sets**, each found by fixing
the roots rather than by the check itself: `check-declared-assets` (45 dead
links in `AGENTS.md` / `README.md` it had never opened — bean `v8gh`'s shape in
the check written for it), `check-agents-xref` (a census of **0** where it had
been 8, at exit 0), `bean-store-hygiene`, `fsh-guts-not-rendered`,
`harness:dirs:check`.

**Held back deliberately: `stub` stays `folio-assistant`.** An earlier commit on
this branch set it to `cat-harness`, which renames every published `@id` while
the site still builds green. Verified on the publish ref afterwards: 1349 nodes,
**0** minted against `cat-harness`. The directory is a filesystem fact; the stub
is a published name, and they are now allowed to differ.

## Owner rulings, 2026-09-20 — two corrections to what this bean records

### 1. The exception list is THREE, and `fsh-guts/` is not one of them

Owner: *"intent is to have, with exception of bootstrap/ beans/ and todos/, all
other directories are to be the contents of repos"*.

This bean's §"What this settles" puts `fsh-guts/` in category 2 — "NON-INSTANCE
STORES that are never overlaid: `beans/`, `todos/`, and `fsh-guts/`". **That is
wrong.** The exceptions are `bootstrap/`, `beans/`, `todos/`. Everything else at
the top level is the contents of a repository, `fsh-guts/` included, so it
belongs at `cat-harness/fsh-guts/`.

Recorded as a correction rather than edited away, because a sibling reading the
old category 2 would leave it where it is and believe that settled.

**It sharpens `scope: "repository"` rather than complicating it.** That field
(PR #437) was written to mean "never overlaid", which is a judgement. Under this
ruling it means exactly the three exceptions — `bootstrap/skills/`, `beans/`,
`todos/` — and `fsh-guts/` stops carrying it. A closed list beats a criterion
each reader applies for themselves.

Measured 2026-09-20 against the rule, counting tracked directories only:

| tree | non-conforming top-level dirs |
|---|---|
| `origin/main` | **22** — adapters, blueprint, computations, content, deploy, home_page, latex, library, ns, schemas, scripts, skills, src, test, types, ui, uploads, viewer, tools, fsh-guts, test-results, + `folio-assistant/` |
| PR #437 | **3** — `fsh-guts/` (7 files), `tools/` (1 file), `test-results/` (1 file, build residue) |

Still unruled, and inferred rather than stated: the dot-directories
(`.github/`, `.claude/`, `.gemini/`, `.harness/`) and the root files
(`package.json`, `tsconfig.json`, `AGENTS.md`, licences). `.github/` must be at
the repository root because GitHub requires it there, so the rule is read as
covering content directories, not repository infrastructure. Asked, not assumed.

### 2. Beans and todos are introduced by cat-harness, NOT by bootstrap

Owner: *"beans and todos as tools only introduced in cat-harness, not in
bootstrap"*.

**Bootstrap violates this today, and by more than beans and todos.** Measured on
`77bb22d697`:

- `bootstrap/harness.json` declares **two** directories, `skills/` and
  `workflows/`, both holding one graph kind: `cat-harness`.
- `bootstrap/bootstrap.jsonld` publishes **18** `graphKind` nodes — `beans`,
  `bean-defs`, `workflow-state`, `todos`, `todo-items`, `todo-feedback`,
  `folio`, `library`, `qa`, `health`, `voices`, `uploads`, `tools`, `schemas`,
  `translation-sources`, `cat-harness` and the rest.

So bootstrap introduces **17 kinds it does not declare**, including every
bean/todo kind — while `bootstrap/AGENTS.md`, `bootstrap/harness.json` and
`bootstrap/skills/kg-navigation.md` all state in prose that bootstrap has *"no
`beans`"*. The prose is right and the generated graph contradicts it.

**Root cause, and it is a classification rather than a bug.** `COLLECTOR_SCOPE`
in `scripts/kg-export.ts` files `graphKinds` as **`universal`** — "Reads nothing
instance-specific at all — the global graph-kind registry" — so
`collectGraphKinds()` emits every registered kind into whichever instance is
exporting. That classification is what needs revisiting: a graph kind is
CONTRIBUTED BY A LAYER, so the registry is global in storage and not in
ownership.

`collectGraphKinds`' own comment already says as much — *"`cat-harness` and
`schemas` are bootstrap's kinds, `voices` and `library` are core's"* — but
`graphKindNamespace()` currently resolves **all 16** registered kinds to the
cat-harness namespace, so the comment describes an intent the code does not
implement. Either the namespaces are wrong or the comment is; they disagree
today and nothing checks it.

Shape of the fix, not yet implemented and not yet authorised: an instance's
export carries the kinds that instance INTRODUCES, so bootstrap's document
carries `cat-harness` alone. That is one node where there are now 18, and it
makes `bootstrap/AGENTS.md`'s "no beans" true of the graph and not only of the
prose.

Related: `z4mq` item 3 (session todo #8) — the conformance check that any
instance can render its JSON-LD. A check that bootstrap publishes only what it
declares belongs with it.

### Correction to ruling 1 — `fsh-guts/` STAYS, and the original category 2 was right

Owner, 2026-09-20: *"fsh-guts/ is created in tooling of cat-harness. keep it
here (like beans and todos/) as this instance's own working memory."*

**Ruling 1 above is wrong and this supersedes it.** I read "with exception of
bootstrap/ beans/ and todos/" as an exhaustive list and concluded `fsh-guts/`
must move. It does not. The exceptions are **four**: `bootstrap/`, `beans/`,
`todos/`, `fsh-guts/` — which is exactly what this bean's §"What this settles"
said before I "corrected" it. Left in place rather than deleted so the next
reader sees the loose reading tried and rejected, twice now in this bean.

**MEMORY is the reason, and it is a better rule than the one it replaces.**
Category 2 justified these as "never overlaid", which is a criterion each
reader applies — and two readers applied it to opposite answers. They are the
instance's MEMORY: `beans/` the agent's work plan, `todos/` the person's
outstanding items, `fsh-guts/` what was discarded and kept so the next agent
cannot re-enter a dead end. **A repository has one memory, so it cannot be
composed from per-instance parts.** "Never overlaid" is the consequence; being
memory is the rule. `bootstrap/` is the fourth for a different reason entirely
— resolution, not memory — which is why it is the one exception to "a
top-level directory's name is a repository name" and these three are not
exceptions to that rule at all: they are not instance-shaped in the first
place.

**Ruling 2 stands and now reads coherently with this.** The TOOLING and graph
kinds for beans, todos and fsh-guts are introduced by cat-harness; the STORES
stay at the top level. "beans is a cat-harness concept" and "`beans/` is not
inside `cat-harness/`" are both true. `bootstrap/` must introduce none of the
three, which is the violation ruling 2 measured (18 published graph kinds
against 1 declared).

**Net effect on PR #437: none — its `scope: "repository"` set was already
correct.** `bootstrap/skills/`, `beans/`, `todos/`, `fsh-guts/` carry it and
nothing else does. The field's MEANING improves: it is now a closed list of
four rather than a judgement about overlaying.

Re-measured under the corrected rule, tracked directories only:

| tree | non-conforming top-level dirs |
|---|---|
| `origin/main` | **21** |
| PR #437 | **2** — `tools/` (1 file) and `test-results/` (1 file) |

`test-results/.last-run.json` is Playwright residue that is tracked and should
not be; it is not a layout question. `tools/index.ts` is the real one, and it
is NOT obviously a mover: its own header says the barrel stays at the top
deliberately, because five modules import `../tools/index.js` and moving it
would bake this instance's stub into five platform import paths — "the exact
defect the stub pattern exists to remove, reintroduced one directory along".
So it is either a fifth exception with a stated reason, or the five importers
resolve through the declaration instead. Not decided here.

Recorded in agent memory as `the-top-level-is-four-things-and-three-are-memory`
(`platform-boundary-guard`), since "where does this belong" is that agent's
lane and this rule has now been got wrong twice.

## Merging main into PR #437 — what the two-root split found, 2026-09-20

70 commits of main merged in two passes. **208 rename/rename conflicts**, all
`X -> cat-harness/X` here against `X -> folio-assistant/X` on main, resolved
toward `cat-harness/` after comparing every pair byte-for-byte: **208
identical, 0 differing**. Main relocated and did not edit, so nothing of theirs
was lost to the choice. Both sides were already heading here — this bean's own
section is titled "What this means for the `cat-harness` rename, which is the
next step".

**Three silent drops, each this branch's layout meeting code that was correct
while the two roots were one directory.** None would fail on main, and none
was found by the check that owns the area:

1. **Bootstrap's skills left the published graph.** `skillMdDirs` builds from
   the DECLARED `path` — relative to whatever root the entry's *scope* names,
   and `bootstrap/skills/` is repository-scoped — then returns it as if it were
   instance-relative. `collectSkills` joins that to the instance root, finds
   nothing, and `continue`s under the comment *"a package this instance does
   not carry"*. `confirm-harness` became a dangling `hasSkill`; `kg-navigation`
   only LOOKED fine because a second copy exists under `skills/`, which is bean
   `v3se` exactly. Fixed by composing from the `absPath` the resolver already
   produced. Note the first fix returned one joined string, which corrected the
   root and broke the segment shape callers index (`p[0] === "skills"`);
   `skill-coverage.test.ts` caught it by asserting set equality against the
   filesystem.

2. **`check-actor-reach` examined nothing over 27 actors.** `.claude/` is the
   repository's; `root = process.cwd()` named `cat-harness/.claude/`. Its own
   vacuity guard printed "EXAMINED NOTHING" and the test asserting that guard
   fires was the only thing that noticed. Its test then passed ONE root for two
   questions — the actor registry is the repository's, the declaration the
   instance's.

3. **`requirements.txt` and the Python import scan want DIFFERENT roots.**
   `requirements.txt` sits beside `package.json` and CI installs it from the
   checkout root, so it is the repository's; the `.py` files that import those
   packages are the instance's. A single `ROOT` breaks one half whichever way
   it points — at the instance `requirements.txt` is ENOENT, at the repository
   the `scripts/**/*.py` glob matches nothing and the scan reports 0 imports.
   Both named now.

**The pattern worth carrying**: every one of these is a directory resolved
against the wrong root, and every one FAILED SILENTLY in the same direction —
an empty scan reported as a clean one. Where a guard existed it fired; where it
did not, the graph simply lost nodes. That is the argument for the vacuity
guards this repo keeps writing, stated as a measurement rather than a
preference.

**`initializationDoc` narrowed, and the open half is recorded not papered
over.** It composed `<stub>/docs/...` and its docstring claimed a "full
repo-relative path"; `siteDir` returns plain `docs` here because the instance
has a directory of its own. The suffix is now IDENTICAL for every instance,
stronger than "differs only by site root" — **but bootstrap needs the
instance's DIRECTORY to use it**, and with the directory (`cat-harness/`)
deliberately unequal to the stub (`folio-assistant`), `<stub>/` names nothing.
Scanning the top level for a `harness.json` is the declaration-driven answer
and is what `findInstanceRoot` already does in the other direction. **Not
implemented, not assumed.** The test asserting `toContain("base/")` is inverted
rather than deleted and says in place what it no longer proves.

Accepted from main without argument: 11 simulators DELETED (moved to the `qou`
folio that owns them, sha256-verified identical there — the platform/folio
boundary, and main is right), the `determine-intent` -> `confirm-harness` and
`bootstrap.bpmn` -> `initialize-harness.bpmn` renames, and 34 new files git had
already placed. Also relocated 11 files main added under `folio-assistant/`
with no counterpart here, which the rename pass structurally could not see.

Verified: 3078 tests 0 fail, `bun run gates --all` the whole set, tsc and
eslint clean.
