#!/usr/bin/env python3
"""Fetch the PDFs of referenced IRIS items into a scratch folder, to render covers.

Nothing fetched here is committed. A cover on the replica is page 1 of a PDF,
with the WHO emblem masked; a referenced item has no PDF in this repository, so
it shows "no cover". This script runs where iris.who.int is reachable (a GitHub
runner, or agy), downloads each referenced ORIGINAL PDF, checks it against the
sha256 the catalogue already records, and writes a report. Items with no IRIS
handle are looked up by file name through the DSpace search API, and the
candidates are reported, never written into the catalogue by this script.

usage: fetch-referenced-pdfs.py <who-iris root> <out dir> [--only id,id]
"""
import hashlib, json, os, sys, glob, urllib.request, urllib.parse

IRIS = "https://iris.who.int"
UA = {"User-Agent": "litlfred-who-iris-covers/0.1 (+https://github.com/litlfred/who-iris)", "Accept": "application/json"}

def on_iris(url):
    """Refuse (never rewrite) a URL that is not on the IRIS host: hrefs come from IRIS responses."""
    u = urllib.parse.urlsplit(url)
    if u.scheme != "https" or u.hostname != urllib.parse.urlsplit(IRIS).hostname or u.username or u.password or u.port:
        raise RuntimeError(f"refused: not an IRIS URL: {url!r}")
    return url

def safe_name(name):
    """One plain file name, or a refusal: it becomes a path under the out dir."""
    if not isinstance(name, str) or name in ("", ".", "..") or "/" in name or "\\" in name or any(ord(c) < 32 or ord(c) == 127 for c in name):
        raise RuntimeError(f"refused: not a plain file name: {name!r}")
    return name

def get(url, accept_json=True):
    on_iris(url)
    req = urllib.request.Request(url, headers=UA if accept_json else {"User-Agent": UA["User-Agent"]})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    return json.loads(data) if accept_json else data

def original_pdf(uuid, name):
    bundles = get(f"{IRIS}/server/api/core/items/{uuid}/bundles")["_embedded"]["bundles"]
    orig = next(b for b in bundles if b["name"] == "ORIGINAL")
    streams = get(orig["_links"]["bitstreams"]["href"])["_embedded"]["bitstreams"]
    hit = [s for s in streams if s["name"] == name] or [s for s in streams if s["name"].lower().endswith(".pdf")]
    if not hit:
        raise RuntimeError(f"no PDF bitstream among {[s['name'] for s in streams]}")
    return hit[0]["name"], get(hit[0]["_links"]["content"]["href"], accept_json=False)

def search(q):
    url = f"{IRIS}/server/api/discover/search/objects?" + urllib.parse.urlencode({"query": q, "dsoType": "ITEM", "size": 5})
    objs = get(url)["_embedded"]["searchResult"]["_embedded"]["objects"]
    out = []
    for o in objs:
        it = o["_embedded"]["indexableObject"]
        out.append({"uuid": it["uuid"], "handle": it.get("handle"), "title": (it.get("metadata", {}).get("dc.title") or [{}])[0].get("value")})
    return out

def main():
    root, out = sys.argv[1], sys.argv[2]
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    os.makedirs(out, exist_ok=True)
    report = []
    for f in sorted(glob.glob(os.path.join(root, "catalogue/nodes/item-*.json"))):
        n = json.load(open(f))
        slug = os.path.basename(f)[5:-5]
        if only and slug not in only:
            continue
        for b in n.get("bitstreams", []):
            m = b.get("materialization") or {}
            if b.get("bundle") != "ORIGINAL" or m.get("state") != "referenced":
                continue
            row = {"slug": slug, "name": b["name"], "handle": n.get("handle")}
            up = (m.get("provenance") or {}).get("upstream") or ((n.get("materialization") or {}).get("provenance") or {}).get("upstream") or ""
            uuid = up.rsplit("/items/", 1)[1] if "/items/" in up else None
            try:
                if not uuid:
                    row["searched"] = search(b["name"].rsplit(".", 1)[0])
                    row["result"] = "no handle recorded; candidates listed, nothing fetched"
                else:
                    got_name, pdf = original_pdf(uuid, b["name"])
                    sha = hashlib.sha256(pdf).hexdigest()
                    want = (m.get("fixity") or {}).get("digest")
                    row.update(fetchedName=got_name, bytes=len(pdf), sha256=sha, matches=(want is None or want == sha))
                    if want and want != sha:
                        row["result"] = f"sha256 differs from catalogue ({want[:12]}…); not kept"
                    else:
                        d = os.path.join(out, safe_name(slug))
                        os.makedirs(d, exist_ok=True)
                        open(os.path.join(d, safe_name(b["name"])), "wb").write(pdf)
                        row["result"] = "fetched"
            except Exception as e:  # report every item, never stop at the first refusal
                row["result"] = f"error: {e}"
            print(slug, "->", row["result"], flush=True)
            report.append(row)
    json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=1)

if __name__ == "__main__":
    main()
