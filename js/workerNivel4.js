self.addEventListener("message", (evento) => {
    if (!evento.data || evento.data.tipo !== "procesar") {
        return;
    }

    procesarRegistros(evento.data.registros);
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
}
