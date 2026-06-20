const nivel1 = {
    elementos: {},

    iniciar() {
        this.elementos = {
            estadoPermiso: document.getElementById("estado-permiso-nivel1"),
            botonUbicacion: document.getElementById("btn-obtener-ubicacion"),
            carga: document.getElementById("carga-nivel1"),
            mensaje: document.getElementById("mensaje-nivel1"),
            latitud: document.getElementById("latitud-nivel1"),
            longitud: document.getElementById("longitud-nivel1"),
            botonContinuar: document.getElementById("btn-continuar-nivel2")
        };

        if (!navigator.geolocation) {
            this.mostrarPermiso("No disponible", "text-bg-danger");
            this.mostrarMensaje("Tu navegador no soporta geolocalización.", "danger");
            this.elementos.botonUbicacion.disabled = true;
            return;
        }

        this.consultarPermiso();
        this.elementos.botonUbicacion.addEventListener("click", () => this.obtenerUbicacion());
        this.elementos.botonContinuar.addEventListener("click", () => {
            ejecutarTransicionNivel(2, "EL CARTÓGRAFO PERDIDO", function () {
                app.irANivel(2);
            });
        });
    },

    consultarPermiso() {
        if (!navigator.permissions || !navigator.permissions.query) {
            this.mostrarPermiso("Pendiente", "text-bg-warning");
            return;
        }

        navigator.permissions.query({ name: "geolocation" })
            .then((resultado) => {
                this.actualizarEstadoPermiso(resultado.state);
                resultado.addEventListener("change", () => this.actualizarEstadoPermiso(resultado.state));
            })
            .catch(() => {
                this.mostrarPermiso("prompt", "text-bg-warning");
            });
    },

    actualizarEstadoPermiso(estado) {
        const clases = {
            granted: "text-bg-success",
            prompt: "text-bg-warning",
            denied: "text-bg-danger"
        };
        const textos = {
            granted: "Concedido",
            prompt: "Pendiente",
            denied: "Denegado"
        };

        this.mostrarPermiso(textos[estado] || estado, clases[estado] || "text-bg-secondary");
    },

    mostrarPermiso(texto, clase) {
        this.elementos.estadoPermiso.textContent = texto;
        this.elementos.estadoPermiso.className = `badge ${clase}`;
    },

    obtenerUbicacion() {
        this.definirCarga(true);
        this.mostrarMensaje("Solicitando ubicación precisa...", "info");

        navigator.geolocation.getCurrentPosition(
            (posicion) => this.procesarUbicacion(posicion),
            (error) => this.procesarError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    },

    procesarUbicacion(posicion) {
        estadoAplicacion.latitud = posicion.coords.latitude;
        estadoAplicacion.longitud = posicion.coords.longitude;

        this.elementos.latitud.textContent = formatearCoordenada(estadoAplicacion.latitud);
        this.elementos.longitud.textContent = formatearCoordenada(estadoAplicacion.longitud);
        this.mostrarMensaje("Ubicación confirmada. La primera compuerta ha sido desbloqueada.", "success");

        marcarNivelCompletado(1);
        mostrarNivelCompletado(1);
        this.elementos.botonContinuar.disabled = false;
        this.definirCarga(false);
        app.actualizarNavegacion();
    },

    procesarError(error) {
        const mensajes = {
            1: "Permiso de ubicación denegado",
            2: "La ubicación no está disponible",
            3: "Se agotó el tiempo para obtener la ubicación"
        };

        const mensaje = mensajes[error.code] || "No fue posible obtener la ubicación.";
        this.mostrarMensaje(mensaje, "danger");
        mostrarIntentoFallido(mensaje);
        this.definirCarga(false);
    },

    definirCarga(estaCargando) {
        this.elementos.botonUbicacion.disabled = estaCargando;
        this.elementos.carga.classList.toggle("oculto", !estaCargando);
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};
