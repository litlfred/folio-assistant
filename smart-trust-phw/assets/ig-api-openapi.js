(function(){var host=document.querySelector("[data-ig-api-openapi-src]");if(!host)return;var kg=window.__kgLoads=window.__kgLoads||{pending:0,done:function(){if(--this.pending===0)document.documentElement.setAttribute("data-kg-loaded","")}};kg.pending++;function el(tag,attrs,kids){var e=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k])});(kids||[]).forEach(function(k){e.append(k)});return e}var STYLE=`
/* IG API documentation styling that integrates with IG theme */
.ig-api-content {
  margin: 1rem 0;
}

`+`.api-info .card, .endpoint-card {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
}

`+`.endpoint-card h3 {
  color: #00477d;
  margin-top: 0;
}

`+`.badge-get { background-color: #28a745; }
.badge-post { background-color: #007bff; }
`+`.badge-put { background-color: #ffc107; color: #212529; }
.badge-delete { background-color: #dc3545; }
`+`.badge-patch { background-color: #6f42c1; }
`;fetch(host.getAttribute("data-ig-api-openapi-src")).then(function(r){if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()}).then(function(spec){var info=spec.info||{};var content=el("div",{class:"ig-api-content"},[el("div",{class:"api-info"},[el("h2",{},["API Information"]),el("div",{class:"card"},[el("div",{class:"card-body"},[el("h5",{class:"card-title"},[info.title||"API"]),el("p",{class:"card-text"},[info.description||"No description available"]),el("p",{},[el("strong",{},["Version:"])," "+(info.version||"Unknown")])])])])]);var paths=spec.paths||{};if(Object.keys(paths).length){var eps=el("div",{class:"api-endpoints"},[el("h2",{},["Endpoints"])]);Object.keys(paths).forEach(function(p){Object.keys(paths[p]).forEach(function(m){var op=paths[p][m]||{};eps.append(el("div",{class:"endpoint-card"},[el("h3",{},[el("span",{class:"badge badge-"+m.toLowerCase()},[m.toUpperCase()])," "+p]),el("h4",{},[op.summary||"No summary"]),el("p",{},[op.description||"No description available"])]))})});content.append(eps)}host.replaceChildren(content,el("style",{},[STYLE]),el("p",{},[el("em",{},["This documentation is automatically generated from the OpenAPI specification."])]))}).catch(function(e){host.textContent="Could not load "+host.getAttribute("data-ig-api-openapi-src")+": "+e.message}).finally(function(){kg.done()})})();
