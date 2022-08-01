importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js');


const APP_SHELL_CACHE = 'ap_shell-v1';
const DINAMICO_CACHE = 'dinamico-v1';
const EXTERNOS_ESTATICO_CACHE = 'externos-v1';
const api = "https://reqres.in/api/users";

/*const APP_SHELL = [
    '/',
    'index.html',
    'css/estilo.css',
    'img/favicon.ico',
    'js/index.js',
    'img/wifi.png',
    'img/sinwifi.png',
    'js/camara-class.js',
    'js/libs/plugins/mdtoast.min.css',
    'img/icons/icon-192x192.png',
    'img/icons/icon-256x256.png',
    'img/icons/icon-384x384.png',
    'img/icons/icon-512x512.png',
    'manifest.json'
];*/
const APP_SHELL = [
    'index.html',
    'css/estilo.css',
    'img/favicon.ico',
    'js/index.js',
    'img/wifi.png',
    'img/sinwifi.png',
    'js/camara-class.js',
    'js/libs/plugins/mdtoast.min.css',
    'img/icons/icon-192x192.png',
    'img/icons/icon-256x256.png',
    'img/icons/icon-384x384.png',
    'img/icons/icon-512x512.png',
    'manifest.json'
];

const APP_SHELL_URL_EXTERNOS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const appShellCache = caches.open(APP_SHELL_CACHE).then(cache =>
        cache.addAll(APP_SHELL));

    const externosEstaticosCache = caches.open(EXTERNOS_ESTATICO_CACHE).then(cache =>
        cache.addAll(APP_SHELL_URL_EXTERNOS));



    e.waitUntil(Promise.all([appShellCache, externosEstaticosCache]));

});




self.addEventListener('fetch', e => {

    let respuesta;

    console.log("url del fetch: ", e.request.url);
    console.log("Valor de api en fetch: ", api);
    console.log("Valor de include sobre api: ", e.request.url.includes(api));
    if (e.request.url.includes(api)) {

        // return respuesta????
        console.log("Entre en el if de la api");
        respuesta = manejoApiMensajes(DINAMICO_CACHE, e.request);

    } else {

        respuesta = caches.match(e.request).then(res => {

            if (res) {

                actualizaCacheStatico(APP_SHELL_CACHE, e.request, APP_SHELL_URL_EXTERNOS);
                return res;

            } else {

                return fetch(e.request).then(newRes => {

                    return actualizaCacheDinamico(DINAMICO_CACHE, e.request, newRes);

                });

            }

        });
    }


    e.respondWith(respuesta);

});


// tareas asíncronas
self.addEventListener('sync', e => {

    console.log('SW: Sync');

    if (e.tag === 'nuevo-post') {

        // postear a BD cuando hay conexión
        const respuesta = postearMensajes();

        const title = "Hola mundo";
        const options = {
            body: "Prueba",
            // icon: 'img/icons/icon-72x72.png',
            // icon: `img/avatars/${ data.usuario }.jpg`,
            badge: 'img/favicon.ico',
            // image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es',
            vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125, 275, 200, 600, 200, 600],
            openUrl: '/'

        };


        e.waitUntil(Promise.all([respuesta, self.registration.showNotification(title, options)]));
    }

});













//functiones service worker

// Cache with network update
function actualizaCacheStatico(appShell, req, urlExternos) {


    if (urlExternos.includes(req.url)) {


    } else {
        // agregamos al appshel otros caches dinamicos
        return fetch(req)
            .then(res => {
                return actualizaCacheDinamico(appShell, req, res);
            });
    }


}



// Guardar  en el cache dinamico
function actualizaCacheDinamico(dynamicCache, req, res) {


    if (res.ok) {

        return caches.open(dynamicCache).then(cache => {

            cache.put(req, res.clone());

            return res.clone();

        });

    } else {
        return res;
    }

}



function manejoApiMensajes(cacheName, req) {


    if (req.clone().method === 'POST') {
        // POSTEO de un nuevo mensaje

        if (self.registration.sync) {
            console.log("entre en registration");
            return req.clone().text().then(body => {

                // console.log(body);
                const bodyObj = JSON.parse(body);
                return guardarMensaje(bodyObj);

            });
        } else {
            return fetch(req);
        }


    } else {

        return fetch(req).then(res => {

            if (res.ok) {
                actualizaCacheDinamico(cacheName, req, res.clone());
                return res.clone();
            } else {
                return caches.match(req);
            }

        }).catch(err => {
            return caches.match(req);
        });

    }


}



// Utilidades para grabar PouchDB
const db = new PouchDB('mensajes');


function guardarMensaje(mensaje) {

    mensaje._id = new Date().toISOString();

    return db.put(mensaje).then((x) => {

        console.log("nuevoMensaje:", x);

        self.registration.sync.register('nuevo-post');

        const newResp = { ok: true, offline: true };

        return new Response(JSON.stringify(newResp));

    });

}


// Postear mensajes a la API
function postearMensajes() {

    const posteos = [];

    console.log("Entre em postear mensajes");

    return db.allDocs({ include_docs: true }).then(docs => {


        docs.rows.forEach(row => {

            console.log("Fila a postear: ", row);
            const doc = row.doc;

            const fetchPom = fetch('api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(doc)
            }).then(res => {

                return db.remove(doc);

            });

            posteos.push(fetchPom);


        }); // fin del foreach

        return Promise.all(posteos);

    });


}