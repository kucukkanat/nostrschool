// Owner: translation agents. Must structurally match ../../en/chapters/11.ts.
import type { ch11 as en } from "../../en/chapters/11.ts";

export const ch11: typeof en = {
  title: "El ecosistema",
  summary: "Relays, clientes y NIPs, en cifras.",
  explorer: {
    title: "Explorador del ecosistema",
    intro: "Una captura de Nostr, contada con el propio protocolo. Elige una vista para explorar.",
    tabsLabel: "Vistas del ecosistema",
    tabs: { relays: "Relays", nips: "NIPs", growth: "Crecimiento", clients: "Clientes" },
    tour: "Vistas exploradas: {done} de {total}",
    tourDone: "¡Recorrido completo! Ya viste todo el ecosistema.",
    loadError: "No se pudo leer la captura del ecosistema: {message}",
    narration: {
      relays: "Vista Relays: {online} relays vistos en línea; {software} es el software más común.",
      nips: "Vista NIPs: {total} documentos NIP; la función más soportada por los relays es {top}.",
      growth: "Vista Crecimiento: los NIPs pasaron de {from} a {to}.",
      clients: "Vista Clientes: {count} clientes destacados en 4 plataformas.",
    },
  },
  dataAsOf: {
    label: "Datos al {date}",
    sources: "Fuentes",
    status: { ok: "actualizado", stale: "desactualizado", curated: "seleccionado a mano" },
    sourcesLabel: "De dónde salen estas cifras",
    notes: {
      nip66:
        "Eventos kind 30166 de {relays}; solo monitores anunciados, firmas verificadas, últimas {hours} h.",
      githubHead:
        "Archivos NIP, lista del README y tabla de kinds en HEAD; crecimiento según el primer commit de cada archivo.",
      curated: "Clientes destacados elegidos a mano; no es un censo exhaustivo.",
    },
    partial:
      "Datos parciales: {relays} dejó de responder antes de tiempo, así que pueden faltar algunos relays.",
    stale: "La última actualización falló; estas cifras vienen de la instantánea anterior.",
  },
  stats: {
    relays: "Relays en línea",
    relaysHint: "vistos por monitores en las últimas {hours} h",
    nips: "Documentos NIP",
    nipsHint: "{unrecommended} marcados como no recomendados",
    kinds: "Kinds documentados",
    kindsHint: "filas en la tabla del README de los NIPs",
    clients: "Clientes destacados",
    clientsHint: "elegidos a mano, no es un censo",
  },
  relays: {
    softwareTitle: "¿Qué software usan los relays?",
    softwareDescription: "Relays agrupados según el software que indican en su documento NIP-11.",
    networksTitle: "¿En qué redes están?",
    networksDescription:
      "Los relays de clearnet usan dominios normales; los de Tor e I2P ocultan su ubicación.",
    software: "Software",
    relays: "Relays",
    unknown: "no indicado",
    other: "todo lo demás",
    networks: { clearnet: "Clearnet", tor: "Tor", i2p: "I2P", loki: "Lokinet", other: "Otra" },
    paidFact:
      "{paid} relays piden un pago y {auth} exigen iniciar sesión (NIP-42 AUTH) antes de leer o escribir.",
    source: "Captura del {date} · {source}",
  },
  nips: {
    title: "¿Qué NIPs soportan los relays?",
    description: "Cada barra cuenta los relays que incluyen el NIP en su supported_nips.",
    pickLabel: "Elige un NIP para ver cuántos relays lo soportan",
    meterLabel: "Soporte de {nip}",
    meterValue: "{count} de {total} relays ({percent})",
    nip: "NIP",
    relays: "Relays",
    blurbs: {
      "01": "El protocolo básico: eventos, firmas, REQ/EVENT/EOSE.",
      "02": "Listas de seguidos (kind 3).",
      "04": "Mensajes directos cifrados al estilo antiguo, ya no recomendados.",
      "09": "Solicitudes de borrado (kind 5).",
      "11": "El documento de información del relay (nombre, límites, NIPs soportados).",
      "12": "Consultas genéricas por etiquetas, ya integradas en NIP-01.",
      "16": "Reglas de tratamiento de eventos, ya integradas en NIP-01.",
      "20": "Resultados de comandos (OK), ya integrados en NIP-01.",
      "22": "Comentarios (kind 1111).",
      "33": "Eventos reemplazables parametrizados, ya integrados en NIP-01.",
      "40": "Marcas de tiempo de expiración.",
      "42": "Autenticación de clientes ante relays (AUTH).",
      "45": "Conteo de resultados (COUNT).",
      "50": "Capacidad de búsqueda.",
      "70": "Eventos protegidos: solo el autor puede publicarlos.",
      "77": "Sincronización con Negentropy entre relays y clientes.",
      "86": "API de administración de relays.",
      fallback: "Consulta el texto del NIP para más detalles.",
    },
    openNip: "Leer {nip}",
  },
  growth: {
    title: "¿Cuántos NIPs hay a lo largo del tiempo?",
    description: "Documentos NIP acumulados en github.com/nostr-protocol/nips, por trimestre.",
    seriesLabel: "Documentos NIP",
    xLabel: "Trimestre",
    yLabel: "NIPs",
    rewindLabel: "Retroceder en el tiempo",
    rewindValue: "Al {date}: {count} NIPs",
    rewindHint: "Mueve el deslizador para viajar por la historia de Nostr.",
  },
  clients: {
    title: "Encuentra un cliente",
    description: "Apps destacadas, filtradas según dónde quieras usar Nostr.",
    platformsLabel: "Plataformas",
    focusLabel: "¿Para qué?",
    allFocus: "Cualquier cosa",
    platforms: { ios: "iOS", android: "Android", web: "Web", desktop: "Escritorio" },
    focus: {
      social: "Social",
      chat: "Chat",
      media: "Fotos y audio",
      "long-form": "Formato largo",
      live: "Transmisiones en vivo",
      commerce: "Mercado",
      apps: "Tienda de apps",
    },
    results: {
      zero: "Ningún cliente coincide. Prueba con menos filtros.",
      one: "{count} cliente coincide.",
      other: "{count} clientes coinciden.",
    },
    visit: "Visitar {name} (se abre en una pestaña nueva)",
    reset: "Quitar filtros",
    treemapTitle: "Clientes por plataforma",
    treemapDescription:
      "Cada recuadro es un cliente en una plataforma; muchas apps funcionan en varias.",
    sameKeys:
      "Mismas claves, mismas publicaciones, cualquier app: cambiar de cliente nunca te hace perder seguidores.",
  },
  quiz: {
    q1: {
      question: "¿Cómo contó este capítulo los relays que están en línea?",
      options: {
        a: {
          label: "Cada relay debe registrarse en un directorio oficial de Nostr",
          explanation:
            "No existe un directorio oficial: cualquiera puede montar un relay sin pedir permiso.",
        },
        b: {
          label:
            "Los monitores sondean los relays y publican lo que encuentran como eventos NIP-66",
          explanation:
            "¡Sí! Los eventos kind 30166 son informes de relays, firmados por monitores y que se leen como cualquier otro evento.",
        },
        c: {
          label: "Cada app le informa a una central los relays a los que se conecta",
          explanation:
            "Las apps de Nostr no reportan a ningún servidor central, así que no hay a quién informar.",
        },
      },
    },
    q2: {
      question: "Cambias de una app de Nostr a otra. ¿Qué pasa con tus seguidores?",
      options: {
        a: {
          label: "Desaparecen: empiezas de cero en la nueva app",
          explanation: "En Nostr no. Tus seguidos y publicaciones no están encerrados en una app.",
        },
        b: {
          label: "Debes pedirle a la app anterior que transfiera tu cuenta",
          explanation: "No hay ninguna cuenta que transferir: la app nunca fue su dueña.",
        },
        c: {
          label: "Nada: inicia sesión con la misma clave y todo sigue ahí",
          explanation:
            "¡Correcto! Tu identidad es tu clave, y tus publicaciones y tu lista de seguidos viven en relays.",
        },
      },
    },
    q3: {
      question: "¿Qué es un NIP?",
      options: {
        a: {
          label: "Una especificación de una función, que apps y relays eligen soportar",
          explanation:
            "Exacto. Por eso el soporte varía: cada relay lista los NIPs que implementa.",
        },
        b: {
          label: "Una mejora de pago que le compras a un relay",
          explanation:
            "Algunos relays cobran, pero un NIP es un documento público de especificación, gratis para todos.",
        },
        c: {
          label: "Una regla que toda app debe seguir o será prohibida",
          explanation: "Nadie puede prohibir una app. Más allá de NIP-01, todo NIP es opcional.",
        },
      },
    },
  },
};
