"use strict";(()=>{var b="tokenpack-bench-v1";function h(e){return e==="random"||e==="half"?"random":"full"}function y(e,t){return e==="full"?t:{modules:E(t.modules),styles:E(t.styles),assets:E(t.assets)}}function E(e){let t=Math.max(1,Math.ceil(e.length*.5));return[...e].sort((n,o)=>p(n.path)-p(o.path)).slice(0,t).sort((n,o)=>n.path.localeCompare(o.path))}function p(e){let t=2166136261,n=`${b}:${e}`;for(let o=0;o<n.length;o+=1)t^=n.charCodeAt(o),t=Math.imul(t,16777619);return t>>>0}var u=JSON.parse(`{
  "version": 1,
  "generatedAt": "2026-11-11T04:13:06.204Z",
  "count": 40,
  "totalBytes": 2814245,
  "modules": [
    {
      "id": 1,
      "path": "mod-0001.js",
      "bytes": 13497
    },
    {
      "id": 2,
      "path": "mod-0002.js",
      "bytes": 13490
    },
    {
      "id": 3,
      "path": "mod-0003.js",
      "bytes": 13485
    },
    {
      "id": 4,
      "path": "mod-0004.js",
      "bytes": 13495
    },
    {
      "id": 5,
      "path": "mod-0005.js",
      "bytes": 13487
    },
    {
      "id": 6,
      "path": "mod-0006.js",
      "bytes": 13502
    },
    {
      "id": 7,
      "path": "mod-0007.js",
      "bytes": 13466
    },
    {
      "id": 8,
      "path": "mod-0008.js",
      "bytes": 13485
    },
    {
      "id": 9,
      "path": "mod-0009.js",
      "bytes": 13500
    },
    {
      "id": 10,
      "path": "mod-0010.js",
      "bytes": 13510
    },
    {
      "id": 11,
      "path": "mod-0011.js",
      "bytes": 13512
    },
    {
      "id": 12,
      "path": "mod-0012.js",
      "bytes": 13498
    },
    {
      "id": 13,
      "path": "mod-0013.js",
      "bytes": 13495
    },
    {
      "id": 14,
      "path": "mod-0014.js",
      "bytes": 13495
    },
    {
      "id": 15,
      "path": "mod-0015.js",
      "bytes": 13497
    },
    {
      "id": 16,
      "path": "mod-0016.js",
      "bytes": 13495
    },
    {
      "id": 17,
      "path": "mod-0017.js",
      "bytes": 13496
    },
    {
      "id": 18,
      "path": "mod-0018.js",
      "bytes": 13490
    },
    {
      "id": 19,
      "path": "mod-0019.js",
      "bytes": 13495
    },
    {
      "id": 20,
      "path": "mod-0020.js",
      "bytes": 13502
    },
    {
      "id": 21,
      "path": "mod-0021.js",
      "bytes": 13508
    },
    {
      "id": 22,
      "path": "mod-0022.js",
      "bytes": 13496
    },
    {
      "id": 23,
      "path": "mod-0023.js",
      "bytes": 13508
    },
    {
      "id": 24,
      "path": "mod-0024.js",
      "bytes": 13487
    },
    {
      "id": 25,
      "path": "mod-0025.js",
      "bytes": 13509
    },
    {
      "id": 26,
      "path": "mod-0026.js",
      "bytes": 13499
    },
    {
      "id": 27,
      "path": "mod-0027.js",
      "bytes": 13490
    },
    {
      "id": 28,
      "path": "mod-0028.js",
      "bytes": 13496
    },
    {
      "id": 29,
      "path": "mod-0029.js",
      "bytes": 13495
    },
    {
      "id": 30,
      "path": "mod-0030.js",
      "bytes": 13493
    },
    {
      "id": 31,
      "path": "mod-0031.js",
      "bytes": 13496
    },
    {
      "id": 32,
      "path": "mod-0032.js",
      "bytes": 13501
    },
    {
      "id": 33,
      "path": "mod-0033.js",
      "bytes": 13501
    },
    {
      "id": 34,
      "path": "mod-0034.js",
      "bytes": 13495
    },
    {
      "id": 35,
      "path": "mod-0035.js",
      "bytes": 13496
    },
    {
      "id": 36,
      "path": "mod-0036.js",
      "bytes": 13504
    },
    {
      "id": 37,
      "path": "mod-0037.js",
      "bytes": 13490
    },
    {
      "id": 38,
      "path": "mod-0038.js",
      "bytes": 13510
    },
    {
      "id": 39,
      "path": "mod-0039.js",
      "bytes": 13496
    },
    {
      "id": 40,
      "path": "mod-0040.js",
      "bytes": 13498
    }
  ],
  "styles": [
    {
      "kind": "css",
      "path": "style-0001.css",
      "bytes": 10284,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0002.css",
      "bytes": 10257,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0003.css",
      "bytes": 10247,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0004.css",
      "bytes": 10258,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0005.css",
      "bytes": 10264,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0006.css",
      "bytes": 10271,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0007.css",
      "bytes": 10259,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0008.css",
      "bytes": 10270,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0009.css",
      "bytes": 10283,
      "contentType": "text/css"
    },
    {
      "kind": "css",
      "path": "style-0010.css",
      "bytes": 10256,
      "contentType": "text/css"
    }
  ],
  "assets": [
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0001.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0002.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0003.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0004.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0005.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0006.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0007.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0008.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0009.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0010.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0011.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0012.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0013.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0014.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0015.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0016.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0017.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0018.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0019.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-small-0020.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-medium-0021.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-medium-0022.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-medium-0023.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-medium-0024.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    }
  ],
  "lazyModules": [
    {
      "id": 1,
      "path": "mod-lazy-0001.js",
      "bytes": 13410,
      "contentType": "application/javascript"
    },
    {
      "id": 2,
      "path": "mod-lazy-0002.js",
      "bytes": 13435,
      "contentType": "application/javascript"
    },
    {
      "id": 3,
      "path": "mod-lazy-0003.js",
      "bytes": 13421,
      "contentType": "application/javascript"
    },
    {
      "id": 4,
      "path": "mod-lazy-0004.js",
      "bytes": 13412,
      "contentType": "application/javascript"
    },
    {
      "id": 5,
      "path": "mod-lazy-0005.js",
      "bytes": 13411,
      "contentType": "application/javascript"
    },
    {
      "id": 6,
      "path": "mod-lazy-0006.js",
      "bytes": 13424,
      "contentType": "application/javascript"
    },
    {
      "id": 7,
      "path": "mod-lazy-0007.js",
      "bytes": 13411,
      "contentType": "application/javascript"
    },
    {
      "id": 8,
      "path": "mod-lazy-0008.js",
      "bytes": 13417,
      "contentType": "application/javascript"
    },
    {
      "id": 9,
      "path": "mod-lazy-three.js",
      "bytes": 480456,
      "contentType": "application/javascript"
    }
  ],
  "lazyStyles": [
    {
      "id": 1,
      "path": "style-lazy-0001.css",
      "bytes": 10302,
      "contentType": "text/css"
    },
    {
      "id": 2,
      "path": "style-lazy-0002.css",
      "bytes": 10314,
      "contentType": "text/css"
    },
    {
      "id": 3,
      "path": "style-lazy-0003.css",
      "bytes": 10309,
      "contentType": "text/css"
    },
    {
      "id": 4,
      "path": "style-lazy-0004.css",
      "bytes": 10312,
      "contentType": "text/css"
    }
  ],
  "lazyAssets": [
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0001.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0002.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0003.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0004.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0005.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0006.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0007.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "small",
      "path": "img-lazy-small-0008.png",
      "bytes": 14838,
      "width": 70,
      "height": 70,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-lazy-medium-0009.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    },
    {
      "kind": "image",
      "bucket": "medium",
      "path": "img-lazy-medium-0010.png",
      "bytes": 187873,
      "width": 250,
      "height": 250,
      "contentType": "image/png"
    }
  ]
}`),f=new URLSearchParams(location.search),m=f.get("origin")??"local",S=h(f.get("scope")),C=f.get("cdnBase"),A=C??("".startsWith("http"),""),i=m==="cdn"?A.replace(/\/$/,""):"/bench-app/small/assets";window.__BENCH_VARIANT={loader:"native-dynamic",origin:m,base:i};H();async function H(){let e=performance.now(),t={manifestMs:0},n=x(u);g(`eager: ${M(n)} \xB7 native-dynamic \xB7 ${O(S)}`);let o=I(),s=performance.now(),r=[];for(let a of n.modules)r.push(w(`${i}/${a.path}`));for(let a of n.styles)r.push(N(`${i}/${a.path}`));for(let a of n.assets)r.push(L(`${i}/${a.path}`,o));await Promise.all(r),t.loadMs=performance.now()-s;let d=performance.now();R(n.modules),t.renderMs=performance.now()-d;let l=performance.now()-e;window.__BENCH_BOOT_DONE=l,window.__BENCH_PHASES=t,document.title=`native-dynamic/${m} \xB7 boot ${Math.round(l)}ms`,g(`boot ${Math.round(l)} ms \xB7 load ${Math.round(t.loadMs)} ms (${M(n)}) \xB7 render ${Math.round(t.renderMs)} ms (${n.modules.length} modules)`),$(),window.dispatchEvent(new CustomEvent("bench:boot:done",{detail:{loader:"native-dynamic",origin:m,totalMs:l,phases:t}}))}function $(){let e=document.getElementById("open-dialog");e&&(e.disabled=!1,e.addEventListener("click",()=>{P()},{once:!0}))}async function P(){let e=performance.now(),t={},n=T();B("loading\u2026");let o=performance.now(),s=[],r=[];for(let c of u.lazyModules??[])r.push(w(`${i}/${c.path}`));for(let c of u.lazyStyles??[])r.push(N(`${i}/${c.path}`));for(let c of u.lazyAssets??[]){let _=v(`${i}/${c.path}`);s.push(_),r.push(_)}await Promise.all(r);let d=await Promise.all(s);t.loadMs=performance.now()-o;let l=performance.now();if(z(n),window.__BENCH_LAZY?.initScene){let c=n.querySelector(".scene");c&&window.__BENCH_LAZY.initScene(c,d)}t.renderMs=performance.now()-l;let a=performance.now()-e;window.__BENCH_LAZY_DONE=a,window.__BENCH_LAZY_PHASES=t,B(`done \xB7 ${Math.round(a)}ms (load ${Math.round(t.loadMs)} \xB7 render ${Math.round(t.renderMs)})`),window.dispatchEvent(new CustomEvent("bench:lazy:done",{detail:{loader:"native-dynamic",origin:m,totalMs:a,phases:t}}))}function w(e){return new Promise((t,n)=>{let o=document.createElement("script");o.src=e,o.async=!0,o.onload=()=>t(),o.onerror=()=>n(new Error(`script failed: ${e}`)),document.head.appendChild(o)})}function N(e){return new Promise((t,n)=>{let o=document.createElement("link");o.rel="stylesheet",o.href=e,o.onload=()=>t(),o.onerror=()=>n(new Error(`stylesheet failed: ${e}`)),document.head.appendChild(o)})}function L(e,t){return new Promise((n,o)=>{let s=new Image;s.src=e,s.decoding="async",s.loading="eager",t.appendChild(s),s.decode().then(()=>n()).catch(o)})}async function v(e){let t=await fetch(e,{cache:"no-store"});if(!t.ok)throw new Error(`image fetch failed: ${t.status} ${e}`);let n=await t.blob();return createImageBitmap(n)}function I(){let e=document.getElementById("images");return e||(e=document.createElement("div"),e.id="images",document.body.appendChild(e)),e}function T(){let e=document.getElementById("lazy-dialog");if(e)return e;let t=document.createElement("div");t.id="lazy-dialog";let n=document.createElement("div");n.className="bar";let o=document.createElement("strong");o.textContent="Lazy dialog",n.append(o,document.createTextNode(" \xB7 "));let s=document.createElement("span");s.id="lazy-status",s.textContent="opening",n.appendChild(s);let r=document.createElement("div");r.className="scene";let d=document.createElement("div");return d.className="tags",t.append(n,r,d),document.body.appendChild(t),t}function g(e){let t=document.getElementById("status");t&&(t.textContent=e)}function B(e){let t=document.getElementById("lazy-status");t&&(t.textContent=e)}function x(e){let t=e.modules,n=e.styles??[],o=e.assets??[];return y(S,{modules:t,styles:n,assets:o})}function M(e){return`${e.modules.length} JS + ${e.styles.length} CSS + ${e.assets.length} PNG`}function O(e){return e==="random"?"50% deterministic random request set":"full app request set"}function R(e){let t=document.getElementById("root");if(!t)throw new Error("#root missing");let n=window.__BENCH_MODULES??{},o=e.map(s=>s.id).filter(s=>s!==void 0);for(let s of o)n[s]?.render(t)}function z(e){let t=e.querySelector(".tags");if(!t)return;let n=window.__BENCH_LAZY_MODULES??{},o=Object.keys(n).map(Number).sort((s,r)=>s-r);for(let s of o)n[s]?.render(t)}})();
//# sourceMappingURL=entry-dynamic.js.map
