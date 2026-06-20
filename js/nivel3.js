const nivel3 = {
    elementos: {},
    flujoCamara: null,
    fotografiaCapturada: false,
    fotografiaGuardada: false,
    fotografiaMostrada: false,

    iniciar() {
        this.elementos = {
            video: document.getElementById("video-nivel3"),
            canvas: document.getElementById("canvas-nivel3"),
            foto: document.getElementById("foto-nivel3"),
            textoFotoPendiente: document.getElementById("texto-foto-pendiente"),
            botonActivar: document.getElementById("btn-activar-camara"),
            botonCapturar: document.getElementById("btn-capturar-foto"),
            botonContinuar: document.getElementById("btn-continuar-nivel4"),
            carga: document.getElementById("carga-nivel3"),
            mensaje: document.getElementById("mensaje-nivel3")
        };

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.mostrarMensaje("Tu navegador no permite acceder a la cámara.", "danger");
            mostrarIntentoFallido("Cámara no disponible");
            this.elementos.botonActivar.disabled = true;
            return;
        }

        this.elementos.botonActivar.addEventListener("click", () => this.activarCamara());
        this.elementos.botonCapturar.addEventListener("click", () => this.capturarFotografia());
        this.elementos.botonContinuar.addEventListener("click", () => {
            ejecutarTransicionNivel(4, "EL NÚCLEO DE PROCESAMIENTO", function () {
                app.irANivel(4);
            });
        });
    },

    activarCamara() {
        this.definirCarga(true);
        this.mostrarMensaje("Solicitando acceso a la cámara...", "info");
        this.elementos.botonCapturar.disabled = true;

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
            .then((flujo) => this.procesarCamaraActiva(flujo))
            .catch((error) => this.procesarErrorCamara(error));
    },

    procesarCamaraActiva(flujo) {
        this.detenerFlujoActual();

        if (estadoAplicacion.nivelActual !== 3) {
            flujo.getTracks().forEach(function (pista) {
                pista.stop();
            });
            this.definirCarga(false);
            this.elementos.botonCapturar.disabled = true;
            return;
        }

        this.flujoCamara = flujo;
        this.elementos.video.srcObject = flujo;

        this.elementos.video.onloadedmetadata = () => {
            this.elementos.video.play().catch(() => {
                this.mostrarMensaje("La cámara está activa, pero el video no pudo reproducirse automáticamente.", "danger");
            });
            this.elementos.botonCapturar.disabled = false;
            this.definirCarga(false);
            this.mostrarMensaje("Cámara activa. Captura la evidencia del explorador.", "success");
        };
    },

    procesarErrorCamara(error) {
        const mensajes = {
            NotAllowedError: "Permiso de cámara denegado",
            NotFoundError: "No se encontró una cámara disponible"
        };

        this.definirCarga(false);
        this.elementos.botonCapturar.disabled = true;
        const mensaje = mensajes[error.name] || "No fue posible activar la cámara.";
        this.mostrarMensaje(mensaje, "danger");
        mostrarIntentoFallido(mensaje);
    },

    capturarFotografia() {
        this.fotografiaCapturada = false;
        this.fotografiaGuardada = false;
        this.fotografiaMostrada = false;

        if (!this.flujoCamara || !this.flujoCamara.active) {
            this.mostrarMensaje("Primero debe activarse la cámara.", "danger");
            mostrarIntentoFallido("Cámara inactiva");
            this.actualizarBotonContinuar();
            return;
        }

        const video = this.elementos.video;

        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
            this.mostrarMensaje("La cámara aún no está lista para capturar.", "danger");
            mostrarIntentoFallido("Cámara no lista");
            this.actualizarBotonContinuar();
            return;
        }

        const dimensiones = this.calcularDimensionesCaptura(video.videoWidth, video.videoHeight);
        const canvas = this.elementos.canvas;
        const contexto = canvas.getContext("2d");

        if (!contexto) {
            this.mostrarMensaje("No fue posible preparar la captura.", "danger");
            mostrarIntentoFallido("Captura no disponible");
            return;
        }

        canvas.width = dimensiones.ancho;
        canvas.height = dimensiones.alto;
        contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.fotografiaCapturada = true;

        const fotografiaBase64 = canvas.toDataURL("image/jpeg", 0.8);

        try {
            localStorage.setItem("fotoExplorador", fotografiaBase64);
            this.fotografiaGuardada = true;
        } catch (error) {
            this.mostrarMensaje("No fue posible guardar la fotografía en localStorage.", "danger");
            mostrarIntentoFallido("No se pudo guardar la fotografía");
            this.actualizarBotonContinuar();
            return;
        }

        this.elementos.foto.src = fotografiaBase64;
        this.elementos.foto.classList.remove("oculto");
        this.elementos.textoFotoPendiente.classList.add("oculto");
        this.fotografiaMostrada = true;
        this.validarFinalizacion();
    },

    calcularDimensionesCaptura(anchoOriginal, altoOriginal) {
        const anchoMaximo = 640;
        const altoMaximo = 480;
        const escala = Math.min(anchoMaximo / anchoOriginal, altoMaximo / altoOriginal, 1);

        return {
            ancho: Math.round(anchoOriginal * escala),
            alto: Math.round(altoOriginal * escala)
        };
    },

    validarFinalizacion() {
        if (!this.fotografiaCapturada || !this.fotografiaGuardada || !this.fotografiaMostrada) {
            this.actualizarBotonContinuar();
            return;
        }

        this.mostrarMensaje("Fotografía capturada, guardada y mostrada. El Nivel 4 ha sido desbloqueado.", "success");
        marcarNivelCompletado(3);
        mostrarNivelCompletado(3);
        this.elementos.botonContinuar.disabled = false;
        app.actualizarNavegacion();
    },

    actualizarBotonContinuar() {
        this.elementos.botonContinuar.disabled = !estaNivelCompletado(3);
    },

    detenerFlujoActual() {
        if (!this.flujoCamara) {
            return;
        }

        this.flujoCamara.getTracks().forEach(function (pista) {
            pista.stop();
        });
        this.flujoCamara = null;
    },

    detenerCamaraNivel3() {
        this.detenerFlujoActual();

        if (this.elementos.video) {
            this.elementos.video.pause();
            this.elementos.video.srcObject = null;
            this.elementos.video.onloadedmetadata = null;
        }

        if (this.elementos.botonCapturar) {
            this.elementos.botonCapturar.disabled = true;
        }

        if (this.elementos.carga) {
            this.elementos.carga.classList.add("oculto");
        }

        if (this.elementos.botonActivar && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.elementos.botonActivar.disabled = false;
        }

        if (this.elementos.mensaje) {
            this.mostrarMensaje("Cámara apagada. Actívala nuevamente para capturar otra fotografía.", "info");
        }

        this.actualizarBotonContinuar();
    },

    definirCarga(estaCargando) {
        this.elementos.botonActivar.disabled = estaCargando;
        this.elementos.carga.classList.toggle("oculto", !estaCargando);
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};

function detenerCamaraNivel3() {
    nivel3.detenerCamaraNivel3();
}

window.addEventListener("beforeunload", detenerCamaraNivel3);
