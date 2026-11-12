/* staging-share: serve the live site's copy of a file this preview shares (cat-harness-tools scripts/staging-share.ts). */
var FRAGMENT="<div data-fa-staging-banner lang=\"en\" dir=\"ltr\" style=\"background:#4F6F52;color:#fff;padding:8px 16px;font-size:14px;text-align:center;position:fixed;top:0;left:0;right:0;box-sizing:border-box;z-index:2147483001;font-family:system-ui\">🔀 <b>FEATURE BRANCH</b> <span data-fa-staging-detail>— loading build details…</span></div><style>:root{--fa-staging-offset:0px}body{margin:0}.side-bar,.fa-nav{top:var(--fa-staging-offset,0px)!important}html{padding-top:var(--fa-staging-offset,0px)}</style><script>(function(){\nvar b=document.querySelector('[data-fa-staging-banner]'),d=document.querySelector('[data-fa-staging-detail]');\nif(b)document.documentElement.style.setProperty('--fa-staging-offset',b.getBoundingClientRect().height+'px');\nvar m=location.pathname.match(/^(.*\\/(?:branches|STAGING)\\/[^/]+\\/)/);\nif(!m){if(d)d.textContent='\\u2014 build details unavailable (not served from a preview path)';return;}\nvar s=document.createElement('script');s.src=m[1]+'staging-banner.js';\ns.onerror=function(){if(d)d.textContent='\\u2014 build details unavailable';};\n(document.head||document.documentElement).appendChild(s);\n})();</script>";
var SEARCH="published";
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
function bodyAt(h){var re=/<body[^>]*>/gi,m;while((m=re.exec(h))){var o=h.lastIndexOf('<!--',m.index),c=h.lastIndexOf('-->',m.index);if(o<0||c>o)return m.index+m[0].length;}return -1;}
function mark(h){
  h=h.replace(/<meta name="fa-staging" content="[^"]*">/g,'<meta name="fa-staging" content="preview">');
  h=h.replace(/<meta name="fa-search-index" content="[^"]*">/g,'<meta name="fa-search-index" content="'+SEARCH+'">');
  if(h.indexOf('data-fa-staging-banner')<0){var at=bodyAt(h);if(at>=0)h=h.slice(0,at)+FRAGMENT+h.slice(at);}
  return h;
}
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var u=new URL(req.url),scope=new URL(self.registration.scope);
  if(u.origin!==scope.origin||u.pathname.indexOf(scope.pathname)!==0)return;
  var live=scope.pathname.replace(/(?:branches|STAGING)\/[^/]+\/$/,'')+u.pathname.slice(scope.pathname.length);
  e.respondWith(fetch(req).then(function(r){
    if(r.status!==404)return r;
    return fetch(live+u.search,{credentials:'same-origin'}).then(function(m){
      if(!m.ok)return r;
      if((m.headers.get('content-type')||'').indexOf('text/html')<0)return m;
      return m.text().then(function(t){return new Response(mark(t),{status:200,headers:{'content-type':'text/html; charset=utf-8'}});});
    }).catch(function(){return r;});
  }));
});
