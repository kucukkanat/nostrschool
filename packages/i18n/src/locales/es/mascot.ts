// Owner: translation agents. Must structurally match ../en/mascot.ts (enforced by the type).
import type { mascot as en } from "../en/mascot.ts";

export const mascot: typeof en = {
  label: "Nos, el avestruz",
  poses: {
    idle: "Nos está atento",
    wave: "Nos saluda",
    think: "Nos está pensando",
    cheer: "Nos aplaude",
    panic: "Nos se alarma",
    celebrate: "Nos celebra",
    sleep: "Nos está dormido",
  },
};
