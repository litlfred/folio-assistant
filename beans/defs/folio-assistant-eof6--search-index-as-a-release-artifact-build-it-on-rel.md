---
# folio-assistant-eof6
title: 'SEARCH INDEX AS A RELEASE ARTIFACT: build it on release, never on staging refresh'
status: todo
type: task
priority: high
created_at: 2026-09-20T09:02:08Z
updated_at: 2026-09-20T09:02:08Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: 'as part of rendeing pipleine, can we tarball or so as binary archives the justthedocs search (and only aviaable on release, not refresh on staging?)'

YES — BUT NOT FOR THE REASON A TARBALL USUALLY WINS, and the distinction decides the design.

**Compression buys nothing on the wire.** GitHub Pages already serves text with `Content-Encoding: gzip`, so a plain `search-data.json` is ALREADY gzip-transferred. Wrapping one JSON in a `.tar.gz` and unpacking it in JavaScript trades a free, standard, cached transformation for a hand-rolled one. A binary archive earns its place only when it carries MANY shards as one artifact.

**Where it does pay is the SIZE BUDGET, and this repository is already over one of its own thresholds.** Measured by the daily health sweep, `test/health/results/repository.health-report.json`:

| | bytes | |
|---|---|---|
| staging previews, 7 of them | 304,159,961 | **~43.5 MB each** |
| warning threshold | 104,857,600 | the owner's own instruction, 2026-09-19: 'issue warning to user when exceeds > 100mb' |
| critical threshold | 786,432,000 | three-quarters of GitHub's documented 1 GB Pages limit |

So the previews are **2.9x the warning threshold** already, at 39% of critical, and every staging refresh rebuilds a full search index that nobody searches. Dropping it from staging is a real saving against a limit that is already being breached, not a hypothetical optimisation.

**And a RELEASE ASSET is not subject to the Pages budget at all.** That is the move that makes a large index possible: a 53 MB index (the measured floor for full IRIS at title+url only) cannot live inside a 1 GB site that must also hold the site, but it can live as a release asset the page fetches.

**STALE IS WORSE THAN ABSENT, and this is the rule to write down.** If staging carries no index, search is visibly unavailable there. If staging carries a REFRESHED-ON-RELEASE index, it returns hits for pages that have since changed — a wrong PASS, believed, which is the failure mode this repository names in `readme-sections`, in `repo-partition` and in `ci-health` alike. So staging must DISABLE search, never inherit an old index.

## Done when
- The index is built in the RELEASE path only, and published as a release asset rather than into the site tree.
- Staging builds skip it and the staging banner SAYS search is unavailable here — silence would read as 'no results'.
- Sharding is decided on measurement, not in advance: one file while it is small, shards only once a measured index exceeds a declared budget.
- The budget is declared with its BASIS, like every threshold in `test/health/`.
