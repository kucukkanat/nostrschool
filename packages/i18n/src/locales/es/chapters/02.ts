// Owner: translation agents. Must structurally match ../../en/chapters/02.ts.
import type { ch02 as en } from "../../en/chapters/02.ts";

// npub, nsec, bech32, relay, sats, NIP-19… stay in English: that's how the Spanish-speaking
// Nostr community writes them, and the UI shows them next to real encoded strings.
export const ch02: typeof en = {
  title: "Tu identidad es un par de claves",
  summary: "Sin cuentas ni contraseñas: eres una clave secreta y su clave pública.",
  forge: {
    title: "La forja de claves",
    description:
      "Forja un par de claves nuevo y mira cómo sus bytes en hex se reescriben como npub, un carácter bech32 a la vez.",
    generate: "Forjar un nuevo par de claves de prueba",
    demoBadge: "Clave de prueba: nunca la uses de verdad",
    sampleBadge: "Clave de ejemplo (pública a propósito)",
    secretLabel: "Clave secreta (hex)",
    publicLabel: "Clave pública (hex)",
    secretHint: "32 bytes aleatorios. Quien los conozca SE CONVIERTE en ti.",
    publicHint:
      "Se deriva de la secreta con matemáticas de secp256k1. Puedes compartirla sin miedo.",
    peek: "Ver",
    hide: "Ocultar",
    peekLabel: "Mostrar la clave secreta",
    hideLabel: "Ocultar la clave secreta",
    oneWay: "matemática de un solo sentido",
    oneWayLabel: "La clave pública se calcula a partir de la secreta; no se puede ir hacia atrás.",
    encodeHeading: "Hex → bech32, paso a paso",
    encodeTargetLabel: "¿Qué clave codificamos?",
    targetNpub: "Pública → npub",
    targetNsec: "Secreta → nsec",
    bytesHeading: "1. Bytes de datos",
    bitsHeading: "2. Los siguientes 5 bits",
    charsetHeading: "3. Buscar en el alfabeto bech32",
    outputHeading: "4. El resultado crece",
    checksumNote:
      "Los últimos 6 caracteres son una suma de verificación: con un solo error de tipeo, las apps lo notarán.",
    checksumWord: "checksum",
    wordValue: "{bits} = {value} → “{char}”",
    narrateStart: "Listo. Pulsa reproducir o avanza paso a paso para codificar la {target}.",
    narrateWord:
      "Carácter {n} de {total}: los bits {bits} valen {value}, que es “{char}” en el alfabeto bech32.",
    narrateChecksum:
      "Carácter de checksum {n} de {total}: valor {value}, que es “{char}”. Protege contra errores de tipeo.",
    narrateDone: "¡Hecho! La {target} completa es {encoded}.",
    generatedAnnounce: "Nuevo par de claves de prueba forjado.",
    skip: "Saltar al resultado",
    copyNpub: "Copiar npub",
    nsecCopyWarning:
      "No hay botón para copiar la nsec, a propósito. Los secretos se quedan donde están.",
    alphabetLabel: "Alfabeto bech32: 32 caracteres, del índice 0 al 31",
    playbackLabel: "Reproducción de la codificación",
  },
  clock: {
    title: "El reloj de un solo sentido",
    description:
      "Una versión de juguete de las matemáticas detrás de secp256k1. Elige un número secreto; el punto público es donde caes tras dar ese número de saltos de 17 en un reloj de 61 posiciones.",
    secretLabel: "Número secreto: {k}",
    sliderLabel: "Número secreto",
    hop: "Saltar hacia adelante",
    hopping: "Saltando…",
    landed: "Punto público: {p}",
    landedAnnounce: "Tras {k} saltos de {g}, caes en el punto {p}.",
    reverse: "Ahora ve hacia atrás",
    reverseHelp: "Sabiendo solo el punto {p}, un atacante tiene que probar secretos uno por uno.",
    attempts: {
      one: "Lo encontró tras {count} intento.",
      other: "Lo encontró tras {count} intentos.",
    },
    attemptsLive: "Intento {k}…",
    scale:
      "Con 61 puntos eso tarda un parpadeo. La curva real tiene unos 2²⁵⁶ ≈ 10⁷⁷ puntos: más intentos que átomos en un planeta. Por eso el secreto sigue siendo secreto.",
    chartLabel: "Un reloj de {n} posiciones con el recorrido de los saltos",
    spot: "punto {i}",
  },
  stamp: {
    title: "Firmar es un sello que solo tú puedes poner",
    description:
      "Una firma Schnorr prueba que la clave secreta de prueba aprobó exactamente este mensaje. Cambia una letra después de firmar y mira cómo falla la verificación.",
    messageLabel: "Mensaje",
    defaultMessage: "¡gm nostr! 🌅",
    sign: "Firmar con la clave de prueba",
    signatureLabel: "Firma (64 bytes, hex)",
    valid: "Válida: esta clave pública firmó exactamente este mensaje.",
    invalid: "Inválida: el mensaje cambió después de firmarlo.",
    unsigned: "Aún sin firmar.",
    signFailed: "Error al firmar: {message}",
  },
  guard: {
    title: "¿Quién recibe qué clave?",
    description: "Cuatro personas te piden algo. Decide: ¿la compartes o te niegas?",
    share: "Compartir",
    refuse: "Negarse",
    asks: "te pide tu {key}",
    requests: {
      friend: {
        who: "Tu amigo Bob",
        message: "¿Cuál es tu npub? ¡Quiero seguirte!",
      },
      support: {
        who: "“Soporte de Nostr” (DM)",
        message:
          "Tu cuenta fue marcada. Envía tu nsec en los próximos 10 minutos para verificarla.",
      },
      podcast: {
        who: "Una presentadora de pódcast",
        message:
          "¿Puedo poner tu npub en las notas del episodio para que los oyentes te encuentren?",
      },
      giveaway: {
        who: "Una app web nueva y reluciente",
        message: "¡Pega tu nsec aquí para reclamar 21.000 sats gratis!",
      },
    },
    verdicts: {
      safe: "Bien hecho.",
      danger:
        "¡Uy! Cualquiera con tu nsec puede publicar como tú, para siempre. No hay botón de reinicio.",
      overcautious:
        "Seguro, pero innecesario: tu npub está hecha para ser pública. Así es como la gente te encuentra.",
    },
    explain: {
      npub: "Una npub es tu dirección pública. Compartirla es justamente la idea.",
      nsec: "Nadie legítimo necesita nunca tu nsec. Las apps de verdad le piden la firma a un firmante.",
    },
    score: "{safe} de {total} decisiones seguras",
    allDone: "¡Perfecto! Serías una gran guardiana de claves.",
    reset: "Empezar de nuevo",
  },
  tool: {
    intro:
      "Genera claves de prueba y convierte entre hex y todos los formatos de NIP-19. Todo se ejecuta en tu navegador; no se envía nada a ningún sitio.",
    safety:
      "Nunca pegues una nsec real en ningún sitio web, tampoco en este. Usa claves de prueba para experimentar.",
    generateHeading: "Generar",
    convertTab: "Convertir",
    buildTab: "Construir un puntero",
    tabsLabel: "Modo de la herramienta de claves",
    inputLabel: "Pega hex, npub, nsec, note, nprofile, nevent o naddr",
    inputPlaceholder: "npub1… o 64 caracteres hex",
    detected: "Detectado: {type}",
    hexAmbiguous:
      "64 caracteres hex pueden ser una clave pública, un id de evento o una clave secreta. Estas son las tres lecturas:",
    asPubkey: "Como clave pública",
    asEventId: "Como id de evento",
    asSecret: "Como clave secreta",
    notOnCurve:
      "Este hex no es una coordenada x válida de secp256k1, así que no puede ser una clave pública.",
    nsecWarning:
      "Eso es una clave secreta. Si es real, considérala expuesta: acabas de pegarla en una página web.",
    relaysLabel: "Pistas de relays (una por línea, opcional)",
    typeLabel: "Tipo de puntero",
    hexLabel: {
      nprofile: "Clave pública (hex)",
      nevent: "Id del evento (hex)",
      naddr: "Clave pública del autor (hex)",
    },
    authorLabel: "Clave pública del autor (hex, opcional)",
    kindLabel: "Kind",
    kindOptional: "Kind (opcional)",
    identifierLabel: "Identificador (la etiqueta d)",
    encode: "Codificar",
    result: "Resultado",
    tlvHeading: "Registros TLV dentro",
    tlvType: "Tipo",
    tlvLength: "Longitud",
    tlvValue: "Valor",
    useSample: "Rellenar con la clave de ejemplo",
    rows: {
      "hex-pubkey": "Clave pública (hex)",
      "hex-secret": "Clave secreta (hex)",
      "hex-id": "Id del evento (hex)",
      npub: "npub",
      nsec: "nsec",
      note: "note",
      nprofile: "nprofile",
      nevent: "nevent",
      naddr: "naddr",
      coordinate: "Dirección (kind:pubkey:d)",
      identifier: "Identificador (etiqueta d)",
      kind: "Kind",
      author: "Autor",
      relay: "Pista de relay",
    },
    errors: {
      empty: "Pega algo para convertir.",
      "not-hex-or-nip19": "Eso no es ni hex de 64 caracteres ni una cadena NIP-19.",
      "invalid-hex": "El hex debe tener exactamente 64 caracteres (32 bytes).",
      "invalid-bech32": "Eso no es bech32 válido.",
      "bad-checksum": "El checksum no coincide: algún carácter se escribió mal o se cambió.",
      "unknown-prefix": "Prefijo NIP-19 desconocido.",
      "invalid-length": "Longitud de datos incorrecta para este prefijo.",
      "invalid-tlv": "Los registros TLV de dentro están mal formados.",
      "too-long": "Demasiado largo para ser una cadena NIP-19.",
      "invalid-field": "Revisa el campo resaltado.",
    },
    reveal: "Mostrar",
    conceal: "Ocultar",
  },
  quiz: {
    q1: {
      question: "¿Qué ES realmente tu identidad en Nostr?",
      options: {
        a: {
          label: "Un nombre de usuario registrado en un relay",
          explanation:
            "Los relays no son dueños de cuentas; cualquier relay puede llevar tus eventos.",
        },
        b: {
          label: "Una clave pública derivada de tu clave secreta",
          explanation: "¡Sí! Tu clave pública es tu identidad en todas partes.",
        },
        c: {
          label: "Tu dirección de correo",
          explanation: "Nostr no tiene ningún registro por correo.",
        },
      },
    },
    q2: {
      question: "¿Cuál se puede publicar sin peligro?",
      options: {
        a: {
          label: "npub1…",
          explanation: "Correcto: la npub es tu clave pública, codificada en bech32.",
        },
        b: { label: "nsec1…", explanation: "¡Nunca! La nsec es tu clave secreta." },
        c: {
          label: "La clave secreta de 64 caracteres hex",
          explanation: "Es el mismo secreto que la nsec, solo que escrito en hex.",
        },
      },
    },
    q3: {
      question: "Pierdes tu nsec y no tienes copia de seguridad. ¿Qué pasa?",
      options: {
        a: {
          label: "Haces clic en “olvidé mi contraseña” en tu relay",
          explanation: "No hay contraseña ni servidor que pueda restablecerla.",
        },
        b: {
          label: "El soporte de Nostr la recupera",
          explanation: "No existe un soporte de Nostr; nadie guarda una copia.",
        },
        c: {
          label: "Esa identidad se perdió; empiezas con un nuevo par de claves",
          explanation: "Correcto. Respalda tu clave (o usa un firmante) desde el primer día.",
        },
      },
    },
  },
};
