const nivel5 = {
    elementos: {},
    worker: null,
    totalRegistros: 250000,
    resultados: null,
    confeti: [],
    animacionConfeti: null,
    temporizadorConfeti: null,

    iniciar() {
        this.elementos = {
            botonProcesar: document.getElementById("btn-procesar-nivel5"),
            cantidadRegistros: document.getElementById("cantidad-registros-nivel5"),
            progresoContenedor: document.querySelector("#nivel-5 .progress"),
            barraProgreso: document.getElementById("barra-progreso-nivel5"),
            botonProbarInterfaz: document.getElementById("btn-probar-interfaz-nivel5"),
            contadorInterfaz: document.getElementById("contador-interfaz-nivel5"),
            mensaje: document.getElementById("mensaje-nivel5"),
            mensajeFinal: document.getElementById("mensaje-final-nivel5"),
            cardResultados: document.getElementById("card-resultados-nivel5"),
            total: document.getElementById("resultado-total-nivel5"),
            validos: document.getElementById("resultado-validos-nivel5"),
            invalidos: document.getElementById("resultado-invalidos-nivel5"),
            promedio: document.getElementById("resultado-promedio-nivel5"),
            topTemperaturas: document.getElementById("top-temperaturas-nivel5"),
            topPresiones: document.getElementById("top-presiones-nivel5"),
            botonDescargar: document.getElementById("btn-descargar-json-nivel5"),
            escenaEncabezado: document.getElementById("escena-encabezado"),
            canvasConfeti: document.getElementById("canvas-confeti-nivel5")
        };

        this.elementos.botonProcesar.addEventListener("click", () => this.iniciarProcesamiento());
        this.elementos.botonProbarInterfaz.addEventListener("click", () => this.probarInterfaz());
        this.elementos.botonDescargar.addEventListener("click", () => this.descargarResultados());
        this.mostrarCiudadBloqueada();
    },

    iniciarProcesamiento() {
        if (!window.Worker) {
            this.mostrarMensaje("Tu navegador no soporta Web Workers.", "danger");
            mostrarIntentoFallido("Web Worker no disponible");
            return;
        }

        this.terminarWorkerActual();
        this.reiniciarInterfazProcesamiento();

        const datos = this.generarDatos();
        this.elementos.cantidadRegistros.textContent = `Registros generados: ${this.totalRegistros}`;

        this.worker = new Worker("js/workerNivel5.js");
        this.worker.addEventListener("message", (evento) => this.procesarMensajeWorker(evento.data));
        this.worker.addEventListener("error", () => this.procesarErrorWorker());
        this.worker.postMessage(
            {
                buffer: datos.buffer,
                totalRegistros: this.totalRegistros
            },
            [datos.buffer]
        );
    },

    generarDatos() {
        const datos = new Float32Array(this.totalRegistros * 3);

        for (let indice = 0; indice < this.totalRegistros; indice++) {
            const posicion = indice * 3;
            datos[posicion] = this.generarMedicion(8, 45);
            datos[posicion + 1] = this.generarMedicion(20, 98);
            datos[posicion + 2] = this.generarMedicion(930, 1080);
        }

        return datos;
    },

    generarMedicion(minimo, maximo) {
        const valor = Math.random() * (maximo - minimo) + minimo;
        const debeSerNegativo = Math.random() < 0.04;

        return Number((debeSerNegativo ? -valor : valor).toFixed(2));
    },

    procesarMensajeWorker(mensaje) {
        if (mensaje.tipo === "progreso") {
            this.actualizarProgreso(mensaje.porcentaje);
            return;
        }

        if (mensaje.tipo === "resultado") {
            this.finalizarProcesamiento(mensaje.resultados);
        }
    },

    finalizarProcesamiento(resultados) {
        this.actualizarProgreso(100);
        this.elementos.botonProcesar.disabled = false;
        this.terminarWorkerActual();

        if (!this.sonResultadosValidos(resultados)) {
            this.mostrarMensaje("El Worker devolvió resultados incompletos.", "danger");
            mostrarIntentoFallido("Resultados incompletos");
            return;
        }

        this.resultados = resultados;
        this.mostrarResultados(resultados);
        this.elementos.botonDescargar.disabled = false;
        this.elementos.mensajeFinal.classList.remove("oculto");
        this.mostrarMensaje("Procesamiento completo. Resultados listos para descargar.", "success");
        marcarNivelCompletado(5);
        mostrarNivelCompletado(5);
        app.actualizarNavegacion();
        this.mostrarCiudadRestaurada();
    },

    sonResultadosValidos(resultados) {
        return Boolean(
            resultados &&
            resultados.totalRegistrosGenerados === this.totalRegistros &&
            Number.isFinite(resultados.registrosValidos) &&
            Number.isFinite(resultados.registrosInvalidos) &&
            Number.isFinite(resultados.promedioGeneral) &&
            Array.isArray(resultados.top10Temperaturas) &&
            Array.isArray(resultados.top10Presiones) &&
            resultados.top10Temperaturas.length <= 10 &&
            resultados.top10Presiones.length <= 10 &&
            resultados.top10Temperaturas.every((valor) => Number.isFinite(valor) && valor >= 0) &&
            resultados.top10Presiones.every((valor) => Number.isFinite(valor) && valor >= 0)
        );
    },

    mostrarResultados(resultados) {
        this.elementos.total.textContent = String(resultados.totalRegistrosGenerados);
        this.elementos.validos.textContent = String(resultados.registrosValidos);
        this.elementos.invalidos.textContent = String(resultados.registrosInvalidos);
        this.elementos.promedio.textContent = resultados.promedioGeneral.toFixed(2);
        this.mostrarLista(this.elementos.topTemperaturas, resultados.top10Temperaturas);
        this.mostrarLista(this.elementos.topPresiones, resultados.top10Presiones);
        this.elementos.cardResultados.classList.remove("oculto");
    },

    mostrarLista(lista, valores) {
        lista.innerHTML = "";

        valores.forEach((valor) => {
            const item = document.createElement("li");
            item.textContent = valor.toFixed(2);
            lista.appendChild(item);
        });
    },

    descargarResultados() {
        if (!this.sonResultadosValidos(this.resultados)) {
            this.mostrarMensaje("No hay resultados válidos para descargar.", "danger");
            mostrarIntentoFallido("Resultados no disponibles");
            return;
        }

        const contenido = JSON.stringify(this.resultados, null, 2);
        const blob = new Blob([contenido], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = "resultados-portal-cuantico.json";
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    },

    procesarErrorWorker() {
        this.terminarWorkerActual();
        this.elementos.botonProcesar.disabled = false;
        this.elementos.botonDescargar.disabled = true;
        this.mostrarCiudadBloqueada();
        this.mostrarMensaje("Ocurrió un error durante el procesamiento del Worker.", "danger");
        mostrarIntentoFallido("Error del Worker");
    },

    reiniciarInterfazProcesamiento() {
        this.resultados = null;
        this.elementos.botonProcesar.disabled = true;
        this.elementos.botonDescargar.disabled = true;
        this.elementos.cardResultados.classList.add("oculto");
        this.elementos.mensajeFinal.classList.add("oculto");
        this.detenerConfeti();
        this.limpiarResultados();
        this.actualizarProgreso(0);
        this.mostrarCiudadRestaurando();
        this.mostrarMensaje("Generando 250,000 registros y transfiriendo el buffer al Worker...", "info");
    },

    limpiarResultados() {
        this.elementos.total.textContent = "-";
        this.elementos.validos.textContent = "-";
        this.elementos.invalidos.textContent = "-";
        this.elementos.promedio.textContent = "-";
        this.elementos.topTemperaturas.innerHTML = "";
        this.elementos.topPresiones.innerHTML = "";
    },

    actualizarProgreso(porcentaje) {
        const porcentajeSeguro = Math.max(0, Math.min(100, Math.round(porcentaje)));

        this.elementos.barraProgreso.style.width = `${porcentajeSeguro}%`;
        this.elementos.barraProgreso.textContent = `${porcentajeSeguro}%`;
        this.elementos.progresoContenedor.setAttribute("aria-valuenow", String(porcentajeSeguro));
    },

    probarInterfaz() {
        const valorActual = Number(this.elementos.contadorInterfaz.textContent);
        this.elementos.contadorInterfaz.textContent = String(valorActual + 1);
    },

    terminarWorkerActual() {
        if (!this.worker) {
            return;
        }

        this.worker.terminate();
        this.worker = null;
    },

    mostrarCelebracionFinal() {
        this.mostrarCiudadRestaurada();
    },

    mostrarEscenaRestauracion() {
        this.mostrarCiudadRestaurada();
    },

    iniciarAnimacionCandado() {
        this.reiniciarClasesEscena();
        this.elementos.escenaEncabezado.classList.add("estado-restaurado");
    },

    destruirCandado() {
        this.iniciarAnimacionCandado();
    },

    mostrarCiudadBloqueada() {
        this.reiniciarClasesEscena();
        this.elementos.escenaEncabezado.classList.add("estado-bloqueado");
    },

    mostrarCiudadRestaurando() {
        this.reiniciarClasesEscena();
        this.elementos.escenaEncabezado.classList.add("estado-restaurando");
    },

    mostrarCiudadRestaurada() {
        this.iniciarAnimacionCandado();
        this.iniciarConfeti();
    },

    reiniciarClasesEscena() {
        this.elementos.escenaEncabezado.classList.remove("estado-bloqueado", "estado-restaurando", "estado-restaurado");
        void this.elementos.escenaEncabezado.offsetWidth;
    },

    iniciarConfeti() {
        this.detenerConfeti();
        this.redimensionarCanvasConfeti();
        this.elementos.canvasConfeti.classList.remove("oculto");
        this.confeti = this.crearParticulasConfeti(140);

        const contexto = this.elementos.canvasConfeti.getContext("2d");
        const animar = () => {
            contexto.clearRect(0, 0, this.elementos.canvasConfeti.width, this.elementos.canvasConfeti.height);
            this.actualizarConfeti(contexto);
            this.animacionConfeti = requestAnimationFrame(animar);
        };

        animar();
        this.temporizadorConfeti = window.setTimeout(() => this.detenerConfeti(), 5000);
    },

    detenerConfeti() {
        if (this.animacionConfeti) {
            cancelAnimationFrame(this.animacionConfeti);
            this.animacionConfeti = null;
        }

        if (this.temporizadorConfeti) {
            clearTimeout(this.temporizadorConfeti);
            this.temporizadorConfeti = null;
        }

        if (this.elementos.canvasConfeti) {
            const contexto = this.elementos.canvasConfeti.getContext("2d");
            contexto.clearRect(0, 0, this.elementos.canvasConfeti.width, this.elementos.canvasConfeti.height);
            this.elementos.canvasConfeti.classList.add("oculto");
        }

        this.confeti = [];
    },

    redimensionarCanvasConfeti() {
        this.elementos.canvasConfeti.width = window.innerWidth;
        this.elementos.canvasConfeti.height = window.innerHeight;
    },

    crearParticulasConfeti(cantidad) {
        const colores = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#20c997", "#6610f2"];
        const particulas = [];

        for (let indice = 0; indice < cantidad; indice++) {
            particulas.push({
                x: Math.random() * this.elementos.canvasConfeti.width,
                y: Math.random() * -this.elementos.canvasConfeti.height,
                ancho: Math.random() * 8 + 5,
                alto: Math.random() * 12 + 6,
                velocidad: Math.random() * 3 + 2,
                giro: Math.random() * Math.PI,
                giroVelocidad: Math.random() * 0.18 + 0.06,
                color: colores[Math.floor(Math.random() * colores.length)]
            });
        }

        return particulas;
    },

    actualizarConfeti(contexto) {
        this.confeti.forEach((particula) => {
            particula.y += particula.velocidad;
            particula.x += Math.sin(particula.giro) * 1.5;
            particula.giro += particula.giroVelocidad;

            contexto.save();
            contexto.translate(particula.x, particula.y);
            contexto.rotate(particula.giro);
            contexto.fillStyle = particula.color;
            contexto.fillRect(-particula.ancho / 2, -particula.alto / 2, particula.ancho, particula.alto);
            contexto.restore();
        });
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};
