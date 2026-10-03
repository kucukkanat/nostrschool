// Owner: translation agents. Must structurally match ../../en/chapters/03.ts.
import type { ch03 as en } from "../../en/chapters/03.ts";

// Field names (id, pubkey, created_at, kind, tags, content, sig) stay in English on purpose:
// they are the literal JSON keys on the wire, and the chapter prose refers to them that way.
export const ch03: typeof en = {
  title: "Anatomía de un evento",
  summary:
    "Cada publicación, cada like y cada perfil es un evento JSON firmado. Vamos a desarmar uno.",
  sampleContent: "¡Hola Nostr! Esta es mi primera nota firmada.",
  fields: {
    heading: "Los siete campos",
    select: "Explicar el campo {field}",
    flagged: "La verificación culpa a este campo",
    id: {
      label: "id",
      short: "La huella del evento: un hash SHA-256 de todo lo demás.",
      long: "Toma pubkey, created_at, kind, tags y content, ordénalos en un arreglo JSON fijo, hashea los bytes con SHA-256 y escribe el resultado de 32 bytes como 64 caracteres hexadecimales. Cambia cualquier cosa, aunque sea una letra, y el id cambia por completo. Por eso sirve a la vez como sello contra alteraciones y como nombre único.",
    },
    pubkey: {
      label: "pubkey",
      short: "Quién lo escribió: la clave pública de 32 bytes del autor.",
      long: "La clave pública secp256k1 x-only del autor, como 64 caracteres hexadecimales. Cualquiera puede comprobar la firma con ella. Las apps la muestran como npub, pero en el protocolo siempre va en hexadecimal.",
    },
    created_at: {
      label: "created_at",
      short: "Cuándo dice el autor que lo escribió (segundos Unix).",
      long: "Segundos desde el 1 de enero de 1970 (UTC). Lo elige el autor, así que es una afirmación, no una prueba. Los relays pueden rechazar eventos demasiado lejanos en el pasado o en el futuro, y los clientes ordenan los feeds según este campo.",
    },
    kind: {
      label: "kind",
      short: "Qué clase de evento es: un número del 0 al 65535.",
      long: "El kind 1 es una nota de texto corta, el 0 un perfil, el 3 una lista de seguidos, el 7 una reacción. El número también les dice a los relays cómo guardarlo: regular, reemplazable, efímero o direccionable.",
    },
    tags: {
      label: "tags",
      short: "Una lista de listas con etiqueta: enlaces a otros eventos, personas, temas.",
      long: 'Cada tag es un arreglo de strings cuyo primer elemento es su nombre. ["e", id] apunta a otro evento, ["p", pubkey] menciona a una persona, ["t", "nostr"] agrega un hashtag. Los tags de una sola letra se indexan, así que los relays pueden encontrar eventos por ellos.',
    },
    content: {
      label: "content",
      short: "La carga útil: tu texto, o datos cuyo significado depende del kind.",
      long: "En una nota kind 1 es texto plano. En otros kinds puede ser JSON (un perfil), un emoji (una reacción) o datos cifrados (un mensaje privado). Siempre es un string.",
    },
    sig: {
      label: "sig",
      short: "La firma Schnorr del autor sobre el id.",
      long: "Una firma Schnorr BIP-340 de 64 bytes sobre el id, hecha con la clave secreta del autor (128 caracteres hexadecimales). Solo quien tiene la clave puede crearla; cualquiera puede comprobarla con la pubkey.",
    },
  },
  createdAtHuman: "Escrito el {date}",
  kindUnknown: "Kind {kind} (no está en nuestra tabla)",
  tags: {
    heading: "Los tags, uno por uno",
    empty: "Este evento no tiene tags.",
    indexed: "indexado",
    indexedHint: "Tag de una sola letra: los relays pueden filtrar por él como #{name}",
    names: {
      e: "e: apunta a otro evento (respuesta, cita, raíz del hilo)",
      p: "p: menciona o notifica a una persona por su pubkey",
      a: "a: apunta a un evento direccionable (kind:pubkey:d-tag)",
      t: "t: un hashtag",
      d: "d: el identificador de un evento direccionable",
      q: "q: cita otro evento",
      r: "r: una referencia a una URL o a un relay",
      imeta: "imeta: metadatos de un archivo adjunto (url, tamaño, hash…)",
      client: "client: la app que lo publicó",
      other: "{name}: un tag personalizado; su significado depende del NIP del kind",
    },
  },
  lab: {
    title: "El laboratorio de eventos",
    description:
      "Un evento firmado por Alice. Edítalo y mira cómo se recalculan el id y la firma, o cambia de bando e intenta colar un cambio sin su clave.",
    modeLabel: "¿Quién eres?",
    modes: {
      author: "Alice (tengo la clave)",
      forger: "Un falsificador (sin clave)",
    },
    modeHint: {
      author:
        "Cada edición se vuelve a firmar automáticamente, así que el evento sigue siendo válido.",
      forger: "Tus ediciones cambian los bytes, pero no puedes crear una firma nueva.",
    },
    contentLabel: "content",
    timeLater: "created_at +1 s",
    timeEarlier: "created_at −1 s",
    tamperHeading: "Altera un byte",
    tamper: {
      content: "Cambia una letra en content",
      created_at: "Mueve created_at 1 s",
      id: "Cambia un dígito del id",
      sig: "Cambia un dígito de la sig",
    },
    resign: "Volver a firmar con la clave de Alice",
    reset: "Empezar de nuevo",
    noKey:
      "¡Buen intento! Los falsificadores no pueden volver a firmar: solo Alice tiene su clave secreta.",
    view: {
      label: "Vista",
      exploded: "Desarmado",
      json: "JSON crudo",
    },
    avalanche: {
      one: "{count} de 64 dígitos del id cambió tras tu edición",
      other: "{count} de 64 dígitos del id cambiaron tras tu edición",
    },
    avalancheIdle: "Edita algo y mira cómo se revuelve el id.",
    avalancheLabel: "dígitos del id que cambiaron",
    narration: {
      ready: "La nota de Alice está firmada y es válida.",
      edited: "Editaste el campo {field}. Recalculando el id y comprobando la firma.",
      resigned: "Firmado de nuevo con la clave de Alice. Id nuevo, firma nueva.",
      tampered: "Se cambió un byte de {field} después de firmar.",
      modeChanged: "Ahora juegas como: {mode}.",
      reset: "De vuelta a la nota original de Alice.",
    },
    mascot: {
      valid: "¡Todo bien: las cuentas cuadran!",
      invalid: "¡Ay! ¡La firma no coincide!",
    },
  },
  pipeline: {
    title: "Proceso de verificación",
    description:
      "Lo que hace todo cliente y todo relay antes de confiar en un evento: serializar, hashear, comparar el id y comprobar la firma.",
    stages: {
      serialize: {
        label: "Serializar",
        description: "Ordena [0, pubkey, created_at, kind, tags, content] como JSON compacto.",
      },
      hash: {
        label: "SHA-256",
        description: "Hashea los bytes UTF-8. El resultado es el id que el evento debería tener.",
      },
      compare: {
        label: "Comparar id",
        description: "¿El id calculado es igual al id que dice tener el evento?",
      },
      schnorr: {
        label: "Comprobar firma",
        description: "¿La firma Schnorr corresponde a este id y esta pubkey?",
      },
    },
    idMatch: "Coincide ✓",
    idMismatch: "No coincide ✗",
    sigValid: "Válida ✓",
    sigInvalid: "Inválida ✗",
    skipped: "Omitido",
  },
  verdict: {
    valid: "Válido: firmado por esta pubkey y sin alteraciones.",
    "id-mismatch":
      "Inválido: el id no es el hash de este contenido. Algo cambió después de firmar.",
    "bad-signature":
      "Inválido: el id coincide, pero la firma no se hizo con la clave de esta pubkey.",
    "invalid-pubkey": "Inválido: la pubkey no es una clave pública secp256k1 válida.",
    malformed: "Inválido: el evento no tiene la forma de un evento de Nostr.",
  },
  inspector: {
    title: "Inspector de eventos",
    description:
      "Pega el JSON de cualquier evento de Nostr. Comprobaremos su id y su firma aquí mismo, en tu navegador, y te explicaremos cada campo.",
    inputLabel: "JSON del evento",
    placeholder: '{ "id": "…", "pubkey": "…", "created_at": 1735689600, … }',
    inspect: "Inspeccionar",
    loadSample: "Cargar un ejemplo",
    loadTampered: "Cargar un ejemplo alterado",
    clear: "Borrar",
    empty: "Pega un evento arriba, o carga un ejemplo para empezar.",
    errorTitle: "Eso todavía no es un evento válido",
    errors: {
      "invalid-json": "Esto no es JSON válido: {message}",
      "not-an-object": "Un evento debe ser un objeto JSON { … }.",
      "missing-field": "Falta el campo {field}.",
      "invalid-field": "El campo {field} tiene un formato incorrecto: {message}",
      "invalid-tags": 'tags debe ser un arreglo de arreglos de strings, como [["t", "nostr"]].',
    },
    resultHeading: "Resultado",
    computedId: "Id calculado",
    claimedId: "Id declarado",
    serialized: "Serializado (lo que se hashea)",
    privacy: "Nada sale de tu navegador: la verificación se hace localmente.",
  },
};
