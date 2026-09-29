---
title: LSI and CA on who-iris — each document, and the three together
status: proposal
bean: folio-assistant-ansc
issue: 1482
---

# LSI and correspondence analysis on who-iris

The owner, 2026-09-29: *"use any LSI/glossary/etc. skills newly learned on
who-iris too — on both the individual files and across all three / the
corpus."* Run by one agent, read-only, with the engines in
`content/pipeline/lsi.ts` and `ca.ts`; methods
[`lsi`](../../methodologies/lsi.md) and
[`correspondence-analysis`](../../methodologies/correspondence-analysis.md).

**Everything here is a proposal.** The agent's *readings* of what a page pair
means are an agent's reading and need a person to confirm them; the counts
are measurements. One finding was re-measured independently before acting on
it (the soft hyphens, §4).

Settings: LSI log-entropy, CA raw, `minDf` 2, `maxDfShare` 0.5, seed 1990;
`k = min(60, n − 2)` per document, 100 for the corpus. Units are sections with
≥ 20 tokens: Handbook 215, HQ manual 108, WPRO 19 (342 in all).

| slug | document |
|---|---|
| `9789241548960-eng` | WHO Handbook for Guideline Development, 2nd ed. |
| `who-pub-tps-931` | WHO Editorial Style Manual (HQ) |
| `wpr-rdo-2020-003-eng` | WPRO Publication and Information Products Style Guide |

## 1. Each document on its own

### Handbook

- **Dimension 1:** LSI puts 215/0 sections on one side (a margin); CA splits
  37/178 (a contrast). 12 of the 15 reference-list sections sit on CA's
  positive pole — author names.
- **The chapter structure is recovered, measured:** 56.7 % (LSI) and 50.8 % (CA)
  of each section's top-3 latent neighbours are in its own chapter, against
  9.2 % by chance. That is agreement with the outline, not a claim of
  correctness.
- **No near-duplicates.** CA's one narrow dimension (sec-106, sec-043, sec-228)
  is a real topic — sponsorship and confidentiality — and disappears once the
  soft hyphens are joined.
- **742 soft hyphens (U+00AD)** in 186 section files split words
  (`recommenda|tions`, `organi|zation`) — see §4.

### HQ Editorial Style Manual

- LSI dimension 1 is a margin (108/0); CA's leading dimensions go to the
  place-name annex and the hyphenated-compound lists.
- Near-duplicates 114~117, 115~118, 116~119 (0.97–0.999) are **Annex 3 printed
  twice**, English → local then local → English — intended, not a defect.
- OCR misreads (`nome`, `Manval`, `opproved`) are frequent enough to load LSI
  dimension 2 → bean `yg4c`.

### WPRO style guide — too small to index on its own

19 units and 99.9 % retained: its dimensions are near-identity and **say
nothing about structure**, which is the method's own small-corpus caveat.
Page-level detection still works: pp. 29–31 Lorem-ipsum cover samples (cosine
≈ 1.0), pp. 14–15 font specimens, pp. 20–22 table/graph samples, p. 28 Latin
filler → bean `fnqn`.

## 2. The three together

- **Dimension 1:** LSI 342/0 (margin), CA 46/296 — the pattern the CA node
  records.
- **Cross-document links are mostly weak.** Of the 15 strongest LSI
  cross-document pairs, the agent read 4 as real or plausible, 3 partial, 8
  spurious. Real: WPRO p23/p24 ~ HQ p36 (book structure and mark-up, 0.79 /
  0.73). Best latent-only: WPRO p16 ~ HQ p36 (font-size hierarchy against
  typographic mark-up, 0.52). CA adds HQ p30 ~ Handbook sec-000 (shared
  copyright and disclaimer, real) and two polysemy false positives
  (*currency*, *resolution*).
- **Hubs.** WPRO p3 is the nearest cross-document unit for 56 units and HQ p78
  for 46; the median best Handbook → HQ cosine is 0.195. "Nearest" mostly
  means "least unlike" → bean `9udd` (floor and hub penalty).
- **HQ vs WPRO** overlap only on book structure and mark-up, purpose
  statements and references. WPRO alone covers fonts, colour/accessibility
  samples and cover/spine specification; HQ alone covers place names,
  nomenclature, hyphenation and brackets — 67 of 108 HQ pages (LSI) have no
  WPRO page above 0.2.
- **LSI vs CA** agree on the top-1 cross-document unit for 93 of 342 (27 %),
  and on the target document for 269 of 342 (79 %).

## 3. Terms — glossary candidates

Counts are lexical; clusters come from LSI term–term neighbours on the
soft-hyphen-repaired text.

- **Vocabulary drift, and the evidence is the text, not a cosine:** *quality of
  the evidence* 77 vs *certainty of the evidence* 1, both in the Handbook, and
  sec-153 itself names them as alternatives (with *confidence in the estimates
  of effect*, 5) → bean `ftu0`, as a prefLabel/altLabel candidate.
- **No British/American drift:** all 9 *-isation* forms are proper names (ILO,
  OECD, Cochrane EPOC) and the 3 *center* forms are one US institution — which
  agrees with the voice rule `who-ed-ize-preferred`. Variants with zero
  occurrences on one side (immunisation, colour, behaviour …) are not findings.
- **Needs a person:** health care / health-care / healthcare (6 / 14 / 2); peer
  vs external review (24 / 25 — possibly different concepts; do not merge).
- **Clear clusters:** interest / declaration / conflicts; recommendation /
  strong / conditional / outweigh; PICO / comparator / population;
  capitalization / -ize / -ise.
- **No glossary is declared** by `who-iris.json` or `who-style-guide.json`.
  Proposal (bean `ftu0`): who-style-guide owns one, seeded from the HQ
  manual's own spelling lists; LSI neighbours are only ever SHOWN as suggested
  `related` links, never written.

## 4. Acted on in this PR

**The tokenizer now joins soft hyphens** (`plainText`, tokenizer version 2 in
the index fingerprint so every older index reads as stale rather than fresh).
Re-measured before acting: 742 U+00AD in the Handbook's sections, none in
either style guide, 21 section files in other libraries. The who-iris index
went from 4,103 to 3,937 terms. The section TEXT still carries them, which is
an ingestion defect → bean `3spu`.

## Follow-ups filed

| bean | under | what |
|---|---|---|
| `3spu` | INGEST | normalise U+00AD at ingestion; a check for any left |
| `fnqn` | INGEST | mark WPRO specimen pages as non-prose |
| `yg4c` | INGEST | count and correct the HQ manual's OCR misreads |
| `ftu0` | GLOSSARY | *quality/certainty of the evidence* as altLabels; decide who owns the glossary |
| `9udd` | this work | a floor and a hub penalty on cross-document link proposals |

Each was checked with `bun run lsi:near` first; none had an existing bean at
≥ 0.7.

## Limits

- WPRO is too small for a per-document index.
- A cosine from LSI and one from CA are different quantities; they are never
  compared as numbers or merged.
- The agent's "lexical+latent" label counted shared rare words, not shared
  meaning; four of the top-15 pairs carry it and are still spurious.
- Term neighbours for words with fewer than ~10 occurrences are noise.
- No stemming.
