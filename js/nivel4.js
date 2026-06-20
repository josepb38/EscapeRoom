const nivel4 = {
    elementos: {},
    worker: null,
    totalRegistros: 20000,
    resultadosMostrados: false,

    iniciar() {
        this.elementos = {
            botonProcesar: document.getElementById("btn-procesar-datos"),
            cantidadRegistros: document.getElementById("cantidad-registros-nivel4"),
            progresoContenedor: document.querySelector("#nivel-4 .progress"),
            barraProgreso: document.getElementById("barra-progreso-nivel4"),
            botonProbarInterfaz: document.getElementById("btn-probar-interfaz"),
            contadorInterfaz: document.getElementById("contador-interfaz-nivel4"),
            mensaje: document.getElementById("mensaje-nivel4"),
            cardResultados: document.getElementById("card-resultados-nivel4"),
            tempPromedio: document.getElementById("resultado-temp-promedio"),
            tempMinimo: document.getElementById("resultado-temp-minimo"),
            tempMaximo: document.getElementById("resultado-temp-maximo"),
            humedadPromedio: document.getElementById("resultado-humedad-promedio"),
            humedadMinimo: document.getElementById("resultado-humedad-minimo"),
            humedadMaximo: document.getElementById("resultado-humedad-maximo"),
            botonContinuar: document.getElementById("btn-continuar-nivel5")
        };

        this.elementos.botonProcesar.addEventListener("click", () => this.iniciarProcesamiento());
        this.elementos.botonProbarInterfaz.addEventListener("click", () => this.probarInterfaz());
        this.elementos.botonContinuar.addEventListener("click", () => {
            ejecutarTransicionNivel(5, "EL PORTAL CUÁNTICO", function () {
                app.irANivel(5);
            });
        });
    },

    iniciarProcesamiento() {
        if (!window.Worker) {
            this.mostrarMensaje("Tu navegador no soporta Web Workers.", "danger");
            mostrarIntentoFallido("Web Worker no disponible");
            return;
        }

        this.terminarWorkerActual();
        this.reiniciarInterfazProcesamiento();

        const registros = this.generarRegistros();
        this.elementos.cantidadRegistros.textContent = `Registros generados: ${registros.length}`;

        this.worker = new Worker("js/workerNivel4.js");
        this.worker.addEventListener("message", (evento) => this.procesarMensajeWorker(evento.data));
        this.worker.addEventListener("error", () => this.procesarErrorWorker());
        this.worker.postMessage({ tipo: "procesar", registros });
    },

    generarRegistros() {
        const registros = [];

        for (let indice = 0; indice < this.totalRegistros; indice++) {
            registros.push({
                temperatura: this.generarNumero(14, 39),
                humedad: this.generarNumero(30, 95)
            });
        }

        return registros;
    },

    generarNumero(minimo, maximo) {
        return Number((Math.random() * (maximo - minimo) + minimo).toFixed(2));
    },

    procesarMensajeWorker(mensaje) {
        if (mensaje.tipo === "progreso") {
            this.actualizarProgreso(mensaje.porcentaje);
            return;
        }

        if (mensaje.tipo === "resultado") {
            this.finalizarProcesamiento(mensaje.estadisticas);
        }
    },

    finalizarProcesamiento(estadisticas) {
        this.actualizarProgreso(100);
        this.elementos.botonProcesar.disabled = false;
        this.terminarWorkerActual();

        if (!this.sonEstadisticasValidas(estadisticas)) {
            this.mostrarMensaje("El Worker devolvió estadísticas incompletas.", "danger");
            mostrarIntentoFallido("Estadísticas incompletas");
            this.actualizarBotonContinuar();
            return;
        }

        this.mostrarResultados(estadisticas);
        this.resultadosMostrados = true;
        this.mostrarMensaje("Estadísticas completas. El Portal Cuántico ha sido desbloqueado.", "success");
        marcarNivelCompletado(4);
        mostrarNivelCompletado(4);
        this.elementos.botonContinuar.disabled = false;
        app.actualizarNavegacion();
    },

    sonEstadisticasValidas(estadisticas) {
        return Boolean(
            estadisticas &&
            estadisticas.temperatura &&
            estadisticas.humedad &&
            Number.isFinite(estadisticas.temperatura.promedio) &&
            Number.isFinite(estadisticas.temperatura.minimo) &&
            Number.isFinite(estadisticas.temperatura.maximo) &&
            Number.isFinite(estadisticas.humedad.promedio) &&
            Number.isFinite(estadisticas.humedad.minimo) &&
            Number.isFinite(estadisticas.humedad.maximo)
        );
    },

    mostrarResultados(estadisticas) {
        this.elementos.tempPromedio.textContent = estadisticas.temperatura.promedio.toFixed(2);
        this.elementos.tempMinimo.textContent = estadisticas.temperatura.minimo.toFixed(2);
        this.elementos.tempMaximo.textContent = estadisticas.temperatura.maximo.toFixed(2);
        this.elementos.humedadPromedio.textContent = estadisticas.humedad.promedio.toFixed(2);
        this.elementos.humedadMinimo.textContent = estadisticas.humedad.minimo.toFixed(2);
        this.elementos.humedadMaximo.textContent = estadisticas.humedad.maximo.toFixed(2);
        this.elementos.cardResultados.classList.remove("oculto");
    },

    procesarErrorWorker() {
        this.terminarWorkerActual();
        this.elementos.botonProcesar.disabled = false;
        this.mostrarMensaje("Ocurrió un error durante el procesamiento del Worker.", "danger");
        mostrarIntentoFallido("Error del Worker");
        this.actualizarBotonContinuar();
    },

    reiniciarInterfazProcesamiento() {
        this.resultadosMostrados = false;
        this.elementos.botonProcesar.disabled = true;
        this.elementos.cardResultados.classList.add("oculto");
        this.limpiarResultados();
        this.actualizarProgreso(0);
        this.actualizarBotonContinuar();
        this.mostrarMensaje("Generando y enviando 20,000 registros al Worker...", "info");
    },

    limpiarResultados() {
        this.elementos.tempPromedio.textContent = "-";
        this.elementos.tempMinimo.textContent = "-";
        this.elementos.tempMaximo.textContent = "-";
        this.elementos.humedadPromedio.textContent = "-";
        this.elementos.humedadMinimo.textContent = "-";
        this.elementos.humedadMaximo.textContent = "-";
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

    actualizarBotonContinuar() {
        this.elementos.botonContinuar.disabled = !estaNivelCompletado(4);
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};
