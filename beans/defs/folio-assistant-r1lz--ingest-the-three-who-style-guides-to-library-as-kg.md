---
# folio-assistant-r1lz
title: Ingest the three WHO style guides to library/ as KG, then derive the three WHO voices
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:46:13Z
updated_at: 2026-09-20T14:19:25Z
parent: folio-assistant-slw1
---

Issue #208. **The documents are now in the repo** — owner uploaded them in `eec93ecc8` (on `main`), at the repo root: `9789241548960_eng.pdf` (2.1 MB), `WHO_PUB_TPS_93.1.pdf` (3.3 MB), `WPR-RDO-2020-003-eng.pdf` (2.8 MB). This removes the blocker recorded earlier this session: `iris.who.int` is denied by this environment's network egress policy (`curl` -> `CONNECT tunnel failed, response 403`; `WebFetch` -> `EGRESS_BLOCKED`), so they could not be fetched.

Owner ordering, verbatim: **'do document ingest -> KG first.'** The ingestion comes before any voice profile is written, and the reason is visible in PR #210: its `voices/who-editorial.json` carries 10 plausible rules (British `-ise`, no period after `Dr`, people-first language, NLM/Vancouver) and `source: null` — asserted from an agent's general knowledge, citing nothing. A voice with no provenance is the same class of defect as a measurement with no date.

## Depends on
The `uploads/` + `library/` declaration bean — there is nowhere to ingest TO until `library/` exists. The three PDFs are currently at the repo root, which is neither stage of the pipeline.

## Done when
- The three PDFs are in `uploads/`, ingested through the documented single entry point into `library/` as L1 KG, and the `ingest-l1-completeness-gate` passes on them.
- Each of the three voice profiles cites the ingested node it derives from — every rule traceable to a passage, so `source` is never null again.
- The folio-assistant's OWN documentation applies none of them: issue #208 says 'the folio-asst's own documentation content doesnt have any voice'.
- Voices are opt-in, never automatic ('we shouldnt autmoatically apply voices... but for now we will turn all three on').
- Reconciled with PR #210 rather than rewritten — it already has `schemas/voices.ts`, a `voice-review.bpmn` and two skills. Its base is `b6fab8ce4` against a `main` that has moved a long way, so it needs a MERGE, not a rebase.

_2026-09-19T00:13:21Z_ — ## Progress — ingestion half done, voice derivation still open

All three documents identified and ingested to `library/`. The third was only identifiable AFTER OCR: its filename is `WHO_PUB_TPS_93.1` and it is 121 scanned pages with zero text layer.

| upload | document | pages | TOC source | result |
|---|---|---|---|---|
| `9789241548960_eng.pdf` | **WHO handbook for guideline development**, 2nd ed (2014) | 179 | embedded outline (258 entries) | 250 sections, sound |
| `WHO_PUB_TPS_93.1.pdf` | **WHO Editorial Style Manual** (1993) | 121, scanned | inferred from its own contents page | 121 OCR pages + 42 sections, good |
| `WPR-RDO-2020-003-eng.pdf` | **Publication and Information Products Style Guide**, WHO WPRO (2020) | 33 | inferred — **WRONG** | `structure.json` only, no sections |

Capabilities had to be installed: `pymupdf`/`pdfplumber` via pip, `tesseract-ocr` and `poppler-utils` via apt. All four probed MISSING at the start of the session (`bun run src/index.ts --check-deps`).

**The OCR'd manual is the primary source for `who-editorial`,** and it already contradicts an assumption: PR #210 asserts 'British spelling as the baseline'. The manual's actual text (p9) recommends Butterworths for British and Dorland's for American spelling 'respectively' as general references, and gives its real rules as worked pairs — 'Crohn disease, not Crohn's disease', 'Down syndrome, not Down's syndrome'. The rules need reading, not assuming, which is the whole reason for ingest-first.

Two pipeline defects found and beaned: `6xaz` (pdf-structure read a sample table on p22 of the WPRO guide as that document's own structure, emitting 11 sections named after another publication) and `rlp5` (`pdf-ocr.py -o` and `pdf-structure.py -o` disagree about whether the path includes `<doc-id>/`, so the two steps of one pipeline do not compose and a second scanned document would silently overwrite the first's cache).

## Still to do
- Derive the three voice profiles FROM the ingested sections, each rule citing the section node it came from, so `source` is never null.
- Reconcile with PR #210 (merge, not rebase — its base `b6fab8ce4` is far behind).
- Keep folio-assistant's own docs on NO voice, per #208.
- The L1 completeness gate has not been run over these three.

_2026-09-19T00:52:55Z_ — ## Voices landed, with a third scoping axis

All four voices derived and cited; `voice-review.bpmn` called from `review-narrative.bpmn`; two skills bound to roles; one QA criterion per voice.

**`voices` is a third criterion-scoping axis, and it defaults the OPPOSITE way from `profiles`.** `profiles` absent means every profile, because narrowing silently stops a check and a wrong pass is believed where a wrong fail is argued with. `voices` present means opt-in only, because applying an unasked-for register produces confident findings against prose written to a different standard — a wrong FAIL at scale. Added to `def_hash` so re-scoping invalidates cached verdicts (bean `cv10` in a new axis).

**The gate is applied ONCE at criterion selection, not per block.** A voice is a property of the folio, so asking 122 times gives 122 identical answers — and for the `automated: false` voice criteria it would have put 4 x 122 phantom rows in the agent queue. Verified both ways: no voice active -> 4 skipped; `who-editorial` active -> 3 skipped and the fourth correctly enters the queue.

**One criterion per VOICE, not per rule.** 34 rules would put 30 permanently `needs-agent` rows on every sidecar — a queue nobody drains. The unit an agent adjudicates is a block against a voice.

Found a third instance of the 'recorded but not in force' family while verifying: `insertAdjudication` appended a RE-adjudication behind the reviewer's own earlier entry, so `list[0]` served reasoning its author had withdrawn. Surfaced because I edited the diagram-count line and my own 2026-09-18 ruling quoted a sentence that no longer existed. A reviewer now supersedes themselves; a different reviewer is still history.

_2026-09-19T09:05:08Z_ — OWNER'S DECISION, 2026-09-19: the three WHO documents leave for a NEW REPO. Verbatim: 'WHO is part of new repo who-style-guide that is 3 docs in lib, KG associated, assoc skills.' So this bean's output moves out of the platform rather than staying namespaced under a stub, which was the alternative on the table. WHAT THE FOUR LIBRARY DOCUMENTS ACTUALLY ARE, measured 2026-09-19 from their manifests and structure.json, because the decision needed them shown rather than counted. 9789241548960-eng = WHO Handbook for Guideline Development, 2nd edition, 752 files, 250 sections, from a 179-page 2.1 MB PDF. who-pub-tps-931 = WHO_PUB_TPS_93.1, 486 files, 121 sections AND 121 OCR pages (the only scanned one), from a 121-page 3.3 MB PDF. wpr-rdo-2020-003-eng = WPR/RDO Publication and Information, 101 files, 33 sections, from a 33-page 2.8 MB PDF. milnorlink = 62 files, 20 sections, and NO source block at all — it did not come through PDF ingestion. The three WHO documents are 1,339 of the 1,402 tracked files; milnorlink is the remaining 62. THE UNIT IS NOT A DOCUMENT, IT IS A BUNDLE, and this is the finding that makes the new repo's scope decidable rather than guessable. Each style guide is a LIBRARY DOCUMENT + A VOICE + (sometimes) A SKILL. WHO: the three documents, plus voices/who-editorial.json, voices/who-guideline-development.json and voices/who-publication-design.json, referenced from schemas/voices.ts and named in processes/evidence-retrieval.bpmn. MILNOR, and it is the same shape one domain over: library/milnorlink, voices/milnor.json, skills/folio-core/milnor-exposition-standard.md, content/pipeline/qa-checkers-voice.ts and scripts/tests/qa-checkers-voice.test.ts. SO milnorlink DOES NOT GO TO who-style-guide. It is a link-theory artefact with a mathematical exposition voice; it belongs with the maths folio (qou or its successor), and grouping it with WHO because both happen to sit in library/ would repeat the mistake of organising by location rather than by what a thing is. CONSUMERS THAT MUST NOT BE FORGOTTEN, because 'move the wiring with the script' applies: eight modules read library/ — adapters/mcp-server/paths.ts, server.ts and tools/graph.ts, content/docs/document-ingestion, content/docs/evidence, content/pipeline/gen-block-jsonld.ts, gen-library-jsonld.ts and graph-index.ts — and scripts/tests/qa-checkers-voice.test.ts names a slug directly. library/ is also DECLARED in harness.json as a  graph with a real description, so the declaration moves with the files or becomes the dh4f defect (a declared directory nothing populates). NOT YET DECIDED and worth settling before the first git mv: whether the platform keeps an ingestion test corpus at all once these leave. Eight consumers and a slug-naming test suggest something has to remain for them to exercise, and a fixture that is honestly labelled a fixture is not the boundary violation AGENTS.md's banner is about.

_2026-09-19T09:05:39Z_ — MILNOR'S DESTINATION, owner 2026-09-19: 'milnor + its KG goes in folio-asst-sci library as source text for derived milnor skill.' So the two style-guide bundles go to two DIFFERENT repositories and neither stays in the platform: the three WHO documents to a new who-style-guide repo, milnorlink to folio-asst-sci. folio-asst-sci is already one of the five partition targets repo-partition.ts assigns to (40 modules today), so this is filing content into an existing destination rather than inventing one.

AND THE PHRASE 'SOURCE TEXT FOR DERIVED MILNOR SKILL' NAMES THE RELATION, which is worth recording because it is the general shape rather than a one-off. skills/folio-core/milnor-exposition-standard.md is DERIVED FROM library/milnorlink — the skill states an exposition standard that the document exemplifies, and voices/milnor.json is the voice that standard is written in. The library document is the evidence; the skill is what was learned from it; the voice is how it reads. That is the same triple the WHO bundle has, and it explains why the three parts cannot be split across repositories: a skill derived from a source text in another repo would cite evidence its own instance cannot resolve.

CONSEQUENCE FOR THE PLATFORM, and it is the open question this leaves: once BOTH bundles leave, library/ is empty and its declaration in harness.json has nothing to point at. Eight modules read library/ and scripts/tests/qa-checkers-voice.test.ts names a milnor slug directly, so either something replaces them as an ingestion fixture or those consumers lose their only corpus. A declared-but-empty library/ is precisely the dh4f defect — a consumer scans nothing and reports a clean run over it — so the declaration must go with the content, not linger.

_2026-09-19T09:10:43Z_ — THE INGESTION PIPELINE IS ONE TOOL SET AMONG SEVERAL — owner, 2026-09-19: 'current OCR etc pipeline is jsut one set of tools. another is coming.' This ANSWERS the question this bean left open two notes ago rather than adding a new one, and it answers it the other way from the direction I was leaning.

THE OPEN QUESTION WAS whether the platform keeps an ingestion corpus at all once the three WHO documents leave for who-style-guide and milnorlink leaves for folio-asst-sci. I had noted that eight modules read library/ and one test names a slug, and left it undecided, suspecting the honest answer was 'label them fixtures and keep them'. A SECOND PIPELINE SETTLES IT: two implementations of the same job need a shared corpus to be compared on, and a comparison is worth exactly as much as the corpus is representative. So something stays — not as leftovers nobody removed, but as the thing both pipelines are measured against. The scanned document is the one that matters most: who-pub-tps-931 is the ONLY one of the four carrying OCR output (121 pages of it), so it is the only existing case that exercises the OCR path at all. Losing it would leave the second pipeline's OCR half with nothing to be compared on.

AND IT RESHAPES tools/<stub>/ FROM A NAMESPACE INTO A MECHANISM. Under 'one pipeline', tools/<stub>/ merely avoids filename collisions between instances. Under 'several tool sets doing the same job', the stub is how a consumer SAYS WHICH ONE it wants — the same shape ContributionRegistry already uses for adapters, where a folio names the adapter it wants rather than the platform hardcoding one. Worth settling before the directories are created: whether a tool set is an INSTANCE (and so takes a stub) or a CONTRIBUTION registered into one (and so does not). Those are different mechanisms and the stub pattern fits only the first. Getting it wrong means either a tool set that cannot be swapped, or a stub level that means two different things in two directories.

CONCRETE THING TO LOOK AT FIRST, before designing anything: content/docs/document-ingestion/ and scripts/pdf-pages.py are today's implementation, and schemas/ holds no interface that either satisfies. A second implementation with no declared contract to meet is how two pipelines end up disagreeing about what a section IS — which bean rlp5 already records happening ONCE INSIDE the current one, where pdf-ocr and pdf-structure disagreed about what a page contains. Two pipelines reproduce that at a larger scale unless the contract is written down first.

## 2026-09-19T16:25Z — the "still to do" list was STALE; only the #210 reconciliation was left

Re-checked every item rather than trusting the note above, and four of the five
were already done on `main`:

| item | state |
|---|---|
| three PDFs ingested to `library/` as L1 KG | **done** |
| the L1 completeness gate passes on them | **done** — `check:l1-complete`, all four entries |
| each voice profile cites the ingested node it derives from | **done** — `check:voices`: 9 / 8 / 8 rules, "every rule cites a source that resolves, with a quote long enough to check" |
| folio-assistant's own docs carry NO voice, and voices are opt-in | **done** — `harness.json` says it outright: "ships four and activates none, because folio-assistant's own documentation carries no voice (issue #208)" |
| reconciled with PR #210 | **the only thing left** |

`source: null` — the defect this bean was opened over — is gone. The rules were
read out of the ingested sections, not asserted.

### PR #210 audit (still open, base `b6fab8ce4`, 17 files, last touched 2026-09-17)

Everything substantive is already on `main`, and in a stronger form:
`schemas/voices.ts`, all four `voices/*.json`, `voice-authoring-guidance`,
`voice-overlay-review`, the `voice-review.bpmn` (relocated to
`processes/` and rendered), and the `one-voice-style-guide` / `editor` /
`one-voice-integration-watcher` integrations. `folio.config.example.json` was
superseded by `harness.config.example.json` in `109beee02`.

**Two things #210 carried that `main` did not.**

1. **The `voices` key in the example config** — fixed here. `readActiveVoices`
   reads `voices.active` from `harness.config.json`, but the example never
   showed it, so a folio author had a working mechanism and no way to discover
   it. Verified by running the real reader over the example (`[]`) and over a
   copy with one voice active (`["who-editorial"]`), rather than assuming.

2. **Bean `nd1m`**, at the old `.beans/` path, which `main` has never had.
   **Deliberately NOT imported**: it covers this bean's work, and creating it
   would be a duplicate — `beans create` dedupes on nothing, which is the
   14 688-duplicate defect. Recorded here so that whoever closes #210 knows
   nothing is lost.

`AGENTS.md` has zero mentions of "voice" while #210 added a section to it. That
is **correct by design, not a gap**: AGENTS.md's own STRICT rule is that
discipline lives in `skills/`, and `harness.json` already carries the `voices`
declaration in full.

### What remains, and it is not mine

#210 is the owner's own PR. Closing it is theirs to do; nothing in it is
unported except the bean above, which is deliberate.


## 2026-09-20 — done: the last item closed overnight, and it was not mine to close

The note above left ONE item — *"reconciled with PR #210"* — and recorded that
closing it was the owner's, not an agent's. **#210 is closed**, 2026-09-20
03:16:13Z, by the owner. Nothing in it was unported except bean `nd1m`, which
was deliberately not imported (it covers this bean, and `beans create` dedupes
on nothing).

**Re-measured all five, not read off the note above** — the note itself was
written because the previous one was stale, and a second-hand pass would
repeat exactly that:

| item | measured |
|---|---|
| three PDFs ingested to `library/` as L1 KG | ✓ `9789241548960-eng`, `who-pub-tps-931`, `wpr-rdo-2020-003-eng` |
| the L1 completeness gate passes | ✓ `check:l1-complete` exit 0. One requirement `audio-transcripts` is NOT DERIVABLE (`1r0p`) and is reported as *not a pass* |
| every voice rule cites a resolving source | ✓ `check:voices` — 4 voices, 37 rules, *"every rule cites a source that resolves, with a quote long enough to check"* |
| folio-assistant's own docs carry NO voice | ✓ `readActiveVoices()` run over this repo returns `[]`, and `harness.json` says why: *"ships four and activates none"* |
| reconciled with #210 | ✓ closed |

`source: null` — the defect this bean was opened over — is gone.

**NOT closed by this, and each has its own home:** the move of the three WHO
bundles to `who-style-guide` and of `milnorlink` to `folio-asst-sci` (owner's
2026-09-19 decision), and the second ingestion pipeline. Those are partition
work, not this bean's Done-when, and the notes above carry the eight
consumers of `library/` that any such move has to bring with it.

## 2026-09-20 — the destination this bean named now exists

`folio-assist-sci/` was created as a staged top-level instance and
`library/milnorlink/` moved into it (bean `frs5`, owner: *"milnor goes in
f-a-sci library/, move all 4 and fix fallout"*). 64 tracked files, `git mv`, so
history follows. Its share of `image-verdicts.json` went with it.

This bean's status is NOT changed here — the derived `milnor` skill and its
citations are a separate question, and resolving somebody else's bean because
one clause of it came true is exactly what `bean-coordination` forbids.


## 2026-09-20, later — the `milnor` voice now has somewhere to go

`w095` moved the three WHO voices into `who-style-guide/` and left `milnor` in
`cat-harness/voices/`, correctly: it is read from a mathematics paper, not a
WHO publication.

What changed is that its destination is no longer hypothetical.
`folio-assist-sci/` exists (bean `frs5`) and holds `library/milnorlink/`, and
`milnor.json` already cites `{ instance: "folio-assist-sci" }` and resolves.
So the remaining move is a `git mv` of one file into a
`folio-assist-sci/voices/` that does not exist yet, plus the declaration.

`check-voices` will follow it without changes — it enumerates the instances
shipping a `voices/` directory since `w095`. Status untouched: this is a note,
not a resolution.
