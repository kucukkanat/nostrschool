// Owner: translation agents. Must structurally match ../../en/chapters/01.ts.
import type { ch01 as en } from "../../en/chapters/01.ts";

// Server/relay names (BigCo, tea.social, alpha, AppView…) stay untranslated on purpose:
// the chapter prose refers to them by these exact labels.
export const ch01: typeof en = {
  title: "¿Por qué Nostr?",
  summary:
    "Qué sale mal cuando una sola empresa es dueña del servidor, y cómo los relays cambian las reglas del juego.",
  sandbox: {
    title: "Arenero de topologías",
    description:
      "Cinco amigos, cuatro formas de armar una red social. Tumba servidores y relays, o banea a Alice, y mira quién todavía puede llegar a su audiencia.",
    instructions:
      "Haz clic o pulsa Enter sobre un servidor o relay para dejarlo fuera de línea. Después prueba a banear a Alice.",
    modelsLabel: "Modelo de red",
    graphLabel: "Diagrama de la red {model}",
    models: {
      central: {
        label: "Centralizada",
        tagline: "Una empresa maneja el único servidor. Todo el mundo vive ahí.",
      },
      federated: {
        label: "Federada",
        tagline: "Muchos servidores (instancias) que hablan entre sí, como Mastodon.",
      },
      nostr: {
        label: "Nostr",
        tagline:
          "Relays simples que guardan notas. Tu identidad es una clave que tú tienes, y publicas en varios relays.",
      },
      bluesky: {
        label: "Bluesky",
        tagline:
          "Tus datos viven en un PDS; un relay y un AppView arman la línea de tiempo de todos.",
      },
    },
    nodes: {
      alice: "Alice",
      bob: "Bob",
      carol: "Carol",
      dave: "Dave",
      erin: "Erin",
      platform: "BigCo",
      tea: "tea.social",
      coffee: "coffee.town",
      cocoa: "cocoa.zone",
      alpha: "alpha",
      beta: "beta",
      gamma: "gamma",
      delta: "delta",
      pdsBig: "PDS grande",
      pdsHome: "PDS propio",
      firehose: "Relay",
      appview: "AppView",
    },
    roles: {
      user: "persona",
      server: "servidor",
      relay: "relay",
    },
    nodeButton: "{name} ({role}, {state}). Pulsa para cambiar su estado.",
    nodeUser: "{name}: llega a {count} de {total} amigos",
    up: "en línea",
    down: "fuera de línea",
    ban: "Banear a Alice",
    unban: "Quitar el baneo a Alice",
    banHint: "{host} decide que Alice rompió las reglas.",
    reset: "Reiniciar",
    health: "Conversaciones que siguen funcionando",
    healthValue: "{alive} de {total}",
    scoreboard: "¿Quién todavía llega a su audiencia?",
    audience: "llega a {count} de {total}",
    status: {
      full: "Se le escucha por completo",
      partial: "Se le escucha a medias",
      silenced: "Silenciado",
    },
    account: {
      keys: "Identidad: claves propias",
      hosted: "Cuenta en {host}",
      lost: "Cuenta perdida junto con {host}",
      banned: "Baneado por {host}",
    },
    narration: {
      start: "Todos los servidores y relays están en línea. Todos pueden llegar a todos.",
      down: "{name} quedó fuera de línea.",
      up: "{name} volvió a estar en línea.",
      banned: "{host} baneó a Alice.",
      unbanned: "{host} le quitó el baneo a Alice.",
      reset: "Todo volvió a estar en línea.",
      model: "Cambiaste a la red {model}.",
      silenced: "Silenciados: {names}.",
      nobodySilenced: "Nadie perdió la voz.",
      health: "{alive} de {total} conversaciones siguen funcionando.",
    },
    verdict: {
      allGood: "Todo sigue conectado. ¡Bien resistente!",
      degraded: "Algunas conversaciones se rompieron.",
      collapsed: "Toda la red está a oscuras.",
    },
  },
  resilience: {
    title: "Un mal día: la peor caída individual",
    description:
      "Para cada modelo tumbamos el servidor o relay cuya caída hace más daño, y contamos cuántas conversaciones entre amigos sobreviven.",
    xLabel: "Modelo de red",
    yLabel: "Conversaciones que sobreviven",
    source: "Calculado en vivo a partir de las redes de cinco amigos del arenero de arriba.",
  },
};
