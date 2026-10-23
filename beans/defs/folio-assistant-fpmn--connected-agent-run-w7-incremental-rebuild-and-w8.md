---
# folio-assistant-fpmn
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run W7 (incremental rebuild, CQL and FML probes) and the W8 full builds on smart-immunizations, with tx.fhir.org'
status: in-progress
type: task
priority: high
created_at: 2026-10-23T16:45:00Z
updated_at: 2026-10-23T16:28:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-qzex` (round 2 done). It runs on the owner's machine,
because cloud sessions cannot reach tx.fhir.org or packages.fhir.org. **You only build
and push.** The cloud thread "Publisher AST" does the diffs and the review
(`ig-ast.ts diff`, `ig-ast-delta-review.bpmn`).

The rules are as in qzex and a9tx:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`.

## 0. Claim

Set `status: in-progress`, add a Log line, then commit and push, as in qzex step 0.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 5607bd7 or later; record it
ls ~/space_cats/ast-real-igs/smart-immunizations/output-ast/manifest.json   # the qzex round-2 base AST; it must exist
```

If the base AST is gone, run qzex step 2 again first. `w7-round.sh` resets the IG clone
to the base AST's own revision before each probe, so the order below is safe.

## 2. Run, in this order

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export && mvn -q compile
W=~/space_cats/ast-real-igs; CP="$PWD/target/classes:$(cat $W/cp.txt)"
for P in cql fml; do mkdir -p $W/w8-$P
  bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7-$P.txt                     # W7: plan and incremental rebuild
  (cd $W/smart-immunizations && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli \
     -ig . -ast-out $W/w8-$P/ast > $W/w8-$P.log 2>&1); echo "w8 $P exit $?"  # W8: full build of the same commit
  git -C $W/smart-immunizations rev-parse HEAD > $W/w8-$P/commit.txt
done
```

Do not pass `-tx`, so both builds use tx.fhir.org. Each W8 build takes about as
long as one qzex build. If any step fails, keep its output, record the last 40 lines in
the Log, and carry on with the next step.

## 3. Record and push

Add a section "Results <date>". For each probe (`cql`, `fml`), give:
- the `changing:` line;
- the plan lines: `decision`, `seeds`, `rebuild`, `load`, and every `full because`;
- the last 30 lines of the incremental build;
- the W8 exit code.

Then push:

```sh
cd ~/space_cats/ast-real-igs
tar czf w7w8.tgz w7-*.txt w8-*.log w8-*/ \
  $(ls -d w7/plan.json w7/ast w7-fml/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7w8 origin/claude/ast-export \
  && mkdir -p ast-results && cp ~/space_cats/ast-real-igs/w7w8.tgz ast-results/ \
  && git add ast-results && git commit -m "ast-results: W7/W8 on smart-immunizations with tx.fhir.org (bean fpmn)" \
  && git push -u origin HEAD
```

Leave out `w7*/work` and `w7*/pkg-cache`, because they are large and rebuildable. If the
tarball is over 90 MB, push only the `.txt` and `.log` files and the `plan.json` files,
and say so.

## 4. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean fpmn: DONE` or `bean fpmn: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `fpmn done, results on branch ast-results/<date>-w7w8`.

## Done when
- [ ] both probes run, W7 and W8, and results recorded
- [ ] results pushed to an `ast-results/<date>-w7w8` branch
- [ ] issue #222 comment posted

## Log

- `2026-10-23T16:28:00Z` — Claimed by `antigravity`.
