const nivel2 = {
    elementos: {},
    mapaDibujado: false,
    posicionMarcada: false,

    iniciar() {
        this.elementos = {
            canvas: document.getElementById("canvas-nivel2"),
            latitud: document.getElementById("latitud-nivel2"),
            longitud: document.getElementById("longitud-nivel2"),
            botonDibujar: document.getElementById("btn-dibujar-mapa"),
            botonContinuar: document.getElementById("btn-continuar-nivel3"),
            mensaje: document.getElementById("mensaje-nivel2")
        };

        this.actualizarCoordenadasMostradas();
        this.elementos.botonDibujar.addEventListener("click", () => this.dibujarMapa());
        this.elementos.botonContinuar.addEventListener("click", () => {
            ejecutarTransicionNivel(3, "LA EVIDENCIA DEL EXPLORADOR", function () {
                app.irANivel(3);
            });
        });
    },

    dibujarMapa() {
        const latitud = estadoAplicacion.latitud;
        const longitud = estadoAplicacion.longitud;

        this.actualizarCoordenadasMostradas();
        this.mapaDibujado = false;
        this.posicionMarcada = false;

        if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
            this.mostrarMensaje("Primero debe completarse el Nivel 1 para obtener coordenadas válidas.", "danger");
            mostrarIntentoFallido("Coordenadas inválidas");
            this.elementos.botonContinuar.disabled = true;
            app.actualizarNavegacion();
            return;
        }

        const contexto = this.elementos.canvas.getContext("2d");

        if (!contexto) {
            this.mostrarMensaje("No fue posible preparar el lienzo del mapa.", "danger");
            mostrarIntentoFallido("Canvas no disponible");
            return;
        }

        contexto.clearRect(0, 0, this.elementos.canvas.width, this.elementos.canvas.height);
        this.dibujarMapaUrbano(contexto);
        this.mapaDibujado = true;
        this.marcarUbicacion(contexto, latitud, longitud);
        this.validarFinalizacion();
    },

    dibujarMapaUrbano(contexto) {
        const canvas = this.elementos.canvas;

        contexto.fillStyle = "#f8fbfd";
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        // Zonas urbanas.
        contexto.fillStyle = "#d9e7ef";
        contexto.strokeStyle = "#8fa8b6";
        contexto.lineWidth = 2;
        this.dibujarRectangulo(contexto, 70, 70, 145, 95);
        this.dibujarRectangulo(contexto, 260, 55, 170, 120);
        this.dibujarRectangulo(contexto, 500, 80, 180, 90);
        this.dibujarRectangulo(contexto, 95, 260, 160, 105);
        this.dibujarRectangulo(contexto, 360, 255, 130, 120);
        this.dibujarRectangulo(contexto, 560, 250, 145, 110);

        // Calles y rutas.
        contexto.strokeStyle = "#526d7a";
        contexto.lineWidth = 8;
        contexto.lineCap = "round";
        this.dibujarLinea(contexto, 40, 220, 760, 220);
        this.dibujarLinea(contexto, 230, 35, 230, 410);
        this.dibujarLinea(contexto, 40, 405, 735, 55);

        contexto.strokeStyle = "#ffffff";
        contexto.lineWidth = 2;
        this.dibujarLinea(contexto, 40, 220, 760, 220);
        this.dibujarLinea(contexto, 230, 35, 230, 410);
        this.dibujarLinea(contexto, 40, 405, 735, 55);

        // Puntos de referencia.
        contexto.fillStyle = "#2a9d8f";
        contexto.strokeStyle = "#14685f";
        contexto.lineWidth = 3;
        this.dibujarCirculo(contexto, 650, 205, 28);
        this.dibujarCirculo(contexto, 305, 330, 20);

        contexto.fillStyle = "#1e2a32";
        contexto.font = "16px Arial, sans-serif";
        contexto.fillText("Centro de control", 585, 195);
        contexto.fillText("Nodo de energía", 330, 336);
    },

    marcarUbicacion(contexto, latitud, longitud) {
        const canvas = this.elementos.canvas;
        const margen = 30;
        const posicionX = margen + ((longitud + 180) / 360) * (canvas.width - margen * 2);
        const posicionY = margen + ((90 - latitud) / 180) * (canvas.height - margen * 2);

        if (
            posicionX < margen ||
            posicionX > canvas.width - margen ||
            posicionY < margen ||
            posicionY > canvas.height - margen
        ) {
            this.mostrarMensaje("Las coordenadas están fuera del área válida del mapa.", "danger");
            mostrarIntentoFallido("Coordenadas fuera del mapa");
            return;
        }

        contexto.fillStyle = "#dc3545";
        contexto.strokeStyle = "#ffffff";
        contexto.lineWidth = 4;
        this.dibujarCirculo(contexto, posicionX, posicionY, 12);

        contexto.fillStyle = "#dc3545";
        contexto.font = "bold 16px Arial, sans-serif";
        contexto.fillText("Tu ubicación", Math.min(posicionX + 16, canvas.width - 120), Math.max(posicionY - 14, 24));

        this.posicionMarcada = true;
        this.actualizarCoordenadasMostradas();
    },

    validarFinalizacion() {
        if (!this.mapaDibujado || !this.posicionMarcada) {
            this.elementos.botonContinuar.disabled = true;
            return;
        }

        this.mostrarMensaje("Mapa reconstruido y ubicación marcada. El acceso al Nivel 3 ha sido desbloqueado.", "success");
        marcarNivelCompletado(2);
        mostrarNivelCompletado(2);
        this.elementos.botonContinuar.disabled = false;
        app.actualizarNavegacion();
    },

    actualizarCoordenadasMostradas() {
        const latitud = estadoAplicacion.latitud;
        const longitud = estadoAplicacion.longitud;

        this.elementos.latitud.textContent = Number.isFinite(latitud) ? formatearCoordenada(latitud) : "Pendiente";
        this.elementos.longitud.textContent = Number.isFinite(longitud) ? formatearCoordenada(longitud) : "Pendiente";
    },

    dibujarRectangulo(contexto, x, y, ancho, alto) {
        contexto.beginPath();
        contexto.rect(x, y, ancho, alto);
        contexto.fill();
        contexto.stroke();
    },

    dibujarLinea(contexto, inicioX, inicioY, finX, finY) {
        contexto.beginPath();
        contexto.moveTo(inicioX, inicioY);
        contexto.lineTo(finX, finY);
        contexto.stroke();
    },

    dibujarCirculo(contexto, x, y, radio) {
        contexto.beginPath();
        contexto.arc(x, y, radio, 0, Math.PI * 2);
        contexto.fill();
        contexto.stroke();
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};
