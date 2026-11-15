---
# folio-assistant-w3r1
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W3 and W4, package, terminology and page-fragment provenance, on smart-immunizations'
status: completed
type: task
priority: high
created_at: 2026-10-24T10:20:00Z
updated_at: 2026-10-24T12:13:30+02:00
parent: folio-assistant-a9tx
---

W7 and W8 passed in bean `folio-assistant-w7r6`, and the owner lifted the incremental guard
(fork `1fffc3e`). Fork `2924904` adds W3. The AST manifest now carries two new objects:
- `packages`, the pinned package closure;
- `terminology`, the tx server and what each ValueSet expansion was built from.

Fork `0c3b0ca` adds W4 at fragment level (owner, option A). `pages.json`, beside the manifest,
records which source produced which page fragment, and which page includes which fragment.

This round checks that all three are filled on a real build, and that an incremental round carries
them the same as a full build does.

The rules are as in w7r6:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick anything in a9tx.** Report numbers only.

`-verify-incremental` is no longer needed. `w7-round.sh` no longer passes it.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 0c3b0ca or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 72 tests, all must pass
```

## 2. Rebuild the base

The old base has no `packages`, `terminology` or `pages.json`, so rebuild it.

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
cd ~/space_cats/fhir-ig-publisher/ast-export; CP="$PWD/target/classes:$(cat $W/cp.txt)"
git -C $I fetch -q && git -C $I reset -q --hard "@{u}" && git -C $I clean -fdq
rm -rf $I/output-ast
(cd $I && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli -ig . > $W/base-w3.log 2>&1); echo "base exit $?"
grep -c "WARNING: .*differ from the committed revision" $W/base-w3.log    # must print 0
```

## 3. Run the CQL probe

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
bash scripts/w7-round.sh $W cql 2>&1 | tee $W/w3r1-cql.txt
```

## 4. Record and push

Run this, and paste its whole output into a section "Results <date>":

```sh
cd $W && python3 - <<'PY'
import json
def load(p):
    try: return json.load(open(p))
    except Exception as e: return {"_error": str(e)}
for name, p in [("base", "smart-immunizations/output-ast/manifest.json"), ("incremental", "w7/ast/manifest.json"), ("full", "w8-cql/ast/manifest.json")]:
    m = load(p); print("==", name, p, m.get("_error", ""))
    for k in ("packagesUnknown", "terminologyUnknown"):
        if k in m: print("  ", k, m[k])
    pk = m.get("packages", []); print("  packages:", len(pk))
    for x in pk[:3]: print("    ", x.get("id"), x.get("version"), "deps", len(x.get("dependencies", [])))
    t = m.get("terminology", {}); e = t.get("expansions", [])
    print("  server:", t.get("server")); print("  expansions:", len(e))
    print("  with used-codesystem:", sum(1 for x in e if x.get("builtFrom", {}).get("used-codesystem")))
    for x in e[:2]: print("    ", json.dumps(x)[:300])
inc, full = load("w7/ast/manifest.json"), load("w8-cql/ast/manifest.json")
for k in ("packages", "terminology"):
    print("incremental == full for", k, ":", inc.get(k) == full.get(k))
a = {x["valueSet"]: x for x in inc.get("terminology", {}).get("expansions", [])}
b = {x["valueSet"]: x for x in full.get("terminology", {}).get("expansions", [])}
print("expansions only in incremental:", len(set(a) - set(b)), "only in full:", len(set(b) - set(a)),
      "different:", sum(1 for k in set(a) & set(b) if a[k] != b[k]))
for k in sorted(set(a) ^ set(b))[:5]: print("   ", k)
for name, d in [("base", "smart-immunizations/output-ast"), ("incremental", "w7/ast"), ("full", "w8-cql/ast")]:
    pg = load(d + "/pages.json"); print("== pages.json", name, pg.get("_error", ""), pg.get("unknown", ""))
    fr, pa = pg.get("fragments", {}), pg.get("pages", {})
    print("  fragments:", len(fr), " pages:", len(pa), " with a source:", sum(1 for v in pa.values() if "source" in v),
          " unresolvedIncludes:", pg.get("unresolvedIncludes"))
    print("  pages with no fragments:", sum(1 for v in pa.values() if not v.get("fragments")))
    for k in ("Library-IMMZAgeConcepts.html", "index.html"):
        if k in pa: print("   ", k, json.dumps(pa[k])[:300])
    for k in list(fr)[:2]: print("   ", k, json.dumps(fr[k])[:200])
pi, pf = load("w7/ast/pages.json"), load("w8-cql/ast/pages.json")
for sec in ("fragments", "pages"):
    x, y = pi.get(sec, {}), pf.get(sec, {})
    print("pages.json", sec, "only in incremental:", len(set(x) - set(y)), "only in full:", len(set(y) - set(x)),
          "different:", sum(1 for k in set(x) & set(y) if x[k] != y[k]))
    for k in sorted(set(x) ^ set(y))[:5]: print("   ", k)
PY
```

Also give `incremental exit N`, `w8 cql exit N`, and the `Converged` line from `w3r1-cql.txt`. If a
build fails, give the first `Exception` with its 10 lines before.

```sh
cd $W && tar czf w3r1.tgz w3r1-*.txt base-w3.log w8-cql.log smart-immunizations/output-ast/manifest.json smart-immunizations/output-ast/pages.json \
  $(ls w7/plan.json w7/work/plan.json w7/ast/manifest.json w7/ast/pages.json w8-cql/ast/manifest.json w8-cql/ast/pages.json 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w3r1 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w3r1.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W3 and W4 on smart-immunizations (bean w3r1)" \
  && git push -u origin HEAD
```

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean w3r1: DONE` or `bean w3r1: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `w3r1 done, results on branch ast-results/<date>-w3r1`

## Done when
- [x] base rebuilt clean
- [x] CQL probe run (plan, incremental, W8) and the provenance output recorded
- [x] results pushed to an `ast-results/<date>-w3r1` branch
- [x] issue #222 comment posted

## Results 2026-10-24

- **Fork HEAD (`claude/ast-export`):** `0c3b0cae` (72 tests, 0 failures)
- **Base rebuild (`AstExportCli -ig .`):** `base exit 0`
- **`grep -c "WARNING: .*differ from the committed revision" $W/base-w3.log`:** `0`
- **CQL probe (`bash scripts/w7-round.sh $W cql`):**
  - `incremental exit 0`
  - `Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7/ast`
  - `w8 cql exit 0`
- **Results branch on `litlfred/fhir-ig-publisher`:** `ast-results/2026-10-24-w3r1` (`347a251db20985e6c1dd6cbdd190e285edb0049b`)
- **Issue #222 comment:** https://github.com/litlfred/folio-assistant/issues/222#issuecomment-6382969274

```text
== base smart-immunizations/output-ast/manifest.json 
  packages: 17
     @hl7/hl7.fhir.r4.core 4.0.1 deps 0
     fhir.cqf.common 4.0.1 deps 2
     hl7.fhir.us.cqfmeasures 5.0.0 deps 5
  server: {'address': 'https://tx.fhir.org/r4', 'version': '0.17.0'}
  expansions: 192
  with used-codesystem: 2
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.C.DE5|0.2.0", "builtFrom": {}}
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.D.DE107|0.2.0", "builtFrom": {}}
== incremental w7/ast/manifest.json 
  packages: 17
     fhir.cqf.common 4.0.1 deps 2
     hl7.fhir.r4.core 4.0.1 deps 0
     hl7.fhir.us.cqfmeasures 5.0.0 deps 5
  server: {'address': 'https://tx.fhir.org/r4', 'version': '0.17.0'}
  expansions: 192
  with used-codesystem: 2
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.C.DE5|0.2.0", "builtFrom": {}}
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.D.DE107|0.2.0", "builtFrom": {}}
== full w8-cql/ast/manifest.json 
  packages: 17
     @hl7/hl7.fhir.r4.core 4.0.1 deps 0
     fhir.cqf.common 4.0.1 deps 2
     hl7.fhir.us.cqfmeasures 5.0.0 deps 5
  server: {'address': 'https://tx.fhir.org/r4', 'version': '0.17.0'}
  expansions: 192
  with used-codesystem: 2
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.C.DE5|0.2.0", "builtFrom": {}}
     {"valueSet": "http://smart.who.int/immunizations/ValueSet/IMMZ.D.DE107|0.2.0", "builtFrom": {}}
incremental == full for packages : False
incremental == full for terminology : True
expansions only in incremental: 0 only in full: 0 different: 0
== pages.json base  java.nio.charset.MalformedInputException: Input length = 1
  fragments: 0  pages: 0  with a source: 0  unresolvedIncludes: None
  pages with no fragments: 0
== pages.json incremental  
  fragments: 1103  pages: 588  with a source: 588  unresolvedIncludes: 0
  pages with no fragments: 0
    Library-IMMZAgeConcepts.html {"source": "fsh-generated/resources/Library-IMMZAgeConcepts.json", "resources": ["http://smart.who.int/immunizations/Library/IMMZAgeConcepts|0.2.0"], "fragments": ["Library-IMMZAgeConcepts-history.xhtml", "Library-IMMZAgeConcepts-html.xhtml", "menu.xml"]}
    index.html {"source": "input/pagecontent/index.md", "resources": [], "fragments": ["menu.xml"]}
    ImplementationGuide-smart.who.int.immunizations-contained-index.xhtml {"source": "fsh-generated/resources/ImplementationGuide-smart.who.int.immunizations.json", "resources": ["http://smart.who.int/immunizations/ImplementationGuide/smart.who.int.immunizations|0.2.0"]}
    ImplementationGuide-smart.who.int.immunizations-history.xhtml {"source": "fsh-generated/resources/ImplementationGuide-smart.who.int.immunizations.json", "resources": ["http://smart.who.int/immunizations/ImplementationGuide/smart.who.int.immunizations|0.2.0"]}
== pages.json full  java.nio.charset.MalformedInputException: Input length = 1
  fragments: 0  pages: 0  with a source: 0  unresolvedIncludes: None
  pages with no fragments: 0
pages.json fragments only in incremental: 1103 only in full: 0 different: 0
    ImplementationGuide-smart.who.int.immunizations-contained-index.xhtml
    ImplementationGuide-smart.who.int.immunizations-history.xhtml
    ImplementationGuide-smart.who.int.immunizations-html.xhtml
    ImplementationGuide-smart.who.int.immunizations-ip-statements.xhtml
    ImplementationGuide-smart.who.int.immunizations-json-html.xhtml
pages.json pages only in incremental: 588 only in full: 0 different: 0
    Library-IMMZAgeConcepts-testing.html
    Library-IMMZAgeConcepts.change.history.html
    Library-IMMZAgeConcepts.html
    Library-IMMZAgeConcepts.json.html
    Library-IMMZAgeConcepts.ttl.html
```

## Log
- 2026-10-24T11:52:00+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Running Steps 1–4 in background subagent.
- 2026-10-24T12:13:30+02:00 — Completed (`status: completed`): pushed `ast-results/2026-10-24-w3r1` (`347a251d`) on `litlfred/fhir-ig-publisher` and posted comment on `litlfred/folio-assistant#222` (`#issuecomment-6382969274`).
