const nivel4 = {
    elementos: {},
    worker: null,
    urlWorkerBlob: null,
    usandoWorkerBlob: false,
    registrosPendientes: null,
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
        this.terminarWorkerActual();
        this.reiniciarInterfazProcesamiento();

        const registros = this.generarRegistros();
        this.registrosPendientes = registros;
        this.elementos.cantidadRegistros.textContent = `Registros generados: ${registros.length}`;

        if (!window.Worker) {
            this.mostrarMensaje("Tu navegador no soporta Web Workers. Procesando en modo alternativo...", "warning");
            this.procesarRegistrosSinWorker(registros);
            return;
        }

        this.iniciarWorkerExterno(registros);
    },

    iniciarWorkerExterno(registros) {
        try {
            const worker = new Worker(this.obtenerRutaWorkerExterno());
            this.usandoWorkerBlob = false;
            this.configurarWorker(worker, registros);
        } catch (error) {
            this.iniciarWorkerBlob(registros);
        }
    },

    obtenerRutaWorkerExterno() {
        const scriptNivel4 = document.querySelector('script[src$="nivel4.js"]');

        if (scriptNivel4 && scriptNivel4.src) {
            return new URL("workerNivel4.js", scriptNivel4.src).href;
        }

        return "js/workerNivel4.js";
    },

    iniciarWorkerBlob(registros) {
        try {
            const blob = new Blob([this.obtenerCodigoWorker()], {
                type: "application/javascript"
            });

            this.urlWorkerBlob = URL.createObjectURL(blob);
            const worker = new Worker(this.urlWorkerBlob);
            this.usandoWorkerBlob = true;
            this.configurarWorker(worker, registros);
            this.mostrarMensaje("El Worker externo no pudo cargarse. Se está usando un Worker interno de respaldo...", "warning");
        } catch (error) {
            this.mostrarMensaje("El Worker no pudo iniciarse. Procesando en modo alternativo...", "warning");
            this.procesarRegistrosSinWorker(registros);
        }
    },

    configurarWorker(worker, registros) {
        this.worker = worker;
        this.worker.addEventListener("message", (evento) => this.procesarMensajeWorker(evento.data));
        this.worker.addEventListener("error", () => this.procesarErrorWorker());
        this.worker.postMessage({ tipo: "procesar", registros });
    },

    obtenerCodigoWorker() {
        return `self.addEventListener("message", (evento) => {
    if (!evento.data || evento.data.tipo !== "procesar") {
        return;
    }

    try {
        procesarRegistros(evento.data.registros);
    } catch (error) {
        self.postMessage({
            tipo: "error",
            mensaje: error.message || "Error desconocido en el Worker."
        });
    }
});

function procesarRegistros(registros) {
    if (!Array.isArray(registros) || registros.length === 0) {
        throw new Error("No hay registros para procesar.");
    }

    const total = registros.length;
    const tamanoBloque = 1000;
    let indice = 0;
    let sumaTemperatura = 0;
    let sumaHumedad = 0;
    let minimaTemperatura = Infinity;
    let maximaTemperatura = -Infinity;
    let minimaHumedad = Infinity;
    let maximaHumedad = -Infinity;

    function procesarBloque() {
        const limite = Math.min(indice + tamanoBloque, total);

        for (; indice < limite; indice++) {
            const registro = registros[indice];
            const temperatura = Number(registro.temperatura);
            const humedad = Number(registro.humedad);

            if (!Number.isFinite(temperatura) || !Number.isFinite(humedad)) {
                throw new Error("Registro inválido.");
            }

            sumaTemperatura += temperatura;
            sumaHumedad += humedad;
            minimaTemperatura = Math.min(minimaTemperatura, temperatura);
            maximaTemperatura = Math.max(maximaTemperatura, temperatura);
            minimaHumedad = Math.min(minimaHumedad, humedad);
            maximaHumedad = Math.max(maximaHumedad, humedad);
        }

        self.postMessage({
            tipo: "progreso",
            porcentaje: Math.round((indice / total) * 100)
        });

        if (indice < total) {
            setTimeout(procesarBloque, 0);
            return;
        }

        self.postMessage({
            tipo: "resultado",
            estadisticas: {
                temperatura: {
                    promedio: sumaTemperatura / total,
                    minimo: minimaTemperatura,
                    maximo: maximaTemperatura
                },
                humedad: {
                    promedio: sumaHumedad / total,
                    minimo: minimaHumedad,
                    maximo: maximaHumedad
                }
            }
        });
    }

    procesarBloque();
}`;
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
            return;
        }

        if (mensaje.tipo === "error") {
            this.procesarErrorWorker();
        }
    },

    procesarRegistrosSinWorker(registros) {
        const total = registros.length;
        const tamanoBloque = 1000;
        let indice = 0;
        let sumaTemperatura = 0;
        let sumaHumedad = 0;
        let minimaTemperatura = Infinity;
        let maximaTemperatura = -Infinity;
        let minimaHumedad = Infinity;
        let maximaHumedad = -Infinity;

        const procesarBloque = () => {
            try {
                const limite = Math.min(indice + tamanoBloque, total);

                for (; indice < limite; indice++) {
                    const registro = registros[indice];
                    const temperatura = Number(registro.temperatura);
                    const humedad = Number(registro.humedad);

                    if (!Number.isFinite(temperatura) || !Number.isFinite(humedad)) {
                        throw new Error("Registro inválido.");
                    }

                    sumaTemperatura += temperatura;
                    sumaHumedad += humedad;
                    minimaTemperatura = Math.min(minimaTemperatura, temperatura);
                    maximaTemperatura = Math.max(maximaTemperatura, temperatura);
                    minimaHumedad = Math.min(minimaHumedad, humedad);
                    maximaHumedad = Math.max(maximaHumedad, humedad);
                }

                this.actualizarProgreso((indice / total) * 100);

                if (indice < total) {
                    window.setTimeout(procesarBloque, 0);
                    return;
                }

                this.finalizarProcesamiento({
                    temperatura: {
                        promedio: sumaTemperatura / total,
                        minimo: minimaTemperatura,
                        maximo: maximaTemperatura
                    },
                    humedad: {
                        promedio: sumaHumedad / total,
                        minimo: minimaHumedad,
                        maximo: maximaHumedad
                    }
                });
            } catch (error) {
                this.elementos.botonProcesar.disabled = false;
                this.mostrarMensaje("Ocurrió un error durante el procesamiento alternativo.", "danger");
                mostrarIntentoFallido("Error de procesamiento");
                this.actualizarBotonContinuar();
            }
        };

        procesarBloque();
    },

    finalizarProcesamiento(estadisticas) {
        this.actualizarProgreso(100);
        this.elementos.botonProcesar.disabled = false;
        this.terminarWorkerActual();
        this.registrosPendientes = null;

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
        const registros = this.registrosPendientes;
        const estabaUsandoWorkerBlob = this.usandoWorkerBlob;

        this.terminarWorkerActual();

        if (!estabaUsandoWorkerBlob && Array.isArray(registros) && registros.length > 0) {
            this.iniciarWorkerBlob(registros);
            return;
        }

        if (Array.isArray(registros) && registros.length > 0) {
            this.mostrarMensaje("El Worker falló. Procesando en modo alternativo...", "warning");
            this.procesarRegistrosSinWorker(registros);
            return;
        }

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
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        if (this.urlWorkerBlob) {
            URL.revokeObjectURL(this.urlWorkerBlob);
            this.urlWorkerBlob = null;
        }

        this.usandoWorkerBlob = false;
    },

    actualizarBotonContinuar() {
        this.elementos.botonContinuar.disabled = !estaNivelCompletado(4);
    },

    mostrarMensaje(texto, tipo) {
        this.elementos.mensaje.textContent = texto;
        this.elementos.mensaje.className = `alert alert-${tipo} mt-4 mb-0`;
    }
};
