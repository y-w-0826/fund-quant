var CACHE = 'fundwb-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
'./echarts.min.js',
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/400.css',
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/500.css',
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/700.css',
  'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.18/400.css',
  'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.18/600.css'
];
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
    }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var url;
  try{ url = new URL(e.request.url); }catch(err){ return; }
  /* 行情/净值/排行等数据接口：永远走网络，保证数据实时真实 */
  if(/eastmoney|1234567|gtimg/.test(url.host)) return;
  if(e.request.method !== 'GET') return;
  /* 应用外壳与 CDN 静态资源：缓存优先 + 后台更新 */
  if(url.origin === location.origin || url.host === 'cdn.jsdelivr.net'){
    e.respondWith(
      caches.match(e.request).then(function(hit){
        var net = fetch(e.request).then(function(res){
          if(res && (res.status === 200 || res.type === 'opaque')){
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          }
          return res;
        }).catch(function(){ return hit; });
        return hit || net;
      })
    );
  }
});