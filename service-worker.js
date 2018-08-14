let version = 16;
let cachePrincipal = "neander-v"+version
let cacheWhitelist = [cachePrincipal]

let arquivosCache = [
    './',
    'css/bootstrap.min.css',
    'css/neander.css',
    'js/bootstrap.min.js',
    'js/jquery-3.2.1.min.js',
    'js/neander-js.js',
    'manifest.json'
];
this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cachePrincipal).then(function (cache) {
            //crio o cache com as versões mais atuais
            return Promise.all([
                cache.addAll(arquivosCache),
                self.skipWaiting()
            ]);
        })
    );
})

this.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
          return Promise.all(keyList.map(function(key) {
            if (cacheWhitelist.indexOf(key) === -1) {
              return caches.delete(key);
            }
          }));
        })
    );
});

this.addEventListener('fetch', function (event) {
    console.log(event.request)
    event.respondWith(caches.match(event.request)
        .then((resp) => {
            return resp || fetch(event.request);
        }))
})