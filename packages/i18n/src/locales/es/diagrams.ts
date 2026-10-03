// Owner: translation agents. Must structurally match ../en/diagrams.ts (enforced by the type).
import type { diagrams as en } from "../en/diagrams.ts";

export const diagrams: typeof en = {
  sequence: {
    from: "De {from} a {to}",
    empty: "Todavía no hay mensajes",
    start: "Listo. Presiona reproducir o avanza un paso para enviar el primer mensaje.",
    number: "#",
    message: "Mensaje",
    fromHeader: "De",
    toHeader: "Para",
  },
  pipeline: {
    stage: "Etapa {n}: {name}",
    error: "Falló en {name}",
    done: "Todas las etapas completadas.",
    idle: "Todavía no empezó.",
    expand: "Mostrar valor completo",
    collapse: "Mostrar menos",
    output: "Salida",
  },
  graph: {
    node: "{name}, sigue a {following}, lo siguen {followers}",
    select: "Selecciona una persona",
    cleared: "Selección borrada.",
    help: "Usa las flechas para moverte entre personas, Enter para seleccionar y Escape para borrar. Arrastra para reorganizar.",
    person: "Persona",
    follows: "Sigue a",
    followedBy: "Lo siguen",
    none: "Nadie",
  },
  swimlane: {
    lane: "Carril",
    step: "Paso {n}",
    arrow: "{from} a {to}",
  },
  packet: {
    label: "Mensaje {type}",
  },
  common: {
    textVersion: "Versión en texto",
    invalid: "No se pudo dibujar este diagrama ({code}): {message}",
  },
};
