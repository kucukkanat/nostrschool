// Owner: translation agents. Must structurally match ../../en/chapters/05.ts.
import type { ch05 as en } from "../../en/chapters/05.ts";

// Field names (ids, authors, kinds, since, until, limit), REQ/EOSE, relay, npub, kind and zap stay
// in English: they are literal protocol keys and that's how the Spanish-speaking Nostr community says them.
export const ch05: typeof en = {
  title: "Filtros",
  summary: "Pide a los relays exactamente los eventos que quieres.",
  describe: {
    everything: "Un filtro vacío: ¡dame todo lo que tengas!",
    newestOnly: "Dame los {limit} eventos más nuevos, sean los que sean.",
    or: " o ",
    and: ", ",
    fields: {
      ids: "con id {values}",
      authors: "escritos por {values}",
      kinds: "de kind {values}",
      "#e": "que apunten al evento {values}",
      "#p": "que mencionen a {values}",
      "#t": "etiquetados {values}",
    },
    since: "desde el {date}",
    until: "hasta el {date}",
    sentence: "Dame eventos {body}.",
    sentenceLimited: "Dame los {limit} eventos más nuevos {body}.",
  },
  preview: {
    profile: "Perfil: nombre, foto, biografía",
    follows: "Lista de seguidos ({count} personas)",
    deletion: "Solicitud de borrado",
    repost: "Repost de otra nota",
    giftWrap: "Mensaje privado sellado (ilegible)",
    zapReceipt: "Recibo de zap de una wallet Lightning",
    relayList: "Lista de relays ({count} relays)",
    article: "Artículo largo",
  },
  builder: {
    title: "Constructor de filtros",
    description:
      "Activa los interruptores y mira la estantería del relay: los eventos que coinciden se iluminan y el resto se apaga.",
    controlsLabel: "Campos del filtro",
    presetsLabel: "Prueba una receta",
    presets: {
      aliceNotes: "Notas de Alice",
      thread: "El hilo de Alice",
      mentionsBob: "Menciones a Bob",
      hashtag: "#nostr",
      newest: "Los 5 más nuevos",
    },
    reset: "Vaciar filtro",
    add: "Añadir",
    remove: "Quitar {value}",
    quickPicks: "Opciones rápidas para {field}",
    fields: {
      ids: {
        label: "ids",
        hint: "Ids exactos de eventos (hex o note1…). Truco: elige una tarjeta y fija su id.",
        placeholder: "hex de 64 caracteres o note1…",
      },
      authors: {
        label: "authors",
        hint: "Quién firmó el evento (clave pública en hex o npub1…).",
        placeholder: "clave pública en hex o npub1…",
      },
      kinds: {
        label: "kinds",
        hint: "Qué tipo de evento: 1 = nota, 7 = reacción, 0 = perfil…",
        placeholder: "p. ej. 1",
      },
      "#e": {
        label: "#e",
        hint: "Eventos con una etiqueta e que apunta a este evento: respuestas, reacciones, reposts.",
        placeholder: "id de evento o note1…",
      },
      "#p": {
        label: "#p",
        hint: "Eventos con una etiqueta p que menciona a esta persona.",
        placeholder: "clave pública en hex o npub1…",
      },
      "#t": {
        label: "#t",
        hint: "Hashtags (etiquetas t), en minúsculas y sin el #.",
        placeholder: "p. ej. nostr",
      },
    },
    numbers: {
      since: { label: "since", toggle: "Solo eventos desde este momento" },
      until: { label: "until", toggle: "Solo eventos hasta este momento" },
      limit: { label: "limit", toggle: "Solo los N eventos más nuevos" },
    },
    errors: {
      empty: "Escribe algo primero.",
      "invalid-id": "Eso no es un id de evento. Usa 64 caracteres hex, un note1… o un nevent1….",
      "invalid-pubkey":
        "Eso no es una clave pública. Usa 64 caracteres hex, un npub1… o un nprofile1….",
      "not-an-integer": "Los kinds son números enteros, como 1 o 30023.",
      "out-of-range": "Los kinds van de 0 a 65535.",
      "invalid-hashtag": "Un hashtag es una sola palabra, como nostr.",
      duplicate: "Ya está en el filtro.",
    },
    jsonTitle: "El filtro, en JSON",
    reqTitle: "…envuelto en un mensaje REQ",
    shelfLabel: "Eventos de nuestro relay de ejemplo",
    results: {
      zero: "Ningún evento coincide. ¡Afloja alguna condición!",
      one: "{count} de {total} eventos coincide",
      other: "{count} de {total} eventos coinciden",
    },
    limited: {
      one: "{count} coincidencia más queda fuera por el limit",
      other: "{count} coincidencias más quedan fuera por el limit",
    },
    states: {
      match: "coincide",
      limited: "fuera por limit",
      miss: "no coincide",
    },
    cardLabel: "{author}, {kind}, {time}: {state}. Ver por qué.",
    unknownAuthor: "Otra persona",
  },
  explain: {
    title: "¿Por qué este evento?",
    prompt: "Elige cualquier tarjeta para ver qué condiciones cumple.",
    empty: "El filtro está vacío, así que todos los eventos pasan. ¡Añade una condición!",
    pass: "cumple",
    fail: "no cumple",
    verdictMatch: "Cumple todas las condiciones, así que el relay lo envía.",
    verdictLimited: "Coincide, pero eventos más nuevos ya llenaron el limit.",
    verdictMiss: "Basta con que falle una condición para dejarlo fuera.",
    pinId: "Filtrar por este id",
    findTagged: "Buscar eventos que apunten aquí (#e)",
    findAuthor: "Más de este autor",
    close: "Cerrar",
  },
  quest: {
    title: "Misiones de filtros",
    description:
      "Construye un filtro cuyos resultados sean exactamente lo que pide cada misión. ¡Vale cualquier filtro que lo consiga!",
    progress: "{count} de {total} misiones resueltas",
    solved: "¡Resuelta!",
    solvedAnnounce: "Misión resuelta: {title}",
    allSolved: "Todas las misiones resueltas. ¡Hablas relay con fluidez!",
    items: {
      reactions: {
        title: "Aplausómetro",
        goal: "Encuentra todas las reacciones (kind 7) al hilo de Alice sobre relays, y nada más.",
      },
      hotTake: {
        title: "A la caza de opiniones picantes",
        goal: "Encuentra las notas cortas de Bob etiquetadas #nostr.",
      },
      profiles: {
        title: "Caras nuevas",
        goal: "Obtén solo los 3 perfiles más nuevos (kind 0).",
      },
      aliceToday: {
        title: "Nochevieja",
        goal: "Todo lo que Alice firmó desde el 31 dic 2024, 00:00 UTC en adelante.",
      },
    },
  },
  runner: {
    title: "Envíalo a un relay",
    description:
      "Envuelve el filtro en un REQ y mira la conversación real: llegan los eventos y luego EOSE dice 'eso es todo lo que tengo guardado'.",
    send: "Enviar REQ",
    stop: "Cerrar suscripción",
    modeFixture: "Relays de ejemplo",
    modeLive: "Relays en vivo",
    safeLimit: "A los relays en vivo les ponemos un limit de {limit} para ser educados.",
    framesTitle: "Registro de mensajes",
    framesEmpty: "Aún no se ha enviado nada.",
    results: {
      zero: "No llegó ningún evento.",
      one: "{count} evento recibido",
      other: "{count} eventos recibidos",
    },
    running: "Esperando a los relays…",
    done: "Todos los relays enviaron EOSE.",
    closed: "Suscripción cerrada.",
    error: "{relay}: {message}",
    from: "vía {relay}",
  },
  editor: {
    label: "Edita el JSON del filtro",
    apply: "Aplicar JSON",
    applied: "Filtro actualizado desde el JSON.",
    errors: {
      "invalid-json": "Eso no es JSON válido: {message}",
      "invalid-filter": "No es un filtro válido: {message}",
      "unsupported-field":
        "El constructor solo muestra ids, authors, kinds, #e, #p, #t, since, until y limit ({message}).",
    },
  },
  tool: {
    intro:
      "Construye filtros NIP-01 de forma visual, míralos en JSON y pruébalos con eventos de ejemplo o, con el modo en vivo activado, con relays reales.",
  },
};
