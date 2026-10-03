// Owner: translation agents. Must structurally match ../../en/chapters/04.ts.
import type { ch04 as en } from "../../en/chapters/04.ts";

// Protocol verbs (REQ, EVENT, EOSE, OK…) and prefixes ("pow:", "duplicate:"…) stay in English:
// they are the literal strings on the wire that learners see in the raw frames.
export const ch04: typeof en = {
  title: "Los relays y el protocolo",
  summary: "Mira cómo REQ, EVENT, EOSE y compañía viajan entre clientes y relays.",
  lanes: {
    client: "Tu cliente",
    alpha: "Relay Alpha",
    beta: "Relay Beta",
    gamma: "Relay Gamma",
    delta: "Relay Delta (de pago)",
  },
  verbs: {
    REQ: "El cliente pide eventos que coincidan con unos filtros y se queda escuchando por si llegan nuevos.",
    EVENT:
      "Lleva un evento firmado: del cliente al relay al publicar, del relay al cliente al responder a un REQ.",
    EOSE: "End Of Stored Events (fin de los eventos guardados): el relay ya envió todo lo que tenía. Aún pueden llegar eventos nuevos.",
    OK: "El acuse del relay para un evento publicado: true (guardado) o false (rechazado), más un motivo.",
    CLOSE: "El cliente cierra una suscripción. La conexión sigue abierta para las demás.",
    CLOSED: "El relay termina una suscripción por su cuenta, con un motivo legible por máquinas.",
    NOTICE:
      "Un mensaje del relay legible para humanos. Los clientes normalmente solo lo registran.",
    AUTH: "El relay envía un desafío; el cliente responde con un evento firmado de kind 22242 para demostrar quién es.",
    COUNT: "Pregunta cuántos eventos coinciden, en lugar de pedirlos todos.",
    custom: "No es un mensaje de Nostr.",
  },
  theater: {
    title: "La línea, paquete a paquete",
    description:
      "Un diagrama de secuencia: tu cliente a la izquierda, los relays a la derecha. Cada flecha es un mensaje JSON en un WebSocket. Avanza paso a paso, dale a reproducir o arrastra la barra de progreso.",
    scenarioLabel: "Elige una conversación",
    legendTitle: "Tipos de paquete",
    jumpTo: "Saltar al primer paquete {verb}",
    notInScenario: "{verb} no aparece en esta conversación",
    direction: "{from} → {to}",
    rawFrame: "Mensaje en crudo tal como viaja",
    stepOf: "Paquete {n} de {total}",
    scenarios: {
      read: {
        label: "Leer un feed",
        intro:
          "Tu cliente quiere las dos notas más recientes de Alice. Pregunta a tres relays a la vez y combina las respuestas.",
        steps: {
          reqAlpha:
            'Tu cliente abre la suscripción "feed" en el Relay Alpha: las notas de Alice, las 2 más recientes.',
          reqBeta:
            "El mismo REQ al Relay Beta. Preguntar a varios relays hace que uno lento o caído no deje tu feed en blanco.",
          reqGamma:
            "Y al Relay Gamma. Los relays nunca hablan entre sí, así que es el cliente quien pregunta.",
          eventAlpha1:
            "Alpha responde con la nota más reciente de Alice, envuelta en un EVENT con el id de la suscripción.",
          eventBeta1:
            "Beta envía exactamente la misma nota. Mismo id, así que tu cliente la muestra una sola vez. Deduplicar es trabajo del cliente.",
          eventAlpha2:
            "Alpha envía la segunda nota. Tu cliente verifica cada firma por su cuenta: nunca se confía en los relays.",
          eoseAlpha:
            "EOSE de Alpha: eso es todo lo que tenía guardado. Hora de quitar el indicador de carga de Alpha.",
          eoseBeta:
            "EOSE de Beta. La suscripción sigue abierta, así que las notas nuevas seguirían llegando.",
          closedGamma:
            'Gamma se niega con CLOSED y el motivo "rate-limited:". Sin drama: ya respondieron dos relays.',
          closeAlpha:
            "Lectura terminada. Tu cliente envía CLOSE para que Alpha deje de enviar novedades.",
          closeBeta: "Y CLOSE a Beta. El WebSocket sigue abierto para el próximo REQ.",
        },
      },
      publish: {
        label: "Publicar una nota",
        intro:
          "Alice publica una nota. Su cliente envía el mismo evento firmado a tres relays para tener redundancia.",
        steps: {
          eventAlpha:
            "El cliente de Alice envía EVENT al Relay Alpha. Sin id de suscripción: esto es una publicación.",
          eventBeta:
            "El mismo evento firmado va al Relay Beta. Cualquier relay puede guardarlo; nadie puede alterarlo.",
          eventGamma:
            "Y al Relay Gamma. Más copias, más lugares donde sus seguidores pueden encontrarla.",
          okAlpha:
            "Alpha responde OK true: guardado. El OK indica el id del evento al que responde.",
          okBeta:
            'Beta dice OK true con "duplicate:". Ya tenía este evento, y eso también cuenta como éxito.',
          noticeGamma:
            "Gamma envía un NOTICE: un aviso legible para humanos. Los clientes normalmente lo registran y siguen.",
          okGamma:
            'Gamma lo rechaza: OK false, "pow:" (quiere prueba de trabajo). Dos de tres lo aceptaron, así que la nota ya está publicada.',
        },
      },
      auth: {
        label: "Iniciar sesión en un relay",
        intro:
          "Alice pide sus mensajes privados a un relay de pago. Primero el relay quiere una prueba de que es Alice (NIP-42).",
        steps: {
          reqDelta:
            "El cliente de Alice pide al Relay Delta los mensajes con gift wrap dirigidos a ella.",
          authChallenge:
            'Delta responde con AUTH y una cadena de desafío aleatoria: "demuestra quién eres".',
          closedDelta:
            'Luego CLOSED con "auth-required:". No va a entregar correo privado a desconocidos.',
          authEvent:
            "El cliente firma un evento de kind 22242 que contiene la URL del relay y el desafío, y lo envía en AUTH.",
          okAuth:
            "Delta comprueba la firma y responde OK true. Esta conexión ya tiene la sesión iniciada como Alice.",
          reqAgain: "El cliente repite el REQ en la misma conexión.",
          eventWrap:
            "Esta vez Delta envía el gift wrap. Solo la clave de Alice puede abrirlo (capítulo 8).",
          eoseDelta: "EOSE: no hay nada más guardado.",
          closeDelta:
            "CLOSE. Fíjate en que la clave secreta de Alice nunca salió de su dispositivo; solo salió una firma.",
        },
      },
    },
    notebook: {
      title: "La libreta de tu cliente",
      description:
        "Los relays solo responden. Todo lo de abajo es la contabilidad propia del cliente.",
      open: "Suscripciones abiertas",
      received: "Mensajes EVENT recibidos",
      unique: "Eventos únicos mostrados",
      accepted: "Relays que guardaron la nota",
      rejected: "Relays que la rechazaron",
      authed: "Sesión iniciada en",
      none: "ninguno",
      dedupe: "{dupes} copia duplicada ignorada",
      dedupePlural: "{dupes} copias duplicadas ignoradas",
    },
    done: {
      read: "Feed cargado desde 2 de 3 relays, con los duplicados combinados.",
      publish: "Publicado en 2 de 3 relays. Un rechazo no es ningún problema.",
      auth: "Sesión iniciada con una firma, no con una contraseña.",
    },
  },
  live: {
    title: "Mensajes reales de relays reales",
    description:
      "Envía un REQ (las 3 notas de texto más recientes) y mira cómo vuelve el JSON en crudo. Solo lectura: nunca publicamos.",
    fixtureBadge: "Relays de práctica",
    liveBadge: "EN VIVO",
    fixtureHint:
      "Estás usando relays de práctica. Activa el modo en vivo en la cabecera para hablar con relays reales.",
    liveHint: "El modo en vivo está activado: estos mensajes vienen de {relays}.",
    send: "Enviar REQ",
    stop: "Enviar CLOSE",
    clear: "Limpiar registro",
    empty: 'Aún no hay mensajes. Pulsa "Enviar REQ".',
    out: "enviado",
    in: "recibido",
    logLabel: "Mensajes del WebSocket en crudo",
    frameLabel: "{direction} {verb} {relay}",
    stats: "{frames} mensajes · {events} eventos · {eose} de {relays} relays enviaron EOSE",
    status: {
      idle: "En espera.",
      waiting: "Esperando a los relays…",
      done: "Todos los relays enviaron EOSE. Suscripción cerrada.",
      closed: "Suscripción cerrada.",
    },
    error: "{relay}: {message}",
    truncated: "… ({count} caracteres más)",
  },
  redundancy: {
    title: "No pongas todas tus notas en un solo relay",
    description:
      "Elige en qué relays se publica tu nota y luego tumba relays. ¿Pueden tus seguidores encontrarla todavía?",
    publishTo: "Publicar en {relay}",
    knockOut: "Desconectar {relay}",
    bringBack: "Volver a conectar {relay}",
    online: "en línea",
    offline: "desconectado",
    hasCopy: "tiene una copia",
    noCopy: "sin copia",
    copies: "Copias todavía accesibles: {alive} de {published}",
    safe: "Tu nota todavía se puede encontrar.",
    lost: "¡Ahora mismo tu nota es inaccesible!",
    unpublished: "Tu nota todavía no está publicada en ningún sitio.",
    chaos: "Desconectar un relay que tenga copia",
    reset: "Reiniciar",
    changed: "{relay} ahora está {state}.",
  },
};
