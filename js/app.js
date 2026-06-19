const app = {
    niveles: [
        { numero: 1, nombre: "El Guardián de la Ubicación" },
        { numero: 2, nombre: "El Cartógrafo Perdido" },
        { numero: 3, nombre: "La Evidencia del Explorador" },
        { numero: 4, nombre: "El Núcleo de Procesamiento" },
        { numero: 5, nombre: "El Portal Cuántico" }
    ],

    iniciar() {
        this.crearNavegacion();
        nivel1.iniciar();
        nivel2.iniciar();
        nivel3.iniciar();
        nivel4.iniciar();
        nivel5.iniciar();
        this.mostrarNivel(estadoAplicacion.nivelActual);
        this.actualizarNavegacion();
        this.presentarNivelInicial();
    },

    presentarNivelInicial() {
        ejecutarTransicionNivel(1, "EL GUARDIÁN DE LA UBICACIÓN", function () {
            if (estadoAplicacion.nivelActual !== 1) {
                app.irANivel(1);
            }
        });
    },

    crearNavegacion() {
        const contenedor = document.getElementById("navegacion-niveles");
        contenedor.innerHTML = "";

        this.niveles.forEach((nivel) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "btn-nivel p-3";
            boton.dataset.nivel = nivel.numero;
            boton.addEventListener("click", () => this.irANivel(nivel.numero));
            contenedor.appendChild(boton);
        });
    },

    irANivel(numeroNivel) {
        if (!estaNivelDisponible(numeroNivel)) {
            return;
        }

        if (estadoAplicacion.nivelActual === 3 && numeroNivel !== 3) {
            detenerCamaraNivel3();
        }

        estadoAplicacion.nivelActual = numeroNivel;
        this.mostrarNivel(numeroNivel);
        this.actualizarNavegacion();
    },

    mostrarNivel(numeroNivel) {
        this.niveles.forEach((nivel) => {
            const seccion = document.getElementById(`nivel-${nivel.numero}`);
            seccion.classList.toggle("oculto", nivel.numero !== numeroNivel);
        });

        if (numeroNivel === 2) {
            nivel2.actualizarCoordenadasMostradas();
        }
    },

    actualizarNavegacion() {
        const botones = document.querySelectorAll(".btn-nivel");

        botones.forEach((boton) => {
            const numeroNivel = Number(boton.dataset.nivel);
            const nivel = this.niveles.find((item) => item.numero === numeroNivel);
            const disponible = estaNivelDisponible(numeroNivel);
            const completado = estaNivelCompletado(numeroNivel);

            boton.disabled = !disponible;
            boton.classList.toggle("activo", estadoAplicacion.nivelActual === numeroNivel);
            boton.classList.toggle("completado", completado);
            boton.classList.toggle("bloqueado", !disponible);
            boton.textContent = `Nivel ${numeroNivel}: ${nivel.nombre}`;
        });
    }
};

document.addEventListener("DOMContentLoaded", () => app.iniciar());
