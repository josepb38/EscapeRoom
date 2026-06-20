self.addEventListener("message", (evento) => {
    if (!evento.data || !evento.data.buffer) {
        return;
    }

    try {
        procesarDatos(evento.data.buffer, evento.data.totalRegistros);
    } catch (error) {
        self.postMessage({
            tipo: "error",
            mensaje: error.message || "Error desconocido en el Worker."
        });
    }
});

function procesarDatos(buffer, totalRegistros) {
    const datos = new Float32Array(buffer);

    if (datos.length !== totalRegistros * 3) {
        throw new Error("Cantidad de datos inválida.");
    }

    const resultados = {
        totalRegistrosGenerados: totalRegistros,
        registrosValidos: 0,
        registrosInvalidos: 0,
        promedioGeneral: 0,
        top10Temperaturas: [],
        top10Presiones: []
    };

    const tamanoBloque = 5000;
    let indiceRegistro = 0;
    let sumaTotal = 0;

    function procesarBloque() {
        try {
            const limite = Math.min(indiceRegistro + tamanoBloque, totalRegistros);

            for (; indiceRegistro < limite; indiceRegistro++) {
                const posicion = indiceRegistro * 3;
                const temperatura = datos[posicion];
                const humedad = datos[posicion + 1];
                const presion = datos[posicion + 2];

                if (!Number.isFinite(temperatura) || !Number.isFinite(humedad) || !Number.isFinite(presion)) {
                    throw new Error("Registro inválido.");
                }

                // Decisión técnica: un registro es válido cuando temperatura, humedad y presión son >= 0.
                // Si uno de los tres valores es negativo, se descarta el registro completo.
                // El promedio general combina las tres mediciones de los registros válidos.
                if (temperatura < 0 || humedad < 0 || presion < 0) {
                    resultados.registrosInvalidos++;
                    continue;
                }

                resultados.registrosValidos++;
                sumaTotal += temperatura + humedad + presion;
                insertarTop10(resultados.top10Temperaturas, temperatura);
                insertarTop10(resultados.top10Presiones, presion);
            }

            self.postMessage({
                tipo: "progreso",
                porcentaje: Math.round((indiceRegistro / totalRegistros) * 100)
            });

            if (indiceRegistro < totalRegistros) {
                setTimeout(procesarBloque, 0);
                return;
            }

            resultados.promedioGeneral = resultados.registrosValidos > 0
                ? sumaTotal / (resultados.registrosValidos * 3)
                : 0;

            self.postMessage({
                tipo: "resultado",
                resultados
            });
        } catch (error) {
            self.postMessage({
                tipo: "error",
                mensaje: error.message || "Error desconocido en el Worker."
            });
        }
    }

    procesarBloque();
}

function insertarTop10(lista, valor) {
    if (valor < 0) {
        return;
    }

    lista.push(valor);
    lista.sort((a, b) => b - a);

    if (lista.length > 10) {
        lista.length = 10;
    }
}
