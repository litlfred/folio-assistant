"""Split a hand-written docs page into a content/docs/<slug>/ node tree.

One-shot migration helper. Node ids are derived with kramdown's own slug rule
so that every anchor the page publishes TODAY keeps working; after the split
they are pinned in the manifest and stop tracking the heading text.
"""
import os, re, sys, json

slug = sys.argv[1]
ROOT = "/home/user/folio-assistant"
src = os.path.join(ROOT, "docs", f"{slug}.md")
flat = slug.replace("/", "-")
out = os.path.join(ROOT, "site-content", flat)
os.makedirs(out, exist_ok=True)

raw = open(src).read()
m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
fm, body = m.group(1), m.group(2)
def fmv(k):
    mm = re.search(rf"^{k}:\s*(.+)$", fm, re.M)
    return mm.group(1).strip() if mm else None
title, nav_order, parent = fmv("title"), fmv("nav_order"), fmv("parent")

def kslug(t):
    t = re.sub(r"`", "", t)
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = t.strip().lower()
    t = re.sub(r"[^\w\s-]", "", t)
    return re.sub(r"[\s_]+", "-", t).strip("-")

# Drop the page's own H1 and its TOC block; the emitter re-creates both. The
# H1 is CAPTURED first: two guides open with a heading that differs from their
# nav title, so discarding it would silently retitle them.
h1m = re.search(r"^#\s+(.+)$", body, flags=re.M)
page_h1 = h1m.group(1).strip() if h1m else None
body = re.sub(r"^#\s+.*?\n(\{:\s*\.no_toc\s*\}\n)?", "", body, count=1, flags=re.S | re.M)
body = re.sub(r"<details[^>]*>.*?</details>\n", "", body, flags=re.S)
body = re.sub(r"^1\. TOC\n\{:toc\}\n", "", body, flags=re.M)

parts = re.split(r"^(#{2,3})\s+(.+)$", body, flags=re.M)
lead = parts[0].strip()
nodes, files = [], {}
seen = {}

# Two link shapes exist under a figure and both must survive the split:
#   [Open the BPMN source](x){: .btn .btn-outline }              -> button
#   [BPMN 2.0 source](x) · [full-size SVG](y) \n {: .bpmn-source } -> caption
# Matched in two steps rather than one regex: the figure block (which spans
# lines and needs DOTALL) and the link line (which must NOT, or a lazy `.`
# swallows the newline the shapes are distinguished by).
FIG_DIV = re.compile(
    r'<div class="bpmn-figure">\s*<img src="([^"]+)"\s*alt="(.*?)">\s*</div>[ \t]*\n',
    re.S,
)
LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
INLINE_ATTR = re.compile(r"\{:[^}]*\}\s*$")
CAPTION_ATTR = re.compile(r"^\{:\s*\.bpmn-source\s*\}\s*$")


def take_figure(chunk):
    """Return (asset, before, after). A figure can have prose on BOTH sides."""
    m = FIG_DIV.search(chunk)
    if not m:
        return None, chunk, ""
    rendered, alt = m.group(1), m.group(2)
    rest = chunk[m.end():]
    lines = rest.split("\n")
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i >= len(lines) or not lines[i].lstrip().startswith("["):
        return None, chunk, ""      # a figure with no link line: leave it alone
    link_line = lines[i]
    style = "button"
    consumed = i + 1
    if INLINE_ATTR.search(link_line):
        link_line = INLINE_ATTR.sub("", link_line).rstrip()
    elif i + 1 < len(lines) and CAPTION_ATTR.match(lines[i + 1].strip()):
        style = "caption"
        consumed = i + 2
    links = [{"text": t, "href": h} for t, h in LINK.findall(link_line)]
    if not links:
        return None, chunk, ""
    # The FIRST link is the asset's source of truth. On a caption-style figure
    # the second is a full-size view of the GENERATED svg, never an edit target.
    source = links[0]["href"]
    asset = {
        "kind": "bpmn" if source.endswith(".bpmn") else "svg",
        "source": f"docs/{source}",
        "rendered": rendered,
        "alt": re.sub(r"\s+", " ", alt).strip(),
        "sourceLinks": links,
        "linkStyle": style,
    }
    before = chunk[: m.start()]
    after = "\n".join(lines[consumed:])
    return asset, before, after


for i in range(1, len(parts), 3):
    hashes, heading, chunk = parts[i], parts[i + 1].strip(), parts[i + 2]
    level = len(hashes)
    nid = kslug(heading)
    seen[nid] = seen.get(nid, 0) + 1
    if seen[nid] > 1:
        nid = f"{nid}-{seen[nid]}"
    node = {"id": nid, "title": heading, "level": level}

    asset, before, after = take_figure(chunk)
    if asset:
        node["asset"] = asset
        intro = before.strip()
        if intro:
            node["lead"] = f"{nid}-lead"
            files[f"{nid}-lead.md"] = intro + "\n"
        tail = after.strip()
        if tail:
            node["block"] = nid
            files[f"{nid}.md"] = tail + "\n"
    else:
        narrative = before.strip()
        if narrative:
            node["block"] = nid
            files[f"{nid}.md"] = narrative + "\n"
    nodes.append(node)

if lead:
    files["overview.md"] = lead + "\n"
    nodes.insert(0, {"id": "overview", "block": "overview"})

for name, content in files.items():
    open(os.path.join(out, name), "w").write(content)
    stem = name[:-3]
    open(os.path.join(out, f"{stem}.ts"), "w").write(
        'import { prose } from "../../schemas/builders.ts";\n\n'
        "export default prose({\n"
        f'  label: "sec:{flat}-{stem}",\n'
        "});\n"
    )

def ts(v):
    return json.dumps(v, ensure_ascii=False)

lines = ['import { webpage } from "../../schemas/webpage.ts";', "", "export default webpage({"]
lines.append(f"  slug: {ts(slug)},")
lines.append(f"  title: {ts(title)},")
if page_h1 and page_h1 != title:
    lines.append(f"  heading: {ts(page_h1)},")
if parent:
    lines.append(f"  parent: {ts(parent)},")
if nav_order:
    lines.append(f"  navOrder: {nav_order},")
lines.append("  nodes: [")
for n in nodes:
    lines.append("    {")
    lines.append(f"      id: {ts(n['id'])},")
    if "title" in n:
        lines.append(f"      title: {ts(n['title'])},")
    if n.get("level", 2) != 2:
        lines.append(f"      level: {n['level']},")
    if "asset" in n:
        a = n["asset"]
        lines.append("      asset: {")
        lines.append(f"        kind: {ts(a['kind'])},")
        lines.append(f"        source: {ts(a['source'])},")
        lines.append(f"        rendered: {ts(a['rendered'])},")
        lines.append(f"        alt: {ts(a['alt'])},")
        lines.append("        sourceLinks: [")
        for l in a["sourceLinks"]:
            lines.append(f"          {{ text: {ts(l['text'])}, href: {ts(l['href'])} }},")
        lines.append("        ],")
        lines.append(f"        linkStyle: {ts(a['linkStyle'])},")
        lines.append("      },")
    if "lead" in n:
        lines.append(f"      lead: {ts(n['lead'])},")
    if "block" in n:
        lines.append(f"      block: {ts(n['block'])},")
    lines.append("    },")
lines += ["  ],", "});", ""]
open(os.path.join(out, f"{flat}.ts"), "w").write("\n".join(lines))
print(f"{slug}: {len(nodes)} nodes, {len(files)} narrative blocks")
for n in nodes:
    print(f"  {n['id']:45s} {'ASSET ' if 'asset' in n else ''}{'md' if 'block' in n else '-'}")
