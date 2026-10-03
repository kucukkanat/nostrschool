// Owner: translation agents. Must structurally match ../../en/chapters/08.ts.
import type { ch08 as en } from "../../en/chapters/08.ts";

export const ch08: typeof en = {
  title: "Mensajes privados",
  summary: "Sobres dentro de sobres: cómo NIP-17 oculta quién habla con quién.",
  lab: {
    title: "El laboratorio de sobres",
    description:
      "Alice le envía a Bob el mismo mensaje de tres formas. Compara lo que puede leer un relay y luego intenta abrir cada sobre con distintas claves.",
    messageLabel: "Mensaje de Alice para Bob",
    defaultMessage: "Nos vemos en la panadería a las 9. Trae el cruasán secreto.",
    charCount: "{count} / {max} caracteres",
    schemeLabel: "¿Cómo debería enviarlo Alice?",
    schemes: {
      nip04: { name: "NIP-04", tagline: "Una postal con candado", badge: "Obsoleto" },
      nip44: {
        name: "NIP-44",
        tagline: "Un candado mucho mejor, la misma postal",
        badge: "Solo cifrado",
      },
      nip17: {
        name: "NIP-17",
        tagline: "Un sobre dentro de un sobre dentro de un sobre",
        badge: "Recomendado",
      },
    },
    resend: "Enviar de nuevo",
    resendHint:
      "Aleatoriedad nueva: nonce nuevo, marcas de tiempo nuevas y, en NIP-17, una clave desechable recién creada.",
    relayTitle: "Lo que ve el relay",
    relaySubtitle:
      "Esto es todo lo que hay por fuera del evento, legible por cualquier relay o fisgón.",
    leakSummary: {
      zero: "No se filtra nada de la conversación salvo quién la recibe.",
      one: "{count} dato de metadatos se filtra a la vista de todos.",
      other: "{count} datos de metadatos se filtran a la vista de todos.",
    },
    fields: {
      sender: "Remitente",
      recipient: "Destinatario",
      time: "Hora de envío",
      kind: "Tipo de mensaje",
      length: "Tamaño del mensaje",
      content: "Contenido",
    },
    exposure: {
      leaked: "Filtrado",
      blurred: "Difuminado",
      hidden: "Oculto",
    },
    factDetail: {
      senderLeaked: "Firmado por {name}: todo el mundo sabe quién lo escribió.",
      senderHidden:
        "Firmado por una clave aleatoria de un solo uso ({key}). Nadie puede vincularlo con {name}.",
      recipientLeaked: "La etiqueta p nombra a {name}, para que el relay pueda entregarlo.",
      timeLeaked: "Momento exacto: {time}.",
      timeBlurred: "Muestra {time}, unas {hours} h antes del momento real, a propósito.",
      kindLeaked: "Kind {kind}: grita «¡esto es un DM!».",
      kindHidden: "Por fuera es solo un kind {shown}. El kind real {truth} va sellado dentro.",
      lengthLeaked:
        "{shown} bytes de texto cifrado para un mensaje de {truth} bytes: el tamaño lo delata.",
      lengthBlurred:
        "Rellenado hasta {shown} bytes, así que un mensaje de {truth} bytes se esconde entre tamaños parecidos.",
      contentHidden: "Revuelto: {shown}",
    },
    rawToggle: "Mostrar el JSON crudo del evento",
    rawHide: "Ocultar el JSON crudo del evento",
    openTitle: "Intenta abrirlo",
    viewerLabel: "¿De quién es la clave que probamos?",
    senderName: "Alice",
    viewers: {
      bob: { name: "Bob", role: "el destinatario" },
      carol: { name: "Carol", role: "una vecina entrometida con su propia clave" },
      relay: { name: "El relay", role: "no tiene ninguna clave secreta" },
    },
    peel: "Abrir con la clave de {name}",
    peelNext: "Abrir la siguiente capa",
    reset: "Cerrarlo todo",
    layers: {
      wrap: {
        name: "Gift wrap",
        kind: "kind 1059",
        hint: "Firmado por una clave desechable, dirigido a Bob.",
      },
      seal: {
        name: "Sello",
        kind: "kind 13",
        hint: "Firmado por Alice. Sin etiquetas, sin destinatario.",
      },
      rumor: { name: "Rumor", kind: "kind 14", hint: "El mensaje de chat real. ¡Sin firmar!" },
      dm: {
        name: "DM cifrado",
        kind: "kind 4",
        hint: "Remitente, destinatario y hora van por fuera.",
      },
    },
    sealedState: "Cerrado",
    openedState: "Abierto",
    revealedMessage: "Bob lee:",
    authorCheck: "Quien firma el sello coincide con el autor del rumor: de verdad es de Alice.",
    garbageWarning:
      "NIP-04 no tiene comprobación de integridad, así que una clave equivocada puede producir basura en lugar de un error.",
    errors: {
      "no-key": "El relay no tiene clave secreta. Lo único que puede hacer es guardar y reenviar.",
      "nothing-left": "No queda nada más por abrir.",
      "decrypt-failed": "¡Clave equivocada! El candado se negó a abrirse ({detail}).",
      "invalid-layer": "Esa capa no es un evento válido ({detail}).",
      "author-mismatch": "Alerta de falsificación: quien firma el sello no es el autor del rumor.",
      "empty-message": "Escribe un mensaje para que Alice lo envíe.",
      "message-too-long": "Mantenlo por debajo de {max} caracteres.",
      crypto: "Falló el cifrado: {detail}",
    },
    narration: {
      built: "Evento {scheme} listo. {leaks}",
      opened: "{viewer} abrió la capa: {layer}.",
      readAll: "{viewer} leyó el mensaje: {message}",
      failed: "{viewer} no pudo abrir la capa: {layer}.",
      reset: "Todo vuelve a estar sellado.",
    },
    stackLabel: "Capas del sobre, de la más externa a la más interna",
  },
  padding: {
    title: "¿Puede un relay adivinar tu mensaje por su tamaño?",
    description:
      "Escribe un mensaje y mira cuántos bytes revela cada esquema. NIP-44 redondea los tamaños hacia arriba en tramos para que los mensajes cortos se parezcan.",
    inputLabel: "Mensaje de prueba",
    defaultMessage: "sí",
    real: "Mensaje real",
    nip04: "Texto cifrado NIP-04",
    nip44: "NIP-44 con relleno",
    bytes: "{count} bytes",
    bucket: "Con NIP-44, cualquier mensaje de {min} a {max} bytes ocupa exactamente esto.",
    tableCaption: "Bytes revelados para el mensaje actual",
    scheme: "Esquema",
    size: "Tamaño visible",
  },
  quiz: {
    title: "Revisa tus sobres",
    q1: {
      question: "Con NIP-17, ¿qué puede leer un relay en el gift wrap exterior?",
      a: "Quién lo envió",
      aExplain: "No: el wrap está firmado por una clave desechable aleatoria.",
      b: "La pubkey del destinatario (la etiqueta p)",
      bExplain:
        "Sí. Por eso NIP-17 pide a los relays que solo entreguen los wraps al usuario etiquetado (AUTH).",
      c: "El texto del mensaje",
      cExplain: "No: el texto está bajo dos capas de cifrado.",
    },
    q2: {
      question: "¿Por qué el rumor (kind 14) se deja sin firmar?",
      a: "Para ahorrar bytes",
      aExplain: "No es el motivo: una firma ocupa solo 64 bytes.",
      b: "Porque los relays rechazan las firmas",
      bExplain: "Los relays exigen firmas. El rumor nunca se publica por sí solo.",
      c: "Para que no se pueda demostrar que un mensaje filtrado viene del remitente",
      cExplain: "Correcto: negabilidad. El sello demuestra la autoría solo ante el destinatario.",
    },
    q3: {
      question: "¿Cuál es el principal problema de los DMs con NIP-04?",
      a: "Filtran metadatos: remitente, destinatario, hora y tamaño son públicos",
      aExplain: "Exacto. Cualquiera puede trazar quién habla con quién y cuándo.",
      b: "El texto no está cifrado en absoluto",
      bExplain: "Sí está cifrado (AES-CBC), solo que no muy bien, y nada más lo está.",
      c: "Solo un relay puede guardarlos",
      cExplain: "Cualquier relay puede guardar eventos kind 4.",
    },
  },
};
