// Owner: translation agents. Must structurally match ../../en/chapters/07.ts.
import type { ch07 as en } from "../../en/chapters/07.ts";

// "Kind", "relay", "outbox" and "inbox" stay as the Spanish-speaking Nostr community uses them.
export const ch07: typeof en = {
  title: "El grafo social",
  summary: "Las listas de seguidos y cómo los clientes encuentran dónde publican tus amigos.",
  graph: {
    title: "Quién sigue a quién",
    description:
      "Siete personas y sus listas de seguidos (kind 3), dibujadas como un grafo de fuerzas. Arrastra a las personas, pasa el cursor para iluminar sus conexiones y selecciona a alguien para leer su lista.",
    lensLabel: "Al pasar el cursor, resaltar",
    lensFollows: "A quién sigue",
    lensFollowers: "Quién lo sigue",
    statsTitle: "Toda la red",
    stats: "{people} personas · {links} seguimientos · {mutual} pares mutuos",
    popular: "Más seguido: {name} ({count} seguidores)",
    pickHint:
      "Selecciona a alguien en el grafo (haz clic, o usa Tab y luego Enter) para leer su lista de seguidos.",
    follows: "Sigue a · {count}",
    followers: "Lo siguen · {count}",
    mutualBadge: "mutuo",
    none: "Nadie",
    clear: "Quitar selección",
    rawTitle: "El kind 3 más reciente de {name}",
    hoverFollows: "{name} sigue a {list}.",
    hoverFollowers: "A {name} lo siguen {list}.",
  },
  outbox: {
    title: "¿Cómo encuentra una app las notas de tus amigos?",
    description:
      "Un mapa animado de una app de Nostr hablando con cuatro relays. Elige una estrategia y avanza paso a paso para ver qué relays contacta la app y de quién llegan notas.",
    viewerLabel: "Eres",
    modeLabel: "Estrategia",
    modes: {
      outbox: "Modelo outbox",
      reply: "Responder a un amigo",
      single: "Todos en un solo relay",
    },
    singleRelayLabel: "El único relay",
    recipientLabel: "Respondiendo a",
    app: "App de {name}",
    lookups: "búsquedas de perfil",
    steps: {
      start: "Listo",
      follows: "Cargar lista de seguidos",
      relayLists: "Obtener listas de relays",
      plan: "Planear conexiones",
      subscribe: "Suscribirse",
      notes: "Llegan las notas",
      lookup: "Buscar su inbox",
      publish: "Publicar respuesta",
    },
    narration: {
      start: "Pulsa play o avanza un paso para ver cómo trabaja la app de {name}.",
      follows:
        "La app de {name} le pide a {relay} la lista de seguidos (kind 3) de {name}: {list}.",
      relayLists:
        "Luego le pide a {relay} la lista de relays (kind 10002) de cada persona seguida, para saber dónde escribe cada una.",
      plan: "Agrupa a las personas según los relays donde escriben: {count} relays por visitar. (Con {minimal} ya se llegaría a todos una vez).",
      subscribe:
        "Abre una suscripción por relay y le pide a cada relay solo los autores que escriben ahí.",
      notesAll: "Llegan notas de las {total} personas. ¡No falta nadie!",
      singleFollows:
        "La app de {name} solo conoce {relay}, así que carga la lista de seguidos desde ahí: {list}.",
      singleSubscribe: "Le pide a {relay} las notas de todos en una sola suscripción.",
      notesSome:
        "Solo aparecen {reached} de {total} personas. Faltan: {missed}. Nunca escriben en {relay}.",
      lookup:
        "Para responder a {recipient}, la app obtiene el kind 10002 de {recipient} para encontrar sus relays de lectura: su inbox.",
      publish:
        "Envía la respuesta a los relays de escritura de {name} (para que la vean sus seguidores) y a los relays de lectura de {recipient} (para que {recipient} la vea): {relays}.",
    },
    coverage: "{reached}/{total} alcanzados",
    connections: "Relays contactados: {count}",
    minimal: "Mínimo de relays para llegar a todos: {count}",
    relayAsks: "Pide: {list}",
    relayIdle: "No hace falta",
    relayPublish: "Recibe la respuesta",
    legendWrite: "escribe en",
    legendRead: "inbox (lectura)",
    legendLink: "conexión de la app",
    personReached: "{name}: notas recibidas",
    personMissed: "{name}: no aparece",
    personWaiting: "{name}",
    framesTitle: "Lo que la app envía de verdad",
    framesEmpty: "Avanza un paso para ver los mensajes.",
    replyContent: "¡Me encanta, {name}!",
  },
  replace: {
    title: "La trampa de sobrescribir el kind 3",
    description:
      "Una lista de seguidos es reemplazable: el relay guarda solo la copia más nueva. Edita la lista de Grace, publícala y luego publica desde una tablet desactualizada para ver qué sobrevive.",
    intro: "Eres Grace. Marca a quién seguir y publica desde tu teléfono.",
    followLabel: "Teléfono de Grace",
    publishPhone: "Publicar desde el teléfono",
    publishTablet: "Publicar desde la tablet vieja",
    sync: "Sincronizar el teléfono desde el relay",
    reset: "Empezar de nuevo",
    tabletHint: "La tablet todavía tiene la lista del mes pasado: solo {list}.",
    relayTitle: "En el relay",
    relayEmpty: "Todavía no se ha publicado nada en esta demo.",
    version: "Versión {n} · {device} · {count} seguidos",
    devicePhone: "teléfono",
    deviceTablet: "tablet",
    lost: "Seguidos perdidos: {list}",
    narration: {
      ready: "Cambia las casillas y luego publica.",
      published:
        "El teléfono publicó la versión {n} con {count} seguidos. El relay descartó la lista anterior.",
      tablet:
        "La tablet vieja publicó la versión {n}. Es más nueva, así que lo reemplazó todo. Perdidos: {lost}.",
      tabletNoLoss:
        "La tablet vieja publicó la versión {n}. Por suerte incluye a todos los que sigues.",
      synced:
        "El teléfono descargó la lista más nueva del relay antes de editar. Ese es el hábito seguro.",
      reset: "De vuelta al inicio.",
    },
    eventTitle: "El kind 3 más nuevo que guarda el relay",
  },
  quiz: {
    q1: {
      question: "Bob sigue a Alice. ¿Dónde se guarda ese dato?",
      options: {
        a: {
          label: "En una lista de seguidores en el relay de Alice.",
          explanation:
            "Nadie guarda una lista de seguidores de Alice: los seguidores se cuentan buscando.",
        },
        b: {
          label: "Como una etiqueta p en el propio evento kind 3 firmado de Bob.",
          explanation:
            "Correcto: un seguimiento es una línea en la propia lista del seguidor, firmada por él.",
        },
        c: {
          label: "En una base de datos central de Nostr.",
          explanation: "No hay base de datos central: solo eventos firmados en relays.",
        },
      },
    },
    q2: {
      question: "Tu app quiere las notas de Carol. Según NIP-65, ¿a qué relays debe preguntar?",
      options: {
        a: {
          label: "A los relays de escritura de Carol, según su kind 10002.",
          explanation: "Sí: a un autor se le lee donde escribe (su outbox).",
        },
        b: {
          label: "A los relays de lectura de Carol.",
          explanation: "Los relays de lectura son el inbox de Carol: donde otros le envían cosas.",
        },
        c: {
          label: "Al relay que venía configurado con tu app.",
          explanation: "Esa es la trampa del relay único: quien no escriba ahí desaparece.",
        },
      },
    },
    q3: {
      question:
        "Una tablet vieja publica un kind 3 con menos seguidos que el de tu teléfono. ¿Qué pasa?",
      options: {
        a: {
          label: "El relay combina ambas listas.",
          explanation: "Los relays no combinan: un evento reemplazable se cambia entero.",
        },
        b: {
          label: "El relay lo rechaza porque es más corto.",
          explanation: "Los relays no juzgan el contenido: gana el más nuevo.",
        },
        c: {
          label: "Reemplaza la lista anterior, y los seguidos que faltan se pierden.",
          explanation: "Correcto: siempre obtén la lista más reciente antes de editarla.",
        },
      },
    },
  },
};
