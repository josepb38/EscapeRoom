function estaNivelCompletado(numeroNivel) {
    return estadoAplicacion.nivelesCompletados.includes(numeroNivel);
}

function marcarNivelCompletado(numeroNivel) {
    if (!estaNivelCompletado(numeroNivel)) {
        estadoAplicacion.nivelesCompletados.push(numeroNivel);
    }
}

function estaNivelDisponible(numeroNivel) {
    if (numeroNivel === 1) {
        return true;
    }

    return estaNivelCompletado(numeroNivel) || estaNivelCompletado(numeroNivel - 1);
}

function formatearCoordenada(valor) {
    return Number(valor).toFixed(6);
}

let temporizadorNotificacionGaming = null;
let transicionNivelActiva = false;

function mostrarNivelCompletado(numeroNivel) {
    mostrarNotificacionGaming("LEVEL COMPLETE", `NIVEL ${numeroNivel} SUPERADO`, "exito");
}

function mostrarIntentoFallido(detalle) {
    mostrarNotificacionGaming("ACCESS DENIED", "INTENTA NUEVAMENTE", "error");
}

function ocultarNotificacionGaming() {
    const notificacion = document.getElementById("notificacionGaming");

    if (temporizadorNotificacionGaming) {
        clearTimeout(temporizadorNotificacionGaming);
        temporizadorNotificacionGaming = null;
    }

    if (!notificacion) {
        return;
    }

    notificacion.classList.remove("visible", "exito", "error");
    notificacion.setAttribute("aria-hidden", "true");
}

function mostrarNotificacionGaming(titulo, detalle, tipo) {
    const notificacion = document.getElementById("notificacionGaming");
    const tituloElemento = document.getElementById("notificacionTitulo");
    const detalleElemento = document.getElementById("notificacionDetalle");

    if (!notificacion || !tituloElemento || !detalleElemento) {
        return;
    }

    ocultarNotificacionGaming();
    tituloElemento.textContent = titulo;
    detalleElemento.textContent = detalle;
    notificacion.classList.add(tipo);
    notificacion.setAttribute("aria-hidden", "false");
    void notificacion.offsetWidth;
    notificacion.classList.add("visible");

    temporizadorNotificacionGaming = window.setTimeout(() => {
        ocultarNotificacionGaming();
    }, 2000);
}

function ejecutarTransicionNivel(numeroNivel, nombreNivel, accionNavegacion) {
    const transicion = document.getElementById("transicionNivel");
    const etiqueta = document.getElementById("transicionEtiqueta");
    const titulo = document.getElementById("transicionTitulo");
    const prefiereReducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiempoCierre = prefiereReducirMovimiento ? 250 : 1000;
    const tiempoLectura = 3000;
    const tiempoApertura = prefiereReducirMovimiento ? 250 : 1000;

    if (transicionNivelActiva || !transicion || !etiqueta || !titulo || typeof accionNavegacion !== "function") {
        return;
    }

    transicionNivelActiva = true;
    etiqueta.textContent = `CARGANDO NIVEL ${numeroNivel}`;
    titulo.textContent = nombreNivel;
    transicion.classList.remove("cerrando", "leyendo", "abriendo", "reducido");

    if (prefiereReducirMovimiento) {
        transicion.classList.add("reducido");
    }

    transicion.setAttribute("aria-hidden", "false");
    void transicion.offsetWidth;
    transicion.classList.add("cerrando");

    window.setTimeout(() => {
        accionNavegacion();
        transicion.classList.remove("cerrando");
        transicion.classList.add("leyendo");

        window.setTimeout(() => {
            const seccion = document.getElementById(`nivel-${numeroNivel}`);

            if (seccion) {
                seccion.scrollIntoView({
                    behavior: prefiereReducirMovimiento ? "auto" : "smooth",
                    block: "start"
                });
            }
        }, 80);

        window.setTimeout(() => {
            transicion.classList.remove("leyendo");
            transicion.classList.add("abriendo");

            window.setTimeout(() => {
                transicion.classList.remove("abriendo", "reducido");
                transicion.setAttribute("aria-hidden", "true");
                etiqueta.textContent = "CARGANDO NIVEL";
                titulo.textContent = "";
                transicionNivelActiva = false;
            }, tiempoApertura);
        }, tiempoLectura);
    }, tiempoCierre);
}
