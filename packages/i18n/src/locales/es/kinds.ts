// Owner: translation agents. Must structurally match ../en/kinds.ts (enforced by the type).
import type { kinds as en } from "../en/kinds.ts";

// Protocol words the Spanish-speaking Nostr community uses as-is (relay, zap, kind, tag,
// gift wrap, bunker) stay in English.
export const kinds: typeof en = {
  categories: {
    regular: "Regular",
    replaceable: "Reemplazable",
    ephemeral: "Efímero",
    addressable: "Direccionable",
  },
  categoryDescriptions: {
    regular: "Los relays guardan todos.",
    replaceable: "Los relays guardan solo el más reciente de cada autor.",
    ephemeral: "Los relays los reenvían pero nunca los guardan.",
    addressable: "Los relays guardan el más reciente por autor y tag d.",
  },
  names: {
    k0: {
      name: "Metadatos de usuario",
      description: "Datos del perfil: nombre, foto, bio, lud16, nip05 (JSON en content).",
    },
    k1: { name: "Nota de texto corta", description: "Una publicación de texto, como un tuit." },
    k3: {
      name: "Lista de seguidos",
      description: "A quién sigues, como tags p. Cada nueva reemplaza a la anterior.",
    },
    k4: {
      name: "Mensaje directo cifrado",
      description:
        "DM obsoleto de NIP-04: el contenido va cifrado, pero quién habla con quién es público.",
    },
    k5: {
      name: "Solicitud de borrado",
      description: "Pide a relays y clientes que borren eventos que publicaste antes.",
    },
    k6: { name: "Repost", description: "Vuelve a compartir una nota kind 1." },
    k7: {
      name: "Reacción",
      description: "Un me gusta (+), no me gusta (-) o emoji sobre otro evento.",
    },
    k8: { name: "Entrega de insignia", description: "Otorga una insignia a una o más personas." },
    k13: {
      name: "Sello",
      description: "La capa intermedia, firmada y cifrada, de un mensaje con gift wrap.",
    },
    k14: {
      name: "Mensaje de chat",
      description: "Un mensaje privado (rumor) dentro de un gift wrap de NIP-17.",
    },
    k16: {
      name: "Repost genérico",
      description: "Vuelve a compartir cualquier evento que no sea una nota kind 1.",
    },
    k20: { name: "Imagen", description: "Una publicación centrada en una imagen." },
    k40: { name: "Creación de canal", description: "Crea un canal de chat público." },
    k42: { name: "Mensaje de canal", description: "Un mensaje en un canal de chat público." },
    k1059: {
      name: "Gift wrap",
      description: "Sobre exterior firmado por una clave desechable; oculta remitente y hora.",
    },
    k1063: {
      name: "Metadatos de archivo",
      description: "Describe un archivo: URL, hash, tipo MIME.",
    },
    k1111: {
      name: "Comentario",
      description: "Un comentario en hilo sobre cualquier evento o URL.",
    },
    k1311: {
      name: "Mensaje de chat en vivo",
      description: "Un mensaje de chat durante un evento en vivo.",
    },
    k1984: {
      name: "Denuncia",
      description: "Marca contenido o a un usuario como spam, ilegal, etc.",
    },
    k9734: {
      name: "Solicitud de zap",
      description:
        "Pide una factura al servidor Lightning de quien recibe; quien envía nunca la publica en relays.",
    },
    k9735: {
      name: "Recibo de zap",
      description: "Lo publica el servidor Lightning de quien recibe cuando se paga la factura.",
    },
    k9802: {
      name: "Destacado",
      description: "Un fragmento destacado de un artículo o página web.",
    },
    k10000: {
      name: "Lista de silenciados",
      description: "Personas, palabras e hilos que silenciaste.",
    },
    k10002: {
      name: "Lista de relays",
      description: "Dónde escribes y dónde lees: el modelo outbox.",
    },
    k10050: {
      name: "Lista de relays para DM",
      description: "Relays donde quieres recibir mensajes privados.",
    },
    k13194: {
      name: "Info de wallet",
      description: "Las capacidades de un servicio Nostr Wallet Connect.",
    },
    k22242: {
      name: "Autenticación de cliente",
      description: "Demuestra a un relay que posees una clave (AUTH).",
    },
    k23194: {
      name: "Solicitud a wallet",
      description: "Una solicitud de Nostr Wallet Connect, p. ej. paga esta factura.",
    },
    k23195: {
      name: "Respuesta de wallet",
      description: "Una respuesta de Nostr Wallet Connect.",
    },
    k24133: {
      name: "Nostr Connect",
      description: "Mensajes entre una app y un firmante remoto (bunker).",
    },
    k27235: {
      name: "Autenticación HTTP",
      description: "Firma una petición HTTP para iniciar sesión en un servicio web.",
    },
    k30000: {
      name: "Conjunto de seguidos",
      description: "Una lista de personas con nombre y categoría.",
    },
    k30008: {
      name: "Conjunto de insignias",
      description:
        "Un conjunto de insignias con nombre. El antiguo hogar de las insignias del perfil, que pasaron al kind 10008.",
    },
    k30009: {
      name: "Definición de insignia",
      description: "Define una insignia que se puede otorgar.",
    },
    k30023: {
      name: "Artículo largo",
      description: "Una entrada de blog en Markdown; editable porque es direccionable.",
    },
    k30311: {
      name: "Evento en vivo",
      description: "Una transmisión o evento en vivo con estado y participantes.",
    },
    k30402: { name: "Clasificado", description: "Algo en venta o que se busca." },
    k31922: {
      name: "Evento de calendario por fecha",
      description: "Un evento de calendario de uno o varios días completos.",
    },
    k31923: {
      name: "Evento de calendario por hora",
      description: "Un evento de calendario con hora de inicio y fin.",
    },
    k9: {
      name: "Mensaje de chat grupal",
      description: "Un mensaje en un chat grupal basado en relays (chats NIP-C7, grupos NIP-29).",
    },
    k11: { name: "Hilo", description: "La publicación inicial de un hilo de discusión tipo foro." },
    k15: {
      name: "Mensaje con archivo",
      description: "Un archivo cifrado compartido dentro de una conversación privada NIP-17.",
    },
    k17: {
      name: "Reacción a sitio web",
      description: "Una reacción a un sitio web (URL) en lugar de a un evento de Nostr.",
    },
    k21: { name: "Video", description: "Una publicación centrada en un video." },
    k41: {
      name: "Metadatos de canal",
      description: "Actualiza el nombre, la imagen o la descripción de un canal público.",
    },
    k1040: {
      name: "Atestación OpenTimestamps",
      description: "Demuestra que un evento existía en un momento dado, anclado en Bitcoin.",
    },
    k1068: {
      name: "Encuesta",
      description: "Una pregunta con opciones de respuesta que la gente puede votar.",
    },
    k1617: {
      name: "Parche de Git",
      description: "Un parche de código para un repositorio publicado sobre Nostr.",
    },
    k1985: {
      name: "Etiqueta",
      description: "Asigna una etiqueta (tema, calificación, categoría) a eventos, personas o URL.",
    },
    k7000: {
      name: "Avance de trabajo",
      description: "Actualizaciones de estado de una data-vending machine que procesa un trabajo.",
    },
    k9041: {
      name: "Meta de zaps",
      description: "Una meta de recaudación a la que suman los zaps.",
    },
    k10001: { name: "Notas fijadas", description: "Notas que fijaste arriba en tu perfil." },
    k10003: {
      name: "Marcadores",
      description: "Notas, artículos y enlaces que guardaste para después.",
    },
    k10008: {
      name: "Insignias del perfil",
      description: "Insignias que elegiste mostrar en tu perfil.",
    },
    k30024: {
      name: "Borrador de artículo largo",
      description: "Un borrador sin publicar de un artículo largo.",
    },
    k30078: {
      name: "Datos de aplicación",
      description: "Ajustes arbitrarios de cada app guardados en relays.",
    },
    k30315: {
      name: "Estado del usuario",
      description: 'Lo que estás haciendo ahora, como la música que suena o "en una reunión".',
    },
    k31989: {
      name: "Recomendación de app",
      description: "Recomienda qué app usar para un kind dado.",
    },
    k31990: {
      name: "Información de app",
      description: "Una app que anuncia qué kinds puede abrir.",
    },
    k34550: {
      name: "Definición de comunidad",
      description: "Define una comunidad moderada y sus moderadores.",
    },
  },
};
