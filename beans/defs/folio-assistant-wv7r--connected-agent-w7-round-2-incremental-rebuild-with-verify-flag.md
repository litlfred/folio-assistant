---
# folio-assistant-wv7r
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W7 round 2, a real incremental rebuild (with -verify-incremental) and W8, on smart-immunizations with tx.fhir.org'
status: in-progress
type: task
priority: high
created_at: 2026-10-23T18:30:00Z
updated_at: 2026-10-23T20:47:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-fpmn`. In that round both W7 plans were decided `full`, so no
incremental build ran. The reasons are in a9tx under "W7/W8 review of bean fpmn". This round
fixes both causes:
- the base is rebuilt from a clean tree;
- `w7-round.sh` passes `-verify-incremental` (the owner chose option A on 2026-10-23).

It runs on the owner's machine, because cloud sessions cannot reach tx.fhir.org or
packages.fhir.org. **You only build and push.** The cloud thread "Publisher AST" does the
diffs and the review.

The rules are as in fpmn:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick W7 or W8 in a9tx.** The review does that. Report numbers only.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 140e494 or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 64 tests, all must pass
```

## 2. A clean base

The old base is dirty, so rebuild it. The clone is a scratch copy, so resetting it loses nothing.

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
cd ~/space_cats/fhir-ig-publisher/ast-export; CP="$PWD/target/classes:$(cat $W/cp.txt)"
git -C $I fetch -q && git -C $I reset -q --hard "@{u}" && git -C $I clean -fdq
rm -rf $I/output-ast
(cd $I && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli -ig . > $W/base-r3.log 2>&1); echo "base exit $?"
grep -c "WARNING: .*differ from the committed revision" $W/base-r3.log    # must print 0
git -C $I status --porcelain --untracked-files=all | wc -l                   # nonzero is fine: the build's own output
```

## 3. Run both probes

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
for P in cql fml; do bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7r2-$P.txt; done
```

Each probe resets the clone to the base's revision, cleans it, and commits one edit:
- `cql` appends a comment to a CQL file;
- `fml` renames a rule.

It then plans, runs the incremental build with `-verify-incremental`, and runs the W8 full
build from a clean tree. Do not pass `-tx`. If a step fails, keep its output, add its last
40 lines to the Log, and carry on.

## 4. Record and push

Add a section "Results <date>". For each probe, give:
- the `changing:` line;
- every plan line (`decision`, `computed`, `seeds`, `rebuild`, `load`, and any `full because`);
- the `Round N:` and `Converged` or `Did not converge` lines;
- the last 30 lines of the incremental build;
- the `w8 <probe> exit` line.

`decision` should now read `incremental`. If it reads `full`, say so first and give its
reasons.

```sh
cd $W && tar czf w7r2.tgz base-r3.log w7r2-*.txt w8-*.log w8-*/ smart-immunizations/output-ast/manifest.json \
  $(ls -d w7/plan.json w7/ast w7-fml/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7r2 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w7r2.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W7 round 2 (-verify-incremental) and W8 on smart-immunizations (bean wv7r)" \
  && git push -u origin HEAD
```

Leave out `w7*/work` and `w7*/pkg-cache`. If the tarball is over 90 MB, push only the
`.txt` and `.log` files, the `plan.json` files and the manifests, and say so.

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean wv7r: DONE` or `bean wv7r: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `wv7r done, results on branch ast-results/<date>-w7r2`

## Done when
- [ ] clean base built, with no "differ from the committed revision" warning
- [ ] both probes run (plan, incremental, W8) and results recorded
- [ ] results pushed to an `ast-results/<date>-w7r2` branch
- [ ] issue #222 comment posted

## Log
- 2026-10-23T20:47:00+02:00 Claimed bean `folio-assistant-wv7r` (`status: in-progress`); starting Steps 1–5 on `~/space_cats/fhir-ig-publisher` (`claude/ast-export`) and `~/space_cats/ast-real-igs` (Antigravity).
