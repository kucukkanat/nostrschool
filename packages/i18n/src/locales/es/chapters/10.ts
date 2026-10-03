// Owner: translation agents. Must structurally match ../../en/chapters/10.ts.
import type { ch10 as en } from "../../en/chapters/10.ts";

export const ch10: typeof en = {
  title: "Firmar e iniciar sesión",
  summary: "Deja que las apps usen tu clave sin llegar a verla nunca.",
  playground: {
    title: "¿Quién puede tocar tu clave?",
    intro:
      "La misma nota, tres formas de firmarla. Elige una, pulsa firmar y observa el detector de fugas de clave: busca tu clave secreta en todo lo que recibió la app.",
    modesLabel: "¿Cómo debería obtener la app una firma?",
    modes: {
      paste: {
        label: "Pegar tu nsec",
        blurb: "La forma antigua y peligrosa: escribes tu clave secreta en el sitio web.",
      },
      nip07: {
        label: "Extensión del navegador",
        blurb: "NIP-07: una extensión firmante vive en tu navegador y firma cuando se lo piden.",
      },
      nip46: {
        label: "Bunker remoto",
        blurb:
          "NIP-46: un firmante en otro dispositivo responde a solicitudes cifradas a través de un relay.",
      },
    },
    demoNote:
      "Solo claves de demostración. Nunca pegues una nsec real en ningún sitio web, ni siquiera en este.",
    app: {
      title: "La app (algún sitio web)",
      noteLabel: "Tu nota",
      defaultNote: "¡gm! Firmado sin compartir mi clave.",
      sign: "Firmar y publicar",
      reset: "Empezar de nuevo",
      memoryTitle: "Todo lo que recibió la app",
      memoryEmpty: "Nada todavía.",
    },
    signer: {
      title: {
        paste: "Ningún firmante",
        nip07: "Extensión firmante",
        nip46: "Bunker en tu teléfono",
      },
      vault: "La clave secreta está guardada aquí",
      vaultEmpty: "La bóveda está abierta: la app tiene tu clave",
      idle: "Esperando una solicitud…",
      prompt: "Una app quiere que firmes esta nota:",
      approve: "Aprobar",
      reject: "Rechazar",
      approved: "Firmado. Solo la firma salió de esta caja.",
      rejected: "Rechazado. No se firmó nada.",
      pasteNote:
        "No hay nadie a quien preguntar: la app firma por su cuenta, porque tiene tu clave.",
    },
    wire: {
      title: "Lo que viajó",
      empty: "Todo tranquilo por ahora.",
      from: "{from} → {to}",
      endpoints: { app: "App", signer: "Firmante", relay: "Relay" },
      items: {
        pasteEvent: "Nota firmada",
        nip07Request: "window.nostr.signEvent(template)",
        nip07Approve: "Tocaste Aprobar",
        nip07Response: "Evento firmado (id, pubkey, sig)",
        nip46ConnectReq: "kind 24133 · connect cifrado",
        nip46ConnectRes: "kind 24133 · “ack” cifrado",
        nip46PubkeyReq: "kind 24133 · get_public_key cifrado",
        nip46PubkeyRes: "kind 24133 · pubkey de usuario cifrada",
        nip46SignReq: "kind 24133 · sign_event cifrado",
        nip46SignRes: "kind 24133 · evento firmado cifrado",
        publish: '["EVENT", …] al relay',
      },
      show: "Mostrar contenido",
    },
    memory: {
      nsec: "Tu clave secreta (nsec)",
      pubkey: "Tu clave pública",
      template: "Plantilla de nota sin firmar",
      signedEvent: "Nota firmada",
      clientKey: "Clave de cliente desechable (¡no es la tuya!)",
      bunkerUrl: "URL de conexión al bunker",
      rejection: "Error: el usuario rechazó la solicitud",
    },
    audit: {
      label: "Detector de fugas de clave",
      idle: "Sin revisar todavía",
      safe: "No se encontró ninguna clave secreta",
      leaked: "CLAVE SECRETA ENCONTRADA",
    },
    verdict: {
      idle: "Escribe una nota y pulsa “Firmar y publicar”.",
      awaiting: "El firmante te pide tu aprobación. Mira la caja del firmante.",
      safe: "Firmada y publicada, y la app nunca vio tu clave secreta.",
      leaked:
        "Publicada… pero ahora la app tiene tu clave secreta. Cualquier fallo, script tramposo o empleado malintencionado podría hacerse pasar por ti, para siempre.",
      rejected: "Dijiste que no, así que no se firmó nada. Así te protege el firmante.",
    },
    error: "Algo salió mal: {message}",
  },
  sequences: {
    tabsLabel: "Elige un flujo de firma",
    tabs: { nip07: "Extensión NIP-07", nip46: "Bunker NIP-46" },
    nip07: {
      title: "NIP-07: una app le pide a la extensión del navegador que firme",
      description:
        "La app habla con window.nostr, un objeto que inyecta la extensión. La clave secreta se queda dentro de la extensión; la app solo recibe la clave pública y firmas terminadas.",
      lanes: { user: "Tú", app: "App web", extension: "Extensión firmante", relay: "Relay" },
      messages: {
        getPk: {
          label: "getPublicKey()",
          narration: "La app le pregunta a la extensión: ¿quién inició sesión?",
        },
        pk: {
          label: "pubkey (hex)",
          narration:
            "La extensión responde con tu clave pública. Ese es todo el “inicio de sesión”.",
        },
        sign: {
          label: "signEvent(template)",
          narration: "Escribes una nota. La app envía la plantilla sin firmar a la extensión.",
        },
        ask: {
          label: "¿Aprobar?",
          narration: "La extensión aparece y te muestra exactamente qué se va a firmar.",
        },
        yes: {
          label: "Aprobar",
          narration: "Apruebas. La clave secreta se usa solo dentro de la extensión.",
        },
        signed: {
          label: "evento + id + sig",
          narration: "La extensión devuelve el evento firmado, con id, pubkey y sig añadidos.",
        },
        publish: {
          label: '["EVENT", …]',
          narration:
            "La app publica el evento firmado en un relay. Ninguna clave salió de la extensión.",
        },
      },
    },
    nip46: {
      title: "NIP-46: una app habla con un bunker remoto a través de un relay",
      description:
        "La app y el bunker intercambian eventos kind 24133 cifrados con NIP-44. El relay solo reenvía texto ilegible; únicamente el bunker tiene la clave secreta.",
      lanes: { user: "Tú", app: "App web", relay: "Relay", bunker: "Bunker (firmante)" },
      messages: {
        paste: {
          label: "URL bunker://",
          narration:
            "Pegas una URL de conexión bunker:// en la app: la pubkey del bunker, un relay y un secreto de un solo uso.",
        },
        connectReq: {
          label: "24133 connect",
          narration:
            "La app crea un par de claves desechable y envía una solicitud connect cifrada al relay.",
        },
        connectFwd: {
          label: "reenvío",
          narration: "El relay la reenvía. Puede ver para quién es, pero no qué dice.",
        },
        ackReq: {
          label: "24133 ack",
          narration:
            "El bunker comprueba el secreto y responde “ack”, cifrado de vuelta para la app.",
        },
        ackFwd: {
          label: "reenvío",
          narration: "El relay entrega el ack. La app y el bunker ya están emparejados.",
        },
        getPkReq: {
          label: "24133 get_public_key",
          narration: "La app pregunta para qué clave de usuario firma el bunker, de nuevo cifrado.",
        },
        getPkFwd: {
          label: "reenvío",
          narration: "El relay reenvía la pregunta al bunker.",
        },
        pkReq: {
          label: "24133 pubkey",
          narration:
            "El bunker responde con tu clave pública. Puede ser distinta de la clave del propio bunker en la URL.",
        },
        pkFwd: {
          label: "reenvío",
          narration: "El relay la entrega. Ahora la app sabe de quién es el feed que debe mostrar.",
        },
        signReq: {
          label: "24133 sign_event",
          narration: "Escribes una nota. La app envía una solicitud sign_event cifrada.",
        },
        signFwd: {
          label: "reenvío",
          narration: "El relay reenvía la solicitud sellada al bunker.",
        },
        ask: {
          label: "¿Aprobar?",
          narration: "Tu teléfono vibra: el bunker te pide que apruebes la nota.",
        },
        yes: {
          label: "Aprobar",
          narration: "Apruebas. El bunker firma con tu clave, que nunca sale de él.",
        },
        signedReq: {
          label: "24133 resultado",
          narration: "El bunker cifra el evento firmado y lo envía de vuelta.",
        },
        signedFwd: {
          label: "reenvío",
          narration: "El relay entrega el resultado; la app descifra el evento firmado.",
        },
        publish: {
          label: '["EVENT", …]',
          narration: "La app publica tu nota firmada como cualquier otro evento.",
        },
      },
    },
  },
  nip05: {
    title: "¿De verdad es alice@alpha.example?",
    intro:
      "El perfil de Alice (kind 0) dice tener un nombre NIP-05. Tu app lo comprueba preguntándole al dominio. Elige una afirmación, o escribe la tuya, y verifica.",
    scenariosLabel: "Prueba una afirmación",
    scenarios: {
      match: "Afirmación honesta",
      root: "Solo dominio (_@)",
      impostor: "Nombre prestado",
      missing: "Nombre desconocido",
      nodomain: "Dominio caído",
      garbage: "No es una dirección",
    },
    inputLabel: "Campo nip05 en el perfil de Alice",
    verify: "Verificar",
    claimedKey: "Pubkey de Alice: {pubkey}",
    pipelineTitle: "Pasos de verificación NIP-05",
    pipelineDescription:
      "Analiza la dirección, construye la URL well-known, descarga nostr.json del dominio y compara la pubkey listada con la pubkey del perfil.",
    stages: {
      parse: {
        label: "Analizar nombre@dominio",
        description: "Separa por la @; un dominio solo significa _@dominio.",
      },
      url: {
        label: "Construir la URL",
        description: "https://dominio/.well-known/nostr.json?name=…",
      },
      fetch: {
        label: "Preguntar al dominio",
        description: "Descarga nostr.json (demo: desde un internet de mentira).",
      },
      compare: {
        label: "Comparar pubkeys",
        description: "names[nombre] debe ser igual a la pubkey del perfil (hex).",
      },
    },
    documentTitle: "Lo que respondió el dominio (nostr.json)",
    results: {
      ok: "✓ Verificado: {display} respalda esta clave.",
      "invalid-format": "✗ Eso no es una dirección nombre@dominio.",
      "fetch-failed": "✗ El dominio no respondió, así que no se puede comprobar la afirmación.",
      "name-not-found": "✗ El dominio no tiene ese nombre en su lista.",
      "pubkey-mismatch":
        "✗ El dominio tiene otra clave para ese nombre. ¡Alguien lo está tomando prestado!",
      "invalid-document": "✗ El nostr.json del dominio está mal formado.",
    },
  },
  quiz: {
    q1: {
      question: "Con una extensión NIP-07, ¿qué recibe realmente la app web?",
      options: {
        a: {
          label: "Tu nsec, cifrada",
          explanation: "No: la clave secreta nunca sale de la extensión, ni siquiera cifrada.",
        },
        b: {
          label: "Tu clave pública y firmas terminadas",
          explanation:
            "¡Correcto! La app obtiene los resultados de getPublicKey() y signEvent(), nada más.",
        },
        c: {
          label: "Una contraseña para iniciar sesión",
          explanation:
            "Nostr no tiene contraseñas. Iniciar sesión = demostrar que controlas una clave.",
        },
      },
    },
    q2: {
      question: "En NIP-46, ¿qué puede leer el relay que está en medio?",
      options: {
        a: {
          label: "Todo, incluida tu clave secreta",
          explanation: "No: la clave se queda en el bunker y el contenido va cifrado con NIP-44.",
        },
        b: {
          label: "La nota que firmas, pero no la clave",
          explanation: "Casi, pero incluso la nota va dentro del contenido cifrado del kind 24133.",
        },
        c: {
          label: "Solo quién habla con quién (la etiqueta p), no el contenido",
          explanation:
            "¡Correcto! El relay ve pubkeys y marcas de tiempo; las solicitudes van cifradas.",
        },
      },
    },
    q3: {
      question: "¿Qué demuestra una dirección NIP-05 verificada como alice@alpha.example?",
      options: {
        a: {
          label: "Que alpha.example lista esta pubkey bajo el nombre alice",
          explanation:
            "Exacto. Es el dominio respaldando una clave: útil, pero tu identidad sigue siendo la clave.",
        },
        b: {
          label: "Que Alice es una persona real verificada por el gobierno",
          explanation: "No: cualquiera que tenga un dominio puede listar el nombre que quiera.",
        },
        c: {
          label: "Que la clave secreta de Alice está guardada en alpha.example",
          explanation: "No: nostr.json solo contiene claves públicas (y relays opcionales).",
        },
      },
    },
  },
};
