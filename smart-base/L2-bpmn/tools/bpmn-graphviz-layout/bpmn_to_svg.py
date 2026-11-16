#!/usr/bin/env python3
"""
BPMN-to-SVG layout skill using Graphviz.

Parses a BPMN 2.0 XML file, generates a Graphviz DOT representation with
subgraph clusters per participant swimlane, renders it to SVG, and injects
the resulting coordinates back into the BPMN as <bpmndi:BPMNDiagram> elements.

Usage:
    python3 smart-base/L2-bpmn/tools/bpmn-graphviz-layout/bpmn_to_svg.py INPUT.bpmn [--svg OUTPUT.svg] [--bpmn OUTPUT.bpmn]

Requires: graphviz (dot), python3-lxml or xml.etree.ElementTree
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

# ── BPMN / Graphviz constants ──────────────────────────────────────────
BPMN_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL"
BPMNDI_NS = "http://www.omg.org/spec/BPMN/20100524/DI"
DC_NS = "http://www.omg.org/spec/DD/20100524/DC"
DI_NS = "http://www.omg.org/spec/DD/20100524/DI"

NS = {
    "bpmn": BPMN_NS,
    "bpmndi": BPMNDI_NS,
    "dc": DC_NS,
    "di": DI_NS,
}

# Default sizes for BPMN shape rendering (in pixels)
TASK_W, TASK_H = 160, 80
EVENT_W, EVENT_H = 36, 36
GATEWAY_W, GATEWAY_H = 50, 50
SUBPROCESS_W, SUBPROCESS_H = 200, 120
PARTICIPANT_LABEL_W = 30  # width of the swimlane label band

# Graphviz node shapes mapped to BPMN element types
GV_SHAPES = {
    "startEvent": "circle",
    "endEvent": "doublecircle",
    "task": "box",
    "subProcess": "box",
    "exclusiveGateway": "diamond",
    "parallelGateway": "diamond",
    "inclusiveGateway": "diamond",
}

# Colours per swimlane (cycle through if more participants than colours)
LANE_COLOURS = [
    "#E3F2FD",  # light blue
    "#FFF3E0",  # light orange
    "#E8F5E9",  # light green
    "#F3E5F5",  # light purple
    "#FFF9C4",  # light yellow
    "#FFEBEE",  # light red
    "#E0F7FA",  # light cyan
    "#FBE9E7",  # light deep orange
]


def parse_bpmn(path: str):
    """Parse BPMN XML and return (tree, root, participants, processes, message_flows)."""
    tree = ET.parse(path)
    root = tree.getroot()

    # Find collaboration
    collab = root.find("bpmn:collaboration", NS)
    participants = []
    message_flows = []

    if collab is not None:
        for p in collab.findall("bpmn:participant", NS):
            participants.append({
                "id": p.get("id"),
                "name": p.get("name", p.get("id")),
                "processRef": p.get("processRef"),
            })
        for mf in collab.findall("bpmn:messageFlow", NS):
            message_flows.append({
                "id": mf.get("id"),
                "sourceRef": mf.get("sourceRef"),
                "targetRef": mf.get("targetRef"),
            })

    # Collect all processes
    processes = {}
    for proc in root.findall("bpmn:process", NS):
        pid = proc.get("id")
        nodes = []
        edges = []

        for elem in proc:
            tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
            eid = elem.get("id")
            if eid and tag in GV_SHAPES:
                label = elem.get("name", eid)
                nodes.append({"id": eid, "type": tag, "label": label})
                # Recurse into subProcess children
                if tag == "subProcess":
                    for child in elem:
                        ctag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                        cid = child.get("id")
                        if cid and ctag in GV_SHAPES:
                            clabel = child.get("name", cid)
                            nodes.append({"id": cid, "type": ctag, "label": clabel, "parent": eid})

            if eid and tag == "sequenceFlow":
                edges.append({
                    "id": eid,
                    "source": elem.get("sourceRef"),
                    "target": elem.get("targetRef"),
                    "label": elem.get("name", ""),
                })

        processes[pid] = {"nodes": nodes, "edges": edges, "name": proc.get("name", pid)}

    return tree, root, participants, processes, message_flows


def generate_dot(participants, processes, message_flows):
    """Generate Graphviz DOT string with subgraph clusters per swimlane."""
    lines = [
        'digraph BPMN {',
        '  rankdir=LR;',
        '  fontname="Helvetica";',
        '  node [fontname="Helvetica", fontsize=10];',
        '  edge [fontname="Helvetica", fontsize=8];',
        '  compound=true;',
        '  newrank=true;',
        '',
    ]

    for i, part in enumerate(participants):
        colour = LANE_COLOURS[i % len(LANE_COLOURS)]
        proc = processes.get(part["processRef"], {"nodes": [], "edges": []})
        pname = part["name"]

        lines.append(f'  subgraph cluster_{part["id"]} {{')
        lines.append(f'    label="{_esc(pname)}";')
        lines.append(f'    style=filled;')
        lines.append(f'    color="#90CAF9";')
        lines.append(f'    fillcolor="{colour}";')
        lines.append(f'    fontsize=12;')
        lines.append(f'    labeljust=l;')
        lines.append('')

        # Collect subprocess IDs for sub-clusters
        sub_ids = {n["id"] for n in proc["nodes"] if n["type"] == "subProcess"}
        child_of = {}
        for n in proc["nodes"]:
            if "parent" in n:
                child_of[n["id"]] = n["parent"]

        # Emit sub-clusters for subProcesses
        for sid in sub_ids:
            snode = next(n for n in proc["nodes"] if n["id"] == sid)
            lines.append(f'    subgraph cluster_{sid} {{')
            lines.append(f'      label="{_esc(snode["label"])}";')
            lines.append(f'      style="dashed,filled";')
            lines.append(f'      fillcolor="#FFFFFF";')
            lines.append(f'      fontsize=9;')
            # Add child nodes
            for n in proc["nodes"]:
                if child_of.get(n["id"]) == sid:
                    lines.append(f'      {n["id"]} [{_node_attrs(n)}];')
            lines.append(f'    }}')
            lines.append('')

        # Emit top-level nodes (not children, not subProcess containers drawn as cluster)
        for n in proc["nodes"]:
            if n["id"] not in child_of and n["id"] not in sub_ids:
                lines.append(f'    {n["id"]} [{_node_attrs(n)}];')

        # Emit subprocess container nodes (invisible, for edge routing)
        for sid in sub_ids:
            snode = next(n for n in proc["nodes"] if n["id"] == sid)
            # Pick a child to use as lhead/ltail anchor
            children = [n["id"] for n in proc["nodes"] if child_of.get(n["id"]) == sid]
            if children:
                lines.append(f'    {sid} [shape=point, width=0, height=0, label=""];')

        lines.append('')

        # Emit edges
        for e in proc["edges"]:
            attrs = []
            if e["label"]:
                attrs.append(f'label="{_esc(e["label"])}"')
            # Handle edges to/from subProcess clusters
            src = e["source"]
            tgt = e["target"]
            extra = ""
            if src in sub_ids:
                children = [n["id"] for n in proc["nodes"] if child_of.get(n["id"]) == src]
                if children:
                    src = children[-1]  # use last child as proxy
                    extra += f', ltail=cluster_{e["source"]}'
            if tgt in sub_ids:
                children = [n["id"] for n in proc["nodes"] if child_of.get(n["id"]) == tgt]
                if children:
                    tgt = children[0]  # use first child as proxy
                    extra += f', lhead=cluster_{e["target"]}'
            if extra:
                attrs.append(extra.lstrip(', '))
            attr_str = ", ".join(attrs)
            if attr_str:
                lines.append(f'    {src} -> {tgt} [{attr_str}];')
            else:
                lines.append(f'    {src} -> {tgt};')

        lines.append('  }')
        lines.append('')

    # Message flows (dashed, between swimlanes)
    for mf in message_flows:
        lines.append(
            f'  {mf["sourceRef"]} -> {mf["targetRef"]} '
            f'[style=dashed, color="#666666", constraint=false];'
        )

    lines.append('}')
    return '\n'.join(lines)


def _esc(s: str) -> str:
    """Escape string for DOT labels."""
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    # Wrap long labels
    if len(s) > 35:
        words = s.split()
        result = []
        line = ""
        for w in words:
            if len(line) + len(w) + 1 > 35:
                result.append(line)
                line = w
            else:
                line = f"{line} {w}" if line else w
        if line:
            result.append(line)
        s = "\\n".join(result)
    return s


def _node_attrs(node: dict) -> str:
    """Return Graphviz node attribute string for a BPMN element."""
    ntype = node["type"]
    label = _esc(node["label"])
    shape = GV_SHAPES.get(ntype, "box")

    attrs = [f'label="{label}"', f'shape={shape}']

    if ntype == "startEvent":
        attrs.extend(['width=0.4', 'height=0.4', 'style=filled', 'fillcolor="#4CAF50"',
                       'fontcolor=white', 'fontsize=8'])
    elif ntype == "endEvent":
        attrs.extend(['width=0.4', 'height=0.4', 'style=filled', 'fillcolor="#F44336"',
                       'fontcolor=white', 'fontsize=8'])
    elif ntype in ("exclusiveGateway", "parallelGateway", "inclusiveGateway"):
        attrs.extend(['width=0.5', 'height=0.5', 'style=filled', 'fillcolor="#FFC107"',
                       'fontsize=7'])
    elif ntype == "task":
        attrs.extend(['style="filled,rounded"', 'fillcolor="#FFFFFF"',
                       'width=2.2', 'height=0.7'])
    elif ntype == "subProcess":
        attrs.extend(['style="filled,rounded"', 'fillcolor="#E8EAF6"',
                       'width=2.5', 'height=0.9'])

    return ", ".join(attrs)


def render_svg(dot_str: str, output_path: str) -> str:
    """Render DOT string to SVG using Graphviz, return SVG content."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.dot', delete=False) as f:
        f.write(dot_str)
        dot_path = f.name

    try:
        result = subprocess.run(
            ['dot', '-Tsvg', '-o', output_path, dot_path],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            print(f"Graphviz error: {result.stderr}", file=sys.stderr)
            sys.exit(1)

        with open(output_path, 'r') as f:
            return f.read()
    finally:
        Path(dot_path).unlink(missing_ok=True)


def extract_positions_from_svg(svg_content: str) -> dict:
    """Parse Graphviz SVG output and extract node positions and dimensions.

    Returns dict of {node_id: {"x": float, "y": float, "w": float, "h": float}}.
    """
    # Register SVG namespace
    svg_ns = {"svg": "http://www.w3.org/2000/svg"}

    root = ET.fromstring(svg_content)
    positions = {}

    # Graphviz SVG uses <g> elements with class="node" and id="node_N"
    # The title child contains the node ID
    for g in root.iter():
        tag = g.tag.split("}")[-1] if "}" in g.tag else g.tag
        if tag == "g":
            cls = g.get("class", "")
            if "node" in cls:
                title_el = None
                for child in g:
                    ctag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if ctag == "title":
                        title_el = child
                        break
                if title_el is None or title_el.text is None:
                    continue
                node_id = title_el.text.strip()

                # Find the shape element (ellipse, polygon, path) to get bounds
                for child in g:
                    ctag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if ctag == "ellipse":
                        cx = float(child.get("cx", 0))
                        cy = float(child.get("cy", 0))
                        rx = float(child.get("rx", 18))
                        ry = float(child.get("ry", 18))
                        positions[node_id] = {
                            "x": cx - rx, "y": cy - ry,
                            "w": rx * 2, "h": ry * 2,
                        }
                        break
                    elif ctag == "polygon":
                        points_str = child.get("points", "")
                        coords = []
                        for pt in points_str.split():
                            parts = pt.split(",")
                            if len(parts) == 2:
                                coords.append((float(parts[0]), float(parts[1])))
                        if coords:
                            xs = [c[0] for c in coords]
                            ys = [c[1] for c in coords]
                            positions[node_id] = {
                                "x": min(xs), "y": min(ys),
                                "w": max(xs) - min(xs), "h": max(ys) - min(ys),
                            }
                        break
                    elif ctag == "path":
                        # For rounded rectangles, parse the bounding box from d attribute
                        d = child.get("d", "")
                        nums = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+', d)]
                        if len(nums) >= 4:
                            xs = nums[0::2] if len(nums) > 4 else nums[:2]
                            ys = nums[1::2] if len(nums) > 4 else nums[2:4]
                            # Rough bounding box
                            all_x = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+', d)[0::2]]
                            all_y = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+', d)[1::2]]
                            if all_x and all_y:
                                positions[node_id] = {
                                    "x": min(all_x), "y": min(all_y),
                                    "w": max(all_x) - min(all_x),
                                    "h": max(all_y) - min(all_y),
                                }
                        break

    # Also extract cluster (swimlane) bounds
    for g in root.iter():
        tag = g.tag.split("}")[-1] if "}" in g.tag else g.tag
        if tag == "g":
            cls = g.get("class", "")
            if "cluster" in cls:
                title_el = None
                for child in g:
                    ctag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if ctag == "title":
                        title_el = child
                        break
                if title_el is None or title_el.text is None:
                    continue
                cluster_id = title_el.text.strip()

                # Find polygon for cluster bounds
                for child in g:
                    ctag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if ctag == "polygon" or ctag == "path":
                        points_str = child.get("points", "")
                        if points_str:
                            coords = []
                            for pt in points_str.split():
                                parts = pt.split(",")
                                if len(parts) == 2:
                                    coords.append((float(parts[0]), float(parts[1])))
                            if coords:
                                xs = [c[0] for c in coords]
                                ys = [c[1] for c in coords]
                                positions[cluster_id] = {
                                    "x": min(xs), "y": min(ys),
                                    "w": max(xs) - min(xs), "h": max(ys) - min(ys),
                                }
                        break

    return positions


def inject_bpmndi(tree, root, participants, processes, message_flows, positions):
    """Inject <bpmndi:BPMNDiagram> into the BPMN XML tree using extracted positions."""
    # Register namespaces to avoid ns0: prefixes
    ET.register_namespace("bpmn", BPMN_NS)
    ET.register_namespace("bpmndi", BPMNDI_NS)
    ET.register_namespace("dc", DC_NS)
    ET.register_namespace("di", DI_NS)

    # Remove any existing diagram
    for existing in root.findall(f"{{{BPMNDI_NS}}}BPMNDiagram"):
        root.remove(existing)

    diagram = ET.SubElement(root, f"{{{BPMNDI_NS}}}BPMNDiagram", id="BPMNDiagram_1")
    plane = ET.SubElement(diagram, f"{{{BPMNDI_NS}}}BPMNPlane",
                          id="BPMNPlane_1",
                          bpmnElement="Collaboration_DAKLifecycle")

    # Add participant (swimlane) shapes
    for part in participants:
        pos = positions.get(f"cluster_{part['id']}", {"x": 0, "y": 0, "w": 800, "h": 150})
        shape = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNShape",
                              id=f"Shape_{part['id']}",
                              bpmnElement=part["id"],
                              isHorizontal="true")
        ET.SubElement(shape, f"{{{DC_NS}}}Bounds",
                      x=str(int(pos["x"])), y=str(int(pos["y"])),
                      width=str(int(pos["w"])), height=str(int(pos["h"])))

    # Add node shapes
    for pid, proc in processes.items():
        for node in proc["nodes"]:
            nid = node["id"]
            pos = positions.get(nid)
            if not pos:
                continue

            attrs = {
                "id": f"Shape_{nid}",
                "bpmnElement": nid,
            }
            shape = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNShape", **attrs)
            ET.SubElement(shape, f"{{{DC_NS}}}Bounds",
                          x=str(int(pos["x"])), y=str(int(pos["y"])),
                          width=str(int(pos["w"])), height=str(int(pos["h"])))

    # Add sequence flow edges (simple source→target waypoints)
    for pid, proc in processes.items():
        for edge in proc["edges"]:
            src_pos = positions.get(edge["source"])
            tgt_pos = positions.get(edge["target"])
            if not src_pos or not tgt_pos:
                continue

            e = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNEdge",
                              id=f"Edge_{edge['id']}",
                              bpmnElement=edge["id"])
            # Source right-center → Target left-center
            ET.SubElement(e, f"{{{DI_NS}}}waypoint",
                          x=str(int(src_pos["x"] + src_pos["w"])),
                          y=str(int(src_pos["y"] + src_pos["h"] / 2)))
            ET.SubElement(e, f"{{{DI_NS}}}waypoint",
                          x=str(int(tgt_pos["x"])),
                          y=str(int(tgt_pos["y"] + tgt_pos["h"] / 2)))

    # Add message flow edges (dashed cross-lane)
    for mf in message_flows:
        src_pos = positions.get(mf["sourceRef"])
        tgt_pos = positions.get(mf["targetRef"])
        if not src_pos or not tgt_pos:
            continue

        e = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNEdge",
                          id=f"Edge_{mf['id']}",
                          bpmnElement=mf["id"])
        ET.SubElement(e, f"{{{DI_NS}}}waypoint",
                      x=str(int(src_pos["x"] + src_pos["w"] / 2)),
                      y=str(int(src_pos["y"] + src_pos["h"])))
        ET.SubElement(e, f"{{{DI_NS}}}waypoint",
                      x=str(int(tgt_pos["x"] + tgt_pos["w"] / 2)),
                      y=str(int(tgt_pos["y"])))

    return tree


def main():
    parser = argparse.ArgumentParser(
        description="Generate SVG layout for BPMN 2.0 files using Graphviz"
    )
    parser.add_argument("input", help="Input BPMN file")
    parser.add_argument("--svg", help="Output SVG file path", default=None)
    parser.add_argument("--bpmn", help="Output BPMN file with diagram layout", default=None)
    parser.add_argument("--dot", help="Output DOT file (for debugging)", default=None)
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    # Default output paths
    svg_path = args.svg or str(input_path.with_suffix('.svg'))
    bpmn_path = args.bpmn or str(input_path.with_name(input_path.stem + '.layout.bpmn'))

    print(f"Parsing BPMN: {input_path}")
    tree, root, participants, processes, message_flows = parse_bpmn(str(input_path))

    print(f"  Found {len(participants)} participants, "
          f"{sum(len(p['nodes']) for p in processes.values())} nodes, "
          f"{sum(len(p['edges']) for p in processes.values())} edges, "
          f"{len(message_flows)} message flows")

    print("Generating Graphviz DOT...")
    dot_str = generate_dot(participants, processes, message_flows)

    if args.dot:
        Path(args.dot).write_text(dot_str)
        print(f"  DOT written to: {args.dot}")

    print(f"Rendering SVG with Graphviz: {svg_path}")
    svg_content = render_svg(dot_str, svg_path)
    print(f"  SVG written to: {svg_path}")

    print("Extracting positions from SVG...")
    positions = extract_positions_from_svg(svg_content)
    print(f"  Extracted {len(positions)} positions")

    print(f"Injecting BPMNDI layout: {bpmn_path}")
    tree = inject_bpmndi(tree, root, participants, processes, message_flows, positions)
    tree.write(bpmn_path, encoding="unicode", xml_declaration=True)
    print(f"  BPMN with layout written to: {bpmn_path}")

    print("Done.")


if __name__ == "__main__":
    main()
