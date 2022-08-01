let url = window.location.href;

let environment = {
    prod: {
        urlBase: "http://localhost/ITTL/pwa/subirPruebaDos/",
        api: "https://reqres.in/api/users"
    },
    dev: {
        urlBase: "http://localhost/ITTL/pwa/subirPruebaDos/",
        api: "https://reqres.in/api/users"
    }
};

let urlBase = environment.dev.urlBase;
let api = environment.dev.api;

if (url.includes(environment.prod.urlBase)) {
    urlBase = environment.prod.urlBase;
    api = environment.prod.api;
}

//acepta service worker el navegador
if (navigator.serviceWorker) {
    navigator.serviceWorker.register(urlBase + 'serviceWorker.js');
    Notification.requestPermission().then(x => console.log);
}


let btnUbicacion = $("#btnUbicacion");
let waiting = $("#waiting");
let inputLongitud = $("#inputLongitud");
let inputLatitud = $("#inputLatitud");
let inputNombre = $("#inputNombre");
let inputApellido = $("#inputApellido");
let btnPhoto = $("#btnFoto");
let contenedorCamara = $('.camara-contenedor');
let btnTomarFoto = $('#tomar-foto-btn');
let btnEnviar = $('#enviar');
let divWifi = $('#divWifi');
let divSinWifi = $('#divSinWifi');
const camara = new Camara($('#player')[0]);
let fotoTomada = "";

btnUbicacion.on('click', () => {
    //alert("Hola mundo");
    waiting.removeClass("oculto");

    navigator.geolocation.getCurrentPosition(pos => {

        console.log(pos);


        lat = pos.coords.latitude;
        lng = pos.coords.longitude;

        inputLongitud.val(lat);
        inputLatitud.val(lng);

        waiting.addClass("oculto");
    });


});


btnPhoto.on('click', () => {

    console.log('Inicializar camara');
    contenedorCamara.removeClass('oculto');

    camara.encender();
    btnPhoto.addClass('oculto');

});


//Boton para tomar la foto

btnTomarFoto.on('click', () => {

    console.log('Botón tomar foto');

    fotoTomada = camara.tomarFoto();

    camara.apagar();

    btnPhoto.removeClass('oculto');
    contenedorCamara.addClass('oculto');
    $.mdtoast('foto tomada...', {
        interaction: true,
        actionText: 'Ok!'
    });

});


btnEnviar.on('click', () => {

    var data = {
        nombre: inputNombre.val(),
        apellido: inputApellido.val(),
        lat: inputLongitud.val(),
        lng: inputLatitud.val(),
        foto: fotoTomada
    };




    fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => console.log('app.js', res))
        .catch(err => console.log('app.js error:', err));

    $.mdtoast('Formulario enviado...', {
        interaction: true,
        actionText: 'Ok!'
    });
});




// Detectar cambios de conexión
function isOnline() {

    if (navigator.onLine) {
        // tenemos conexión
        // console.log('online');
        divWifi.removeClass('oculto');
        divSinWifi.addClass('oculto');

        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else {
        // No tenemos conexión

        divWifi.addClass('oculto');
        divSinWifi.removeClass('oculto');

        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);

isOnline();