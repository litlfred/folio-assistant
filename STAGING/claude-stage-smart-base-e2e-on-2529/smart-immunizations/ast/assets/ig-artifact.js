/*
 * ig-artifact.js: the one shared renderer for a THIN IG artefact page
 * (`gen-ig-pages.ts --thin`; owner, 2026-10-11, option A: "tiny html w/
 * dynamic load from json(ld) KG").
 *
 * The page holds identity and a pointer: its config block names the artefact's
 * JSON-LD node (`ig-artifact-jsonld.ts`). This fetches the node and draws what
 * the full page drew from the index: the description, the facts, the identity
 * table and the representations. Where the node names a copy this site serves
 * (`dcterms:source: local`), it fetches the resource and draws its elements,
 * concepts or includes, then hands the narrative and the JSON to the shared
 * AST loader (`ast-resource.js`), loaded once, never copied.
 *
 * Three states, always visible: loading, loaded, could-not-load naming the
 * file. Completion counts in and out of `window.__kgLoads`, as
 * `ast-resource.js` does, and the last to finish sets `<html data-kg-loaded>`.
 *
 * The IG's LIST pages use it too (`ig-index-page`; owner, 2026-10-12, "make
 * thin default"): `artifacts.html` and `toc.html` fetch the one index node
 * (`artifact/index.jsonld`) and draw every artefact under its category, every
 * category open, with a filter on the artifacts page. The IG's own
 * ImplementationGuide resource is drawn first, as "This guide"; a category
 * that mixes resource types is sub-headed by type; and a table draws only the
 * columns its rows fill — an instance's profile and code where the index
 * names them, a description where one exists (owner, 2026-10-12).
 *
 * No dependencies. Nothing from the node is written as HTML: every string is
 * `textContent`, and a link is kept only when its URL is http(s) or relative.
 */
(function () {
  "use strict";

  // Two page families share this renderer and its helpers: an artefact's own
  // page (`ig-artifact-page`) and the IG's list pages, `artifacts.html` and
  // `toc.html` (`ig-index-page`), which draw the one index node.
  var cfgEl = document.getElementById("ig-artifact-page") || document.getElementById("ig-index-page");
  var indexView = !!cfgEl && cfgEl.id === "ig-index-page";
  var cfg;
  try {
    cfg = JSON.parse(cfgEl.textContent);
  } catch (_e) {
    return;
  }
  var body = document.querySelector(".iga-body");
  var state = body && body.querySelector(".iga-state");

  function begin() {
    window.__kgLoads = (window.__kgLoads || 0) + 1;
  }
  function end() {
    window.__kgLoads -= 1;
    if (window.__kgLoads <= 0) document.documentElement.setAttribute("data-kg-loaded", "");
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }
  function safe(href) {
    return /^(https?:|\.{0,2}\/|[^:]*$)/i.test(href);
  }
  function link(href, text, external) {
    if (!href || !safe(href)) return el("span", null, text);
    var a = el("a", null, text);
    a.href = href;
    if (external) a.rel = "external";
    return a;
  }
  function h2(text) {
    return el("h2", null, text);
  }

  /*
   * An IRI in the node, as a URL this browser can fetch. A relative IRI is
   * the node's own file's neighbour. An absolute one is re-based onto where
   * the node was actually fetched from, through the path between the node's
   * @id and the IRI, so a node minted for one host renders on a staging
   * preview or a local server without fetching the published copy.
   */
  function fetchable(iri, nodeId, nodeUrl) {
    if (!/^[a-z][a-z0-9+.-]*:/i.test(iri)) return new URL(iri, nodeUrl).href;
    try {
      var id = new URL(nodeId);
      var to = new URL(iri);
      if (id.origin !== to.origin) return iri;
      var from = id.pathname.split("/").slice(0, -1);
      var parts = to.pathname.split("/");
      var i = 0;
      while (i < from.length && i < parts.length - 1 && from[i] === parts[i]) i++;
      var rel = new Array(from.length - i + 1).join("../") + parts.slice(i).join("/");
      return new URL(rel, nodeUrl).href;
    } catch (_e) {
      return iri;
    }
  }

  /* The description is the IG's markdown: paragraphs and [text](url) links, nothing else is interpreted. */
  function description(text, root) {
    if (root === undefined) root = "../";
    var frag = document.createDocumentFragment();
    text.split(/\n\s*\n/).forEach(function (para) {
      var p = el("p", "iga-desc");
      var re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
      var last = 0;
      var m;
      while ((m = re.exec(para))) {
        p.append(para.slice(last, m.index));
        var href = /^[a-z][a-z0-9+.-]*:/i.test(m[2]) || m[2].charAt(0) === "/" || m[2].charAt(0) === "#" ? m[2] : root + m[2];
        p.append(link(href, m[1]));
        last = re.lastIndex;
      }
      p.append(para.slice(last));
      frag.append(p);
    });
    return frag;
  }

  function stats(node) {
    var grid = el("div", "iga-grid");
    function stat(value, label) {
      var s = el("div", "iga-stat");
      s.append(el("b", null, value), el("span", null, label));
      grid.append(s);
    }
    stat(String(node["@type"] || "").replace(/^fhir:/, ""), "resource type");
    stat(node["schema:version"] || "—", "version");
    stat(node["dcterms:type"] || "—", "category");
    return grid;
  }

  function row(table, label, value) {
    var tr = el("tr");
    tr.append(el("th", null, label));
    var td = el("td");
    td.append(value);
    tr.append(td);
    table.append(tr);
  }

  function identity(node, nodeUrl) {
    var t = el("table", "iga-table iga-identity");
    var same = node["schema:sameAs"] && node["schema:sameAs"]["@id"];
    row(t, "Canonical URL", same ? el("code", null, same) : el("em", null, "none — examples and instances have no canonical URL"));
    var reps = el("span");
    (node["schema:encoding"] || []).forEach(function (e, i) {
      var url = e["schema:contentUrl"] && e["schema:contentUrl"]["@id"];
      var fmt = String(e["schema:encodingFormat"] || "").replace(/^application\/fhir\+/, "").replace(/^text\/turtle$/, "ttl");
      var local = e["dcterms:source"] === "local";
      if (i) reps.append(" · ");
      reps.append(link(local ? fetchable(url, node["@id"], nodeUrl) : url, local ? fmt : fmt + " (upstream)", !local));
    });
    reps.append(" · ", link(nodeUrl, "JSON-LD"));
    row(t, "Representations", reps);
    var mat = el("span");
    var held = node["schema:creativeWorkStatus"] === "materialized";
    mat.append(el("span", "iga-tag " + (held ? "iga-held" : "iga-ref"), node["schema:creativeWorkStatus"]));
    var gen = node["prov:wasGeneratedBy"];
    if (gen) {
      mat.append(" — compiled copy of ");
      mat.append(el("code", null, String(gen["prov:used"]).slice(0, 12)));
      mat.append(" by " + gen["schema:instrument"] + " — a cache, provisional until a full IG Publisher run");
    } else mat.append(held ? " — a copy, regenerable by re-running the ingest" : " — upstream, not held here");
    row(t, "Materialization", mat);
    return t;
  }

  function card(e) {
    if (e.min === undefined && e.max === undefined) return "";
    return (e.min === undefined ? "" : e.min) + ".." + (e.max === undefined ? "" : e.max);
  }
  function types(e) {
    return (e.type || [])
      .map(function (t) {
        var p = (t.targetProfile || t.profile || []).map(function (u) {
          return u.split("/").pop();
        });
        return t.code + (p.length ? "(" + p.join(" | ") + ")" : "");
      })
      .join(", ");
  }

  /* What the resource itself holds, as the Publisher's own tables show it. */
  function content(resource) {
    var frag = document.createDocumentFragment();
    var cols;
    var rows = [];
    var title;
    if (resource.resourceType === "StructureDefinition") {
      var list = (resource.differential && resource.differential.element) || (resource.snapshot && resource.snapshot.element) || [];
      title = (resource.differential ? "Elements (differential)" : "Elements (snapshot)") + " — " + list.length;
      cols = ["Path", "Card.", "Type", "Description"];
      rows = list.map(function (e) {
        return [e.path + (e.sliceName ? ":" + e.sliceName : ""), card(e), types(e), e.short || ""];
      });
    } else if (resource.resourceType === "CodeSystem" && resource.concept) {
      var flat = [];
      (function walk(cs, depth) {
        cs.forEach(function (c) {
          flat.push([new Array(depth + 1).join("· ") + c.code, c.display || "", c.definition || ""]);
          if (c.concept) walk(c.concept, depth + 1);
        });
      })(resource.concept, 0);
      title = "Concepts — " + flat.length;
      cols = ["Code", "Display", "Definition"];
      rows = flat;
    } else if (resource.resourceType === "ValueSet" && resource.compose) {
      title = "Logical definition";
      cols = ["", "System", "Codes / filters / value sets"];
      ["include", "exclude"].forEach(function (k) {
        (resource.compose[k] || []).forEach(function (inc) {
          var what = (inc.concept || [])
            .map(function (c) {
              return c.code;
            })
            .concat(
              (inc.filter || []).map(function (f) {
                return f.property + " " + f.op + " " + f.value;
              }),
              inc.valueSet || []
            )
            .join(", ");
          rows.push([k, inc.system || "", what || "all codes"]);
        });
      });
    } else if (resource.resourceType === "SearchParameter") {
      title = "Search parameter";
      cols = ["Code", "Type", "Base", "Expression"];
      rows = [[resource.code || "", resource.type || "", (resource.base || []).join(", "), resource.expression || ""]];
    }
    if (!cols) return null;
    frag.append(h2(title));
    var t = el("table", "iga-table iga-content");
    var tr = el("tr");
    cols.forEach(function (c) {
      tr.append(el("th", null, c));
    });
    var thead = el("thead");
    thead.append(tr);
    t.append(thead);
    var tb = el("tbody");
    rows.forEach(function (r) {
      var x = el("tr");
      r.forEach(function (v, i) {
        x.append(el("td", i === 0 ? "iga-code" : null, v));
      });
      tb.append(x);
    });
    t.append(tb);
    var wrap = el("div", "iga-scroll");
    wrap.append(t);
    frag.append(wrap);
    return frag;
  }

  function footer(foot) {
    if (!foot) return;
    var nav = el("p", "ig-footer-nav");
    if (cfg.prev) nav.append(link(cfg.prev, "<prev"), " | ");
    nav.append(link("#", "top"));
    if (cfg.next) nav.append(" | ", link(cfg.next, "next>"));
    foot.append(nav);
    if (!cfg.footer) return;
    begin();
    fetch(cfg.footer)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        var band = el("p", "ig-footer-band");
        if (d.publisher) band.append("IG © ", d.publisherUrl ? link(d.publisherUrl, d.publisher, true) : d.publisher, ". ");
        if (d.packageId) {
          band.append("Package ", el("code", null, d.packageId + (d.version ? "#" + d.version : "")));
          if (d.fhirVersion) band.append(" based on ", d.fhirUrl ? link(d.fhirUrl, "FHIR " + d.fhirVersion, true) : "FHIR " + d.fhirVersion);
          band.append(". ");
        }
        if (d.generated) band.append("Generated " + d.generated);
        foot.append(band);
        var links = el("p", "ig-footer-links", "Links: ");
        links.append(link(cfg.toc || cfg.home, "Table of Contents"));
        if (d.licenseUrl) links.append(" | ", link(d.licenseUrl, "License", true));
        foot.append(links);
      })
      .catch(function () {})
      .then(end, end);
  }

  /* ---- The IG's list pages: artifacts.html and toc.html, from the index node. ---- */

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  /* Categories in the index's own order (the Publisher's), the uncategorised last. */
  function groups(parts) {
    var out = [];
    var by = {};
    parts.forEach(function (p) {
      var name = p["dcterms:type"] || "Not categorised";
      if (!by[name]) out.push((by[name] = { name: name, anchor: "artifacts-" + slug(name), parts: [] }));
      by[name].parts.push(p);
    });
    out.forEach(function (g) {
      g.types = byType(g);
    });
    return out;
  }
  /*
   * A category's artefacts by resource type, in first-appearance order. A
   * category of one type is one group; one that mixes them (the Publisher's
   * "Other": pages, roles and tasks as Basic, questionnaires, documents…) is
   * sub-headed by type, so a reader sees what kinds of thing it holds.
   */
  function byType(g) {
    var out = [];
    var by = {};
    g.parts.forEach(function (p) {
      var t = typeOf(p);
      if (!by[t]) out.push((by[t] = { name: t, anchor: g.anchor + "-" + slug(t), parts: [] }));
      by[t].parts.push(p);
    });
    return out;
  }
  function typeOf(p) {
    return String(p["@type"] || "").replace(/^fhir:/, "");
  }
  /*
   * The IG's own ImplementationGuide resource is the guide, not one artefact
   * among its artefacts: the Publisher lists it under no category, and a list
   * that called it "Not categorised" put the guide last, under a label that
   * says nothing. It is drawn first, as "This guide". Which entry is the
   * guide: the ImplementationGuide whose id is the index's package id, or
   * else the only ImplementationGuide the index lists.
   */
  function guideOf(ix, parts) {
    var igs = parts.filter(function (p) {
      return p["@type"] === "fhir:ImplementationGuide";
    });
    var own = igs.filter(function (p) {
      return ix["dcterms:identifier"] && p["dcterms:identifier"] === "ImplementationGuide/" + ix["dcterms:identifier"];
    });
    return own.length === 1 ? own[0] : igs.length === 1 ? igs[0] : null;
  }
  /* An entry's page: its node's file name with .html, in the artefact pages' directory. */
  function pageOf(p) {
    var file = String(p["@id"]).split("/").pop().replace(/\.jsonld$/, ".html");
    return cfg.pages + file;
  }
  /* The first paragraph of a description, as a list row shows it. */
  function firstPara(text) {
    return String(text || "").split(/\n\s*\n/)[0];
  }
  /* A canonical without its |version. */
  function bare(url) {
    return String(url).split("|")[0];
  }
  /* The label of a profile: its canonical's last path segment, as the Publisher names it. */
  function profileLabel(url) {
    return bare(url).replace(/\/+$/, "").split("/").pop();
  }
  /* What a code concept states, term by term: the code, and its display or the concept's text. */
  function termText(t) {
    var code = t["schema:termCode"];
    var name = t["schema:name"];
    return code && name ? code + " (" + name + ")" : code || name || "";
  }

  /* The columns a table of these rows draws: a column no row fills is not drawn (owner, 2026-10-12). */
  function columnsFor(rows) {
    function any(k) {
      return rows.some(function (p) {
        return p[k] !== undefined;
      });
    }
    var types = {};
    rows.forEach(function (p) {
      types[typeOf(p)] = 1;
    });
    return {
      type: Object.keys(types).length > 1,
      profile: any("dcterms:conformsTo"),
      code: any("dcterms:subject"),
      description: any("dcterms:description"),
    };
  }

  function listTable(rows, byCanonical) {
    var cols = columnsFor(rows);
    var t = el("table", "iga-table igi-table");
    var head = el("thead");
    var hr = el("tr");
    hr.append(el("th", null, "Name"));
    if (cols.type) hr.append(el("th", null, "Type"));
    if (cols.profile) hr.append(el("th", null, "Profile"));
    if (cols.code) hr.append(el("th", null, "Code"));
    if (cols.description) hr.append(el("th", null, "Description"));
    head.append(hr);
    t.append(head);
    var tb = el("tbody");
    rows.forEach(function (p) {
      var tr = el("tr");
      var text = [p["dcterms:title"], p["dcterms:identifier"], p["dcterms:description"] || ""];
      var name = el("td");
      name.append(link(pageOf(p), p["dcterms:title"]));
      name.append(el("div", "igi-key", p["dcterms:identifier"]));
      tr.append(name);
      if (cols.type) {
        tr.append(el("td", "igi-type", typeOf(p)));
        text.push(typeOf(p));
      }
      if (cols.profile) {
        var pc = el("td", "igi-profile");
        (p["dcterms:conformsTo"] || []).forEach(function (ref, i) {
          var url = ref["@id"];
          var target = byCanonical[bare(url)];
          var label = profileLabel(url);
          var a = target ? link(pageOf(target), label) : el("span", null, label);
          a.title = url;
          if (i) pc.append(", ");
          pc.append(a);
          text.push(label);
        });
        tr.append(pc);
      }
      if (cols.code) {
        var cc = el("td", "igi-code");
        // A concept's text that only repeats a code is drawn once.
        var said = {};
        (p["dcterms:subject"] || []).forEach(function (term) {
          var t = termText(term);
          if (said[t]) return;
          said[t] = 1;
          var s = el("span", null, t);
          if (term["schema:inDefinedTermSet"]) s.title = term["schema:inDefinedTermSet"]["@id"];
          if (cc.childNodes.length) cc.append(" · ");
          cc.append(s);
          text.push(t);
        });
        tr.append(cc);
      }
      if (cols.description) {
        var desc = el("td");
        if (p["dcterms:description"]) desc.append(description(firstPara(p["dcterms:description"]), cfg.root || ""));
        tr.append(desc);
      }
      tr.setAttribute("data-text", text.join(" ").toLowerCase());
      tb.append(tr);
    });
    t.append(tb);
    var wrap = el("div", "iga-scroll");
    wrap.append(t);
    return wrap;
  }

  function drawGuide(guide) {
    var sec = el("section", "igi-guide");
    sec.id = "artifacts-this-guide";
    sec.append(h2("This guide"));
    var p = el("p");
    p.append(link(pageOf(guide), guide["dcterms:title"]), " ");
    p.append(el("span", "igi-key", guide["dcterms:identifier"]));
    sec.append(p);
    if (guide["dcterms:description"]) sec.append(description(firstPara(guide["dcterms:description"]), cfg.root || ""));
    return sec;
  }

  function drawArtifacts(gs, total, guide, byCanonical) {
    var frag = document.createDocumentFragment();
    if (guide) frag.append(drawGuide(guide));
    frag.append(el("p", "igi-count", total + " artefact(s) in " + gs.length + " categor" + (gs.length === 1 ? "y" : "ies") + (guide ? ", and the guide itself." : ".")));
    var jump = el("nav", "igi-jump");
    jump.setAttribute("aria-label", "Categories");
    if (guide) jump.append(link("#artifacts-this-guide", "This guide"));
    gs.forEach(function (g, i) {
      if (i || guide) jump.append(" · ");
      jump.append(link("#" + g.anchor, g.name));
      if (g.types.length < 2) {
        jump.append(" (" + g.parts.length + ")");
        return;
      }
      jump.append(" (" + g.parts.length + ": ");
      g.types.forEach(function (t, j) {
        if (j) jump.append(", ");
        jump.append(link("#" + t.anchor, t.name), " " + t.parts.length);
      });
      jump.append(")");
    });
    frag.append(jump);
    var filter = el("input", "igi-filter");
    filter.type = "search";
    filter.placeholder = "Filter artefacts by name, key, profile, code or description";
    filter.setAttribute("aria-label", "Filter artefacts");
    frag.append(filter);
    var sections = [];
    gs.forEach(function (g) {
      var sec = el("section", "igi-cat");
      sec.id = g.anchor;
      sec.append(h2(g.name + " — " + g.parts.length));
      if (g.types.length < 2) sec.append(listTable(g.parts, byCanonical));
      else
        g.types.forEach(function (t) {
          var sub = el("section", "igi-sub");
          sub.id = t.anchor;
          sub.append(el("h3", null, t.name + " — " + t.parts.length));
          sub.append(listTable(t.parts, byCanonical));
          sec.append(sub);
        });
      frag.append(sec);
      sections.push(sec);
    });
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      sections.forEach(function (sec) {
        var shown = 0;
        var subs = sec.querySelectorAll(".igi-sub");
        (subs.length ? Array.prototype.slice.call(subs) : [sec]).forEach(function (box) {
          var here = 0;
          box.querySelectorAll("tbody tr").forEach(function (tr) {
            var hit = !q || tr.getAttribute("data-text").indexOf(q) >= 0;
            tr.hidden = !hit;
            if (hit) here++;
          });
          if (box !== sec) box.hidden = here === 0;
          shown += here;
        });
        sec.hidden = shown === 0;
      });
    });
    return frag;
  }

  function drawToc(gs, total, guide) {
    var frag = document.createDocumentFragment();
    var top = el("ul", "igi-toc");
    if (guide) {
      var gli = el("li");
      gli.append(link(pageOf(guide), "This guide: " + guide["dcterms:title"]));
      top.append(gli);
    }
    var li = el("li");
    li.append(link(cfg.artifacts, "Artifacts Summary"), " — " + total + " artefact(s)");
    var cats = el("ul");
    function items(parts) {
      var ul = el("ul");
      parts.forEach(function (p) {
        var it = el("li");
        it.append(link(pageOf(p), p["dcterms:title"]));
        ul.append(it);
      });
      return ul;
    }
    gs.forEach(function (g) {
      var c = el("li");
      c.append(link(cfg.artifacts + "#" + g.anchor, g.name), " (" + g.parts.length + ")");
      if (g.types.length < 2) c.append(items(g.parts));
      else {
        var subs = el("ul");
        g.types.forEach(function (t) {
          var s = el("li");
          s.append(link(cfg.artifacts + "#" + t.anchor, t.name), " (" + t.parts.length + ")");
          s.append(items(t.parts));
          subs.append(s);
        });
        c.append(subs);
      }
      cats.append(c);
    });
    li.append(cats);
    top.append(li);
    frag.append(h2("Artefacts"));
    frag.append(top);
    return frag;
  }

  function drawIndex() {
    var url = new URL(cfg.index, location.href).href;
    begin();
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (ix) {
        var all = ix["schema:hasPart"] || [];
        var guide = guideOf(ix, all);
        var parts = all.filter(function (p) {
          return p !== guide;
        });
        // A profile a row names is linked when it is an artefact of this IG.
        var byCanonical = {};
        all.forEach(function (p) {
          if (p["schema:sameAs"]) byCanonical[bare(p["schema:sameAs"]["@id"])] = p;
        });
        var gs = groups(parts);
        var frag = cfg.view === "toc" ? drawToc(gs, parts.length, guide) : drawArtifacts(gs, parts.length, guide, byCanonical);
        if (state) state.remove();
        body.append(frag);
        body.setAttribute("data-state", "loaded");
        // A link to a category (#artifacts-<slug>) lands once the list exists.
        if (location.hash) {
          var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          if (target) target.scrollIntoView();
        }
      })
      .catch(function (err) {
        fail(cfg.index, err);
      })
      .then(end, end);
  }

  function fail(what, err) {
    if (!state) return;
    state.textContent = "Could not load " + what + ": " + (err && err.message ? err.message : String(err));
    state.className = "iga-state iga-error";
    body.setAttribute("data-state", "error");
  }

  footer(document.getElementById("ig-footer"));
  if (indexView) {
    drawIndex();
    return;
  }
  var nodeUrl = new URL(cfg.node, location.href).href;
  begin();
  fetch(nodeUrl)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (node) {
      var frag = document.createDocumentFragment();
      if (node["dcterms:title"] && node["dcterms:title"] !== document.querySelector(".iga h1").textContent) {
        frag.append(el("p", "iga-sub", node["dcterms:title"]));
      }
      if (node["dcterms:description"]) frag.append(description(node["dcterms:description"]));
      frag.append(stats(node));
      frag.append(h2("Identity and bytes are different questions"));
      frag.append(identity(node, nodeUrl));
      var local = (node["schema:encoding"] || []).filter(function (e) {
        return e["dcterms:source"] === "local";
      })[0];
      var holder;
      if (local) {
        var src = fetchable(local["schema:contentUrl"]["@id"], node["@id"], nodeUrl);
        holder = el("div", "iga-resource");
        frag.append(holder);
        frag.append(h2("Resource"));
        var ast = el("div", "ast-resource");
        ast.setAttribute("data-ast-src", src);
        if (cfg.pages) ast.setAttribute("data-ast-pages", cfg.pages);
        if (cfg.published) ast.setAttribute("data-ast-published", cfg.published);
        ast.append(el("p", "ast-state", "Loading the resource…"));
        frag.append(ast);
        begin();
        fetch(src)
          .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
          })
          .then(function (resource) {
            var c = content(resource);
            if (c) holder.append(c);
          })
          .catch(function () {})
          .then(end, end);
      }
      if (state) state.remove();
      body.append(frag);
      body.setAttribute("data-state", "loaded");
      if (local && cfg.astLoader) {
        // Counted until it has run, so <html data-kg-loaded> waits for the
        // loads it starts (it counts those itself, synchronously, as it runs).
        var s = document.createElement("script");
        s.src = cfg.astLoader;
        begin();
        s.onload = s.onerror = end;
        document.body.append(s);
      }
    })
    .catch(function (err) {
      fail(cfg.node, err);
    })
    .then(end, end);
})();
