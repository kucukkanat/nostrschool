// Owner: translation agents. Must structurally match ../en/ui.ts (enforced by the type).
import type { ui as en } from "../en/ui.ts";

export const ui: typeof en = {
  underTheHood: {
    title: "Bajo el capó",
    alwaysExpand: "Expandir siempre",
    show: "Mostrar detalles",
    hide: "Ocultar detalles",
  },
  copy: {
    copy: "Copiar",
    copied: "¡Copiado!",
    failed: "No se pudo copiar",
  },
  quiz: {
    check: "Comprobar respuesta",
    correct: "¡Correcto!",
    wrong: "No exactamente.",
    retry: "Intentar de nuevo",
    selectOne: "Elige una respuesta",
    selectMany: "Elige todas las que correspondan",
  },
  playback: {
    play: "Reproducir",
    pause: "Pausa",
    stepForward: "Paso siguiente",
    stepBack: "Paso anterior",
    reset: "Reiniciar",
    speed: "Velocidad",
    scrub: "Línea de tiempo",
    stepOf: "Paso {current} de {total}",
  },
  term: {
    readMore: "Más en el glosario",
  },
  takeaway: {
    title: "Ideas clave",
  },
  json: {
    expand: "Expandir",
    collapse: "Contraer",
    items: {
      one: "{count} elemento",
      other: "{count} elementos",
    },
  },
  callout: {
    info: "Info",
    tip: "Consejo",
    warning: "Atención",
    danger: "Peligro",
    safety: "Seguridad",
  },
  stepper: {
    label: "Pasos",
    current: "Paso actual",
  },
};
