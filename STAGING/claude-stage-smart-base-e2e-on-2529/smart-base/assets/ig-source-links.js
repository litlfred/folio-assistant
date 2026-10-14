(() => {
  if (window.faEditLinks) return;
  function faBlockUrls(c, b) {
  var enc = encodeURIComponent;
  var path = b.source.split("/").map(enc).join("/");
  var branch = c.branch || "main";
  var repo = b.repo || c.repo;
  var src = "https://github.com/" + repo + "/blob/" + branch + "/" + path + (b.line ? "#L" + b.line : "");
  var url = c.siteUrl && b.page ? c.siteUrl.replace(/\/$/, "") + "/" + b.page + "#" + enc(b.label) : (b.pageUrl || "");
  var values = { block: b.label, section: b.section || "", source: b.source, page: b.page || "", url: url, content: c.content || "" };
  var q = new URLSearchParams();
  q.set("title", "Feedback" + (c.content ? " [" + c.content + "]" : "") + ": " + (b.section ? b.section + " — " : "") + b.label);
  if (c.labels && c.labels.length) q.set("labels", c.labels.join(","));
  if (c.template) {
    q.set("template", c.template);
    (c.templateFields || []).forEach(function (f) { if (values[f]) q.set(f, values[f]); });
  } else {
    var facts = c.content ? ["**Content:** \u0060" + c.content + "\u0060"] : [];
    facts.push("**Block:** \u0060" + b.label + "\u0060");
    if (b.section) facts.push("**Section:** " + b.section);
    facts.push("**Source:** " + src);
    if (url) facts.push("**On the site:** " + url);
    q.set("body", facts.concat(["", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""]).join("\n"));
  }
  return { edit: "https://github.com/" + repo + "/edit/" + branch + "/" + path, source: src, feedback: "https://github.com/" + c.repo + "/issues/new?" + q };
}
  let cfg = null;
  const config = () => {
    if (cfg) return cfg;
    const el = document.getElementById("fa-edit-cfg");
    if (el) cfg = JSON.parse(el.textContent);
    else {
      const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : undefined; };
      cfg = { repo: meta("fa-repo"), branch: meta("fa-branch") || "main" };
    }
    return cfg;
  };
  // A link that names a GitHub file but carries no facts (a generator wrote
  // its href from data, e.g. sourceLinks) gives them up from its own URL.
  const GH = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|edit)\/([^/]+)\/([^#?]+)(?:#L(\d+))?$/;
  const adopt = (a) => {
    const m = GH.exec(a.getAttribute("href") || "");
    if (!m) return false;
    a.dataset.repo = m[1]; a.dataset.branch = m[2];
    a.dataset.src = m[3].split("/").map(decodeURIComponent).join("/");
    if (m[4]) a.dataset.line = m[4];
    return true;
  };
  const ready = (host) => {
    if (host.dataset.ready) return;
    if (!host.dataset.src && !(host.matches("a[data-fa-link]") && adopt(host))) return;
    const c0 = config();
    const c = host.dataset.branch ? Object.assign({}, c0, { branch: host.dataset.branch }) : c0;
    if (!c.repo && !host.dataset.repo) return;
    host.dataset.ready = "1";
    const label = host.dataset.block || host.dataset.src;
    const u = faBlockUrls(c, { label: label, source: host.dataset.src, section: host.dataset.sec,
      line: host.dataset.line ? Number(host.dataset.line) : undefined, repo: host.dataset.repo, page: host.dataset.page || c.page,
      pageUrl: location.href.split("#")[0] + "#" + encodeURIComponent(label) });
    const links = host.matches("a[data-fa-link]") ? [host] : host.querySelectorAll("a[data-fa-link]");
    // Only this host's own links: a nested host (a Lean link inside a block's row) fills itself.
    for (const a of links) if ((a === host || a.closest("[data-src]") === host) && u[a.dataset.faLink]) a.href = u[a.dataset.faLink];
  };
  const fill = (root) => { for (const h of (root || document).querySelectorAll("[data-src], a[data-fa-link]")) ready(h); };
  // A page that learns its repository later (the folio site reads it from its outline) says so here.
  const configure = (c) => { cfg = c; };
  window.faEditLinks = { urls: faBlockUrls, fill: fill, configure: configure };
  // Both the link reached and the host it sits in: a pointer that lands
  // straight on a compact host's link (no gap crossed) or keyboard focus on it
  // matches the bare link first, which carries no facts of its own.
  for (const ev of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(ev, (e) => {
      if (!e.target.closest) return;
      const a = e.target.closest("a[data-fa-link]"), h = e.target.closest("[data-src]");
      if (a) ready(a);
      if (h && h !== a) ready(h);
    }, { passive: true });
})();
(function(){var d=document.getElementById("ig-source-lines");if(!d)return;var m;try{m=JSON.parse(d.textContent)}catch(e){return}
var repo=(m.blob.match(/^https:\/\/github\.com\/[^/]+\/[^/]+/)||[])[0];
var n=function(s){return s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()};var used={};
var link=function(h,cls,href,title,glyph){var a=document.createElement("a");a.className=cls;a.href=href;a.title=title;a.textContent=glyph;a.rel="noopener";a.target="_blank";h.appendChild(document.createTextNode(" "));h.appendChild(a)};
document.querySelectorAll("#main-content h1,#main-content h2,#main-content h3,#main-content h4,#main-content h5,#main-content h6").forEach(function(h){
var text=h.textContent.trim(),k=n(text),line,file;for(var i=0;i<m.lines.length;i++){if(!used[i]&&n(m.lines[i].t)===k){used[i]=1;line=m.lines[i].l;file=m.lines[i].b;break}}
var src=line?(file||m.blob)+"#L"+line:m.blob;
if(line)link(h,"ig-src",src,"This section's source, line "+line+", on GitHub","\u270E");
if(repo){var here=location.href.split("#")[0]+(h.id?"#"+h.id:"");
var pt=document.title.split(" | ")[0].trim();
var body="**Page:** "+here+"\n**Section:** "+text+(h.id?" (#"+h.id+")":"")+"\n**Source:** "+src+"\n\n**Feedback:**\n\n";
link(h,"ig-feedback",repo+"/issues/new?title="+encodeURIComponent("Feedback on \u201C"+text+"\u201D"+(pt&&n(pt)!==k?" (page: "+pt+")":""))+"&body="+encodeURIComponent(body),"Give feedback on this section (opens a GitHub issue)","\uD83D\uDCE3")}})})();
