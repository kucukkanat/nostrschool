// Owner: translation agents. Must structurally match ../../en/nips/r4.ts (enforced by the type).
import type { r4 as en } from "../../en/nips/r4.ts";

export const r4: typeof en = {
  n60: {
    title: "Wallet Cashu",
    summary:
      "Guarda una wallet de ecash (Cashu) en tus relays, cifrada para ti, de modo que el mismo saldo aparece en cada app en la que inicias sesión.",
    text: {
      "how.wallet.title": "Un evento de wallet guarda las claves",
      "how.wallet.body":
        "Un evento reemplazable de kind 17375 guarda la configuración de la wallet: los mints en los que confías y una clave privada que solo sirve para recibir ecash bloqueado. Todo va cifrado con NIP-44 para ti, así que los relays solo ven texto cifrado.",
      "how.tokens.title": "Los tokens son eventos cifrados de kind 7375",
      "how.tokens.body":
        "Cada evento de kind 7375 contiene pruebas Cashu sin gastar de un mismo mint. Una prueba es un título al portador: quien tenga su secreto puede gastarla, y por eso todo el contenido va cifrado.",
      "how.spend.title": "Gastar renueva los tokens",
      "how.spend.body":
        "Para pagar 4 sats con un token de 15, tu cliente publica un token nuevo con las pruebas sobrantes e incluye el id del token viejo en `del`. El dinero nunca está en dos sitios a la vez.",
      "how.delete.title": "El token gastado se elimina",
      "how.delete.body":
        'El evento del token viejo se borra con una solicitud de eliminación NIP-09. Debe llevar un tag ["k", "7375"] para que otras apps de wallet puedan seguir los cambios de estado con un solo filtro.',
      "how.history.title": "El historial es opcional",
      "how.history.body":
        "Un evento de kind 7376 registra lo que pasó (entrada o salida, cuánto, qué tokens se crearon o destruyeron). Es para tu propio control; tu saldo sale de los eventos de token, no del historial.",
      "related.44":
        "Todo el contenido de wallet, tokens e historial va cifrado con NIP-44 para el dueño.",
      "related.09":
        "Los eventos de token gastados se eliminan con solicitudes de eliminación NIP-09 con el tag k=7375.",
      "related.61":
        "Los nutzaps llegan bloqueados a la clave privada de la wallet, y la wallet los canjea.",
      "related.40":
        "Los eventos de cotización del mint caducan a las dos semanas aproximadamente mediante un tag de expiración NIP-40.",
      "related.65":
        "Los clientes encuentran tu wallet en tus relays de kind 10019 o, si no, en tus relays NIP-65.",
      "flow.spend.label": "Gastar de un token",
      "flow.spend.explain":
        "Lo que publica un cliente cuando gastas parte de un token: un token nuevo, una eliminación y una entrada de historial.",
      "flow.spend.rollover":
        "Publica las pruebas sobrantes como un token nuevo que incluye el id viejo en `del`.",
      "flow.spend.delete": "Elimina el evento del token viejo, con el tag k=7375.",
      "flow.spend.history":
        "Opcionalmente, registra el gasto como un evento de historial de kind 7376.",
      "wallet.label": "Wallet (kind 17375)",
      "wallet.explain":
        "La wallet en sí: qué mints usas y la clave privada que puede gastar el ecash bloqueado con P2PK que te envían. Una por usuario (reemplazable).",
      "wallet.content":
        "Texto cifrado NIP-44 que cifras para tu propia pubkey. Descifrado, es una lista de pares [nombre, valor].",
      "wallet.plaintext": 'Un array JSON de pares, por ejemplo ["mint", "https://…"].',
      "wallet.privkey":
        '["privkey", hex]: una clave secreta que esta wallet usa solo para recibir nutzaps NIP-61. Nunca es tu clave de Nostr.',
      "wallet.mint": '["mint", url]: un mint Cashu que usa esta wallet. Se requiere al menos uno.',
      "wallet.example.label": "La wallet de Alice con dos mints",
      "wallet.example.explain":
        "Se descifra en un par privkey más dos pares mint. Prueba a descifrarla con la clave de demostración de Alice.",
      "token.label": "Pruebas sin gastar (kind 7375)",
      "token.explain":
        "Un paquete de ecash sin gastar de un mint. Puedes tener muchos; tu saldo es la suma de todos.",
      "token.content":
        "Texto cifrado NIP-44 que cifras para tu propia pubkey; descifrado, es un objeto JSON.",
      "token.plaintext": "{ mint, unit, proofs, del }: las pruebas y de dónde vienen.",
      "token.mint":
        "El mint que emitió estas pruebas. Las pruebas solo valen en el mint que las firmó.",
      "token.unit": "La unidad de los montos. Por defecto es sat si se omite.",
      "token.proofs": "Pruebas Cashu en el formato estándar. Cada una vale una potencia de dos.",
      "token.proof":
        "Una prueba Cashu: un id de keyset, un monto, un secreto y la firma C del mint.",
      "token.proof.id": "Id del keyset: cuál de las claves de firma del mint se usó.",
      "token.proof.amount": "Valor de esta prueba en la unidad del token.",
      "token.proof.secret":
        "El secreto que hace gastable esta prueba. Cualquiera que lo vea puede gastarla.",
      "token.proof.C":
        "La firma ciega del mint sobre el secreto, como punto de curva comprimido (33 bytes en hex).",
      "token.del":
        "Ids de los eventos de token que se consumieron para crear este. Ayuda a otros clientes a seguir el cambio.",
      "token.example.fresh.label": "Token recién emitido",
      "token.example.fresh.explain": "Dos pruebas (1 y 8 sats) del mint Alpha, sin nada eliminado.",
      "token.example.rolled.label": "Token renovado",
      "token.example.rolled.explain":
        "Tras un gasto: la prueba sobrante pasa a un evento nuevo y `del` apunta al viejo.",
      "deletion.label": "Eliminación de token (kind 5)",
      "deletion.explain":
        "Una solicitud de eliminación NIP-09 para un evento de token gastado, con el tag k adicional que exige NIP-60.",
      "deletion.content": "Motivo opcional. Normalmente vacío.",
      "deletion.tag.e": "El evento de token que se elimina.",
      "deletion.tag.e.id": "Id del evento de kind 7375 gastado.",
      "deletion.tag.k":
        "Lo exige NIP-60 para que los clientes puedan filtrar cambios de estado de la wallet.",
      "deletion.tag.k.kind": "Siempre 7375.",
      "deletion.example.label": "Eliminar un token gastado",
      "deletion.example.explain": "Borra el token viejo después de renovar sus pruebas sin gastar.",
      "history.label": "Historial de gastos (kind 7376)",
      "history.explain":
        "Un registro opcional de un cambio de saldo. Va cifrado, salvo las referencias a nutzaps canjeados.",
      "history.content": "Texto cifrado NIP-44 que cifras para ti; descifrado, una lista de tags.",
      "history.plaintext": "Un array JSON de tags: dirección, monto, unidad y referencias e.",
      "history.direction": '["direction", "in" | "out"]: si el dinero entró o salió.',
      "history.direction.in": "Dinero recibido.",
      "history.direction.out": "Dinero enviado.",
      "history.amount": '["amount", "4"]: cuánto cambió, como string.',
      "history.unit": '["unit", "sat"]: la unidad del monto. Por defecto, sat.',
      "history.e": '["e", id, relay, marker]: un evento de token que este cambio creó o destruyó.',
      "history.e.relay": 'Pista de relay. A menudo se deja vacía ("").',
      "marker.created": "Se creó un evento de token nuevo.",
      "marker.destroyed": "Un evento de token se consumió y se eliminó.",
      "marker.redeemed":
        "Se canjeó un nutzap NIP-61. Deja estos tags sin cifrar para que el remitente lo vea.",
      "history.tag.e":
        "Referencia pública a un nutzap canjeado. Solo los tags `redeemed` quedan fuera del cifrado.",
      "history.tag.e.id": "Id del evento nutzap de kind 9321 que se canjeó.",
      "history.tag.e.marker": "Siempre `redeemed` en los tags públicos.",
      "history.tag.p": "El remitente del nutzap, para que reciba aviso de que su ecash se canjeó.",
      "history.tag.p.pubkey": "Pubkey de quien envió el nutzap.",
      "history.example.label": "Alice gasta 4 sats",
      "history.example.explain":
        "Se descifra en dirección out, monto 4, una referencia a un token destruido y otra a uno creado.",
      "quote.label": "Cotización del mint (kind 7374)",
      "quote.explain":
        "Recuerda una cotización Lightning pendiente en un mint, para que cualquiera de tus apps pueda terminar la emisión cuando se pague la factura.",
      "quote.content": "Texto cifrado NIP-44 del id de la cotización, cifrado para ti.",
      "quote.plaintext": "El id de cotización que devolvió el mint.",
      "quote.tag.expiration":
        "Expiración NIP-40. Las cotizaciones no sirven tras unas dos semanas, así que los relays pueden descartarlas.",
      "quote.tag.expiration.ts":
        "Tiempo Unix a partir del cual los relays pueden borrar este evento.",
      "quote.tag.mint": "El mint donde se creó la cotización.",
      "quote.tag.mint.url": "URL del mint.",
      "quote.example.label": "Una cotización pendiente de pago",
      "quote.example.explain":
        "Caduca dos semanas después de la fecha de la demo. Las apps deberían preferir el estado local cuando puedan.",
    },
  },
  n61: {
    title: "Nutzaps",
    summary:
      "Propinas pagadas en ecash Cashu: el remitente publica ecash bloqueado a la clave del destinatario, así que el propio pago es el recibo público.",
    text: {
      "how.advertise.title": "El destinatario dice cómo pagarle",
      "how.advertise.body":
        "Bob publica un evento de kind 10019: los relays donde lee nutzaps, los mints en los que confía y la clave pública a la que debe bloquearse el ecash.",
      "how.lock.title": "El ecash se bloquea a la clave de la wallet de Bob",
      "how.lock.body":
        "El tag pubkey es la mitad pública de la clave de la wallet NIP-60 de Bob, no su clave de Nostr. El ecash bloqueado (P2PK) solo lo puede gastar quien tenga esa clave de wallet.",
      "how.send.title": "Alice publica el dinero",
      "how.send.body":
        "Alice emite ecash en uno de los mints de Bob, lo bloquea a su clave y lo publica como tags proof en un evento de kind 9321 en sus relays. Cualquiera puede verlo; solo Bob puede gastarlo.",
      "how.receive.title": "La wallet de Bob vigila los nutzaps",
      "how.receive.body":
        "El cliente de Bob se suscribe a eventos de kind 9321 que lo etiquetan con p, filtrando con #u por los mints que publicó, para no tocar nunca mints que no aprobó.",
      "how.redeem.title": "Canjear deja una marca pública",
      "how.redeem.body":
        "Tras pasar el ecash a su wallet, Bob publica un evento de kind 7376 con un tag e sin cifrar marcado `redeemed`, para que los clientes no lo reintenten y Alice vea que llegó.",
      "how.verify.title": "Cualquiera puede verificar un nutzap sin conexión",
      "how.verify.body":
        "Los observadores solo cuentan un nutzap si su mint está en el 10019 de Bob, el ecash está bloqueado a la clave que publicó y la prueba DLEQ es válida. No hace falta consultar al mint.",
      "related.60":
        "La clave privada del destinatario y los tokens canjeados viven en una wallet NIP-60.",
      "related.65": "Los eventos de canje van a los relays de lectura NIP-65 del remitente.",
      "related.57":
        "Zaps Lightning: la misma idea, pero con un recibo firmado por el servidor de wallet del destinatario.",
      "related.44":
        "El historial de canjes va cifrado con NIP-44 como el resto del historial NIP-60.",
      "flow.label": "Enviar y canjear un nutzap",
      "flow.explain": "Bob se anuncia, Alice paga, Bob canjea.",
      "flow.info":
        "El kind 10019 de Bob indica a los remitentes sus relays, mints y clave de bloqueo.",
      "flow.nutzap": "Alice publica ecash bloqueado en un evento de kind 9321.",
      "flow.redemption":
        "Bob lo pasa a su wallet y lo marca como canjeado en un evento de kind 7376.",
      "info.label": "Info de nutzaps (kind 10019)",
      "info.explain":
        "Cómo enviar ecash a este usuario: relays, mints aceptados y la clave de bloqueo P2PK.",
      "info.tag.relay":
        "Un relay donde este usuario lee los nutzaps entrantes. Los remitentes publican ahí.",
      "info.tag.relay.url": "URL del relay.",
      "info.tag.mint":
        "Un mint en el que el usuario acepta recibir. El dinero enviado en otros mints puede no canjearse nunca.",
      "info.tag.mint.url":
        "URL del mint. Los remitentes deben copiarla exacta en el tag u del nutzap.",
      "info.tag.mint.unit":
        "Unidades para las que se usa este mint (sat, usd…). Opcional, una por posición.",
      "info.tag.pubkey": "La clave pública a la que deben bloquearse los nutzaps.",
      "info.tag.pubkey.key":
        "Clave pública de la clave de wallet NIP-60, normalmente con prefijo 02 (forma comprimida). No debe ser la pubkey de Nostr.",
      "info.example.label": "Bob acepta nutzaps",
      "info.example.explain": "Dos relays, un mint en sats y la clave de bloqueo de su wallet.",
      "nutzap.label": "Nutzap (kind 9321)",
      "nutzap.explain":
        "Ecash bloqueado al destinatario y publicado en abierto. El evento es a la vez pago y recibo.",
      "nutzap.content": "Comentario opcional del remitente.",
      "nutzap.tag.proof": "Una prueba Cashu como string JSON. Repite el tag por cada prueba.",
      "nutzap.tag.proof.json":
        "Una prueba Cashu bloqueada a la clave del destinatario, con prueba DLEQ.",
      "nutzap.proof.json": "Objeto de prueba Cashu estándar.",
      "nutzap.proof.amount": "Valor de esta prueba (1, 2, 4, 8, 16…).",
      "nutzap.proof.C": "La firma del mint, como punto comprimido de 33 bytes en hex.",
      "nutzap.proof.id": "Id del keyset de la clave del mint que la firmó.",
      "nutzap.proof.secret":
        'Un secreto NUT-11: ["P2PK", {nonce, data}], donde data es la clave de bloqueo del destinatario. Ese bloqueo es lo que permite publicarlo con seguridad.',
      "nutzap.proof.dleq":
        "Prueba NUT-12 de que el mint firmó honestamente. Permite a cualquiera verificar el nutzap sin preguntar al mint.",
      "nutzap.tag.unit": "Unidad de las pruebas. Por defecto, sat.",
      "nutzap.tag.unit.value": "sat, usd, eur…",
      "nutzap.tag.u": "El mint del que vienen las pruebas.",
      "nutzap.tag.u.mint":
        "Debe coincidir exactamente con una URL de mint del kind 10019 del destinatario.",
      "nutzap.tag.e": "El evento al que se hace el nutzap, si lo hay.",
      "nutzap.tag.e.id": "Id de la nota a la que das propina.",
      "nutzap.tag.e.relay": "Dónde se puede encontrar esa nota.",
      "nutzap.tag.k": "Kind del evento que recibe el nutzap.",
      "nutzap.tag.k.kind": "Kind del evento, p. ej. 1 para una nota.",
      "nutzap.tag.p": "Quién recibe el dinero: su pubkey de Nostr.",
      "nutzap.tag.p.pubkey": "La identidad Nostr del destinatario (no su clave de wallet).",
      "nutzap.example.label": "Alice da 21 sats a una nota de Bob",
      "nutzap.example.explain":
        "Tres pruebas (16 + 4 + 1) bloqueadas a la clave de la wallet de Bob, apuntando a su nota.",
      "nutzap.example.profile.label": "Propina de 1 sat a un perfil",
      "nutzap.example.profile.explain":
        "Sin tag e: el nutzap es para Bob, no para una nota concreta.",
      "redemption.label": "Registro de canje (kind 7376)",
      "redemption.explain":
        "La entrada de historial del destinatario tras canjear un nutzap. El tag e redeemed queda público a propósito.",
      "redemption.content":
        "Texto cifrado NIP-44 para ti: la misma lista direction/amount/unit/e que el historial NIP-60.",
      "redemption.plaintext":
        "Un array JSON de tags, p. ej. direction in, amount 21 y el evento de token que creó.",
      "redemption.tag.e":
        "Puntero público al nutzap canjeado. Varios nutzaps pueden compartir un mismo registro.",
      "redemption.tag.e.id": "Id del evento de kind 9321.",
      "redemption.tag.e.relay": "Pista de relay; puede estar vacía.",
      "redemption.tag.e.marker": "Siempre `redeemed`.",
      "redemption.tag.p": "El remitente del nutzap, para que su cliente muestre que se recibió.",
      "redemption.tag.p.pubkey": "Pubkey del remitente.",
      "redemption.example.label": "Bob canjea el nutzap de Alice",
      "redemption.example.explain":
        "Se descifra en direction in, 21 sats y el token que creó. Publícalo en los relays de lectura de Alice.",
    },
  },
  n62: {
    title: "Solicitud de desaparición",
    summary:
      "Una solicitud firmada que pide a los relays borrar de forma permanente todo lo que ha publicado una clave, en relays concretos o en todos a la vez.",
    text: {
      "how.target.title": "Nombra los relays",
      "how.target.body":
        "Un evento de kind 62 incluye un tag relay por cada relay que debe olvidarte. Los clientes solo deberían enviarlo a esos relays.",
      "how.reason.title": "Añade una nota para el operador",
      "how.reason.body":
        "El contenido puede incluir un motivo o un aviso legal. En algunos lugares una solicitud así es legalmente vinculante.",
      "how.relay.title": "Qué debe hacer el relay",
      "how.relay.body":
        "El relay borra todos los eventos de esa pubkey hasta el created_at de la solicitud, incluidas las solicitudes de eliminación, y debería borrar los DMs con gift wrap dirigidos a ella. También debe negarse a aceptar esos eventos de nuevo.",
      "how.global.title": "O pídeselo a todos los relays",
      "how.global.body":
        'Con ["relay", "ALL_RELAYS"] la solicitud aplica en todas partes. Los clientes la difunden al mayor número de relays posible.',
      "how.final.title": "No se puede deshacer",
      "how.final.body":
        "Una eliminación de kind 5 de la solicitud no hace nada, y los relays de pago o privados también deben cumplirla. Después, usa una clave nueva.",
      "related.09":
        "La eliminación NIP-09 pide borrar eventos concretos; la desaparición lo borra todo, eliminaciones incluidas.",
      "related.59":
        "Los relays también deberían descartar los gift wraps (DMs) que etiquetan con p a la clave que desaparece.",
      "related.42": "Los relays pueden exigir AUTH antes de aceptar la solicitud.",
      "vanish.label": "Solicitud de desaparición (kind 62)",
      "vanish.explain":
        "Pide a los relays etiquetados que borren todo lo que esta pubkey ha publicado hasta ahora.",
      "vanish.content": "Motivo o aviso legal opcional para el operador del relay.",
      "vanish.tag.relay": "Un relay que debe borrar tus datos. Se requiere al menos un tag relay.",
      "vanish.tag.relay.target":
        "Una URL de relay (wss://…) para ese relay, o el valor literal ALL_RELAYS (en mayúsculas) para todos los relays.",
      "vanish.tag.relay.all":
        "Todos los relays, no solo los de la lista. Los relays que lo vean borran tus datos aunque no se los nombre.",
      "vanish.example.one.label": "Salir de un relay",
      "vanish.example.one.explain": "Grace solo pide al relay Gamma que la olvide.",
      "vanish.example.all.label": "Desaparecer de todas partes",
      "vanish.example.all.explain":
        "Una solicitud global con una nota legal, pensada para difundirse ampliamente.",
    },
  },
  n64: {
    title: "Ajedrez (PGN)",
    summary:
      "Las notas de kind 64 llevan partidas de ajedrez en PGN, el formato de texto plano que ya lee el software de ajedrez, para que los clientes puedan dibujar el tablero.",
    text: {
      "how.pgn.title": "El contenido es PGN",
      "how.pgn.body":
        'La partida entera va en el contenido: líneas opcionales [Header "value"], luego las jugadas en notación algebraica y al final el resultado (1-0, 0-1, 1/2-1/2 o * si no ha terminado).',
      "how.formats.title": "Estricto al salir, flexible al entrar",
      "how.formats.body":
        "Publica en el formato de exportación PGN (ordenado para máquinas), pero espera recibir de otros el formato de importación escrito a mano y analízalo con tolerancia.",
      "how.alt.title": "Ayuda a los clientes que no muestran tableros",
      "how.alt.body":
        "Un tag alt da una descripción de una línea a los clientes que no soportan el kind 64, para que muestren algo legible.",
      "how.validate.title": "Comprobar las jugadas",
      "how.validate.body":
        "Los clientes deberían comprobar que el PGN se analiza bien y que todas las jugadas son legales. Los relays pueden rechazar partidas no válidas.",
      "related.31": "El tag alt viene de NIP-31.",
      "game.label": "Partida de ajedrez (kind 64)",
      "game.explain": "Una partida de ajedrez, terminada o en curso, como texto PGN.",
      "game.content":
        "Una base de datos PGN: cabeceras entre corchetes, luego jugadas y resultado.",
      "game.tag.alt": "Descripción legible para los clientes que no muestran ajedrez.",
      "game.tag.alt.summary": 'p. ej. "Fischer vs. Spassky, 1992, tablas".',
      "game.example.opening.label": "Una jugada",
      "game.example.opening.explain":
        "El PGN útil más corto: 1. e4 y * porque la partida sigue en curso.",
      "game.example.ruy.label": "Jugadores y un comentario",
      "game.example.ruy.explain": "Dos líneas de cabecera y un {comentario} entre las jugadas.",
      "game.example.full.label": "Una partida famosa completa",
      "game.example.full.explain":
        "Fischer vs. Spassky 1992, ronda 29, con las siete cabeceras obligatorias.",
    },
  },
  n65: {
    title: "Metadatos de lista de relays",
    summary:
      "Tu lista de relays de kind 10002 indica dónde publicas y dónde lees las menciones, para que otros sepan dónde encontrarte (el modelo outbox).",
    text: {
      "how.list.title": "Haz la lista de tus relays",
      "how.list.body":
        "Un evento reemplazable de kind 10002 tiene un tag r por relay. Publicar uno nuevo reemplaza la lista anterior.",
      "how.markers.title": "Lectura, escritura o ambas",
      "how.markers.body":
        'Añade "write" para los relays donde publicas y "read" para los relays donde buscas menciones. Sin marcador significa ambas cosas.',
      "how.reading.title": "Obtener las publicaciones de alguien",
      "how.reading.body":
        "Para cargar las notas de Dave, conéctate a sus relays de escritura. Para encontrar respuestas que mencionan a Dave, usa sus relays de lectura.",
      "how.publishing.title": "Publicar",
      "how.publishing.body":
        "Envía tu evento a tus propios relays de escritura y a los relays de lectura de todas las personas que etiquetes. Envía también tu 10002 para que otros te encuentren la próxima vez.",
      "how.small.title": "Que sea corta",
      "how.small.body":
        "Entre dos y cuatro relays de cada tipo es suficiente. Cada relay extra es una conexión más para cada persona que te sigue.",
      "related.01":
        "El kind 10002 es un evento reemplazable (NIP-01): solo cuenta el más reciente.",
      "related.02":
        "Las listas de seguidos dicen quién; las listas de relays dicen dónde encontrarlos.",
      "related.51":
        "Las listas NIP-51 cubren otros conjuntos de relays, como los de búsqueda o los bloqueados.",
      "related.17":
        "Los mensajes privados usan una lista de bandeja de entrada aparte, de kind 10050.",
      "list.label": "Lista de relays (kind 10002)",
      "list.explain": "Dónde escribe este usuario y dónde lee las menciones.",
      "list.tag.r": "Un relay. Repítelo por cada relay.",
      "list.tag.r.url": "URL del relay (wss://…).",
      "list.tag.r.marker": "Opcional: read o write. Omítelo para ambas.",
      "marker.read": "Lectura: busca aquí los eventos que mencionan a este usuario.",
      "marker.write":
        "Escritura: este usuario publica aquí; obtén sus publicaciones de este relay.",
      "list.example.alice.label": "Alice: dos relays de lectura y escritura",
      "list.example.alice.explain":
        "Sin marcadores, así que Alpha y Beta se usan para leer y para escribir.",
      "list.example.dave.label": "Dave: relay de pago solo de escritura",
      "list.example.dave.explain":
        "Dave publica en su relay de pago Delta pero no lo usa como bandeja de entrada; Alpha hace ambas cosas.",
      "list.example.bob.label": "Bob: lee menciones en Gamma",
      "list.example.bob.explain": "Beta para todo, y Gamma solo para leer menciones.",
    },
  },
  n66: {
    title: "Descubrimiento de relays y monitoreo de disponibilidad",
    summary:
      "Los monitores sondean relays y publican lo que encuentran (disponibilidad, velocidad, NIPs soportados, reglas), para que los clientes descubran relays y eviten los caídos.",
    text: {
      "how.monitor.title": "Un monitor se anuncia",
      "how.monitor.body":
        "Un evento de kind 10166 dice que esta clave publica informes de relays con regularidad: con qué frecuencia, qué comprobaciones hace y sus tiempos de espera.",
      "how.probe.title": "Un informe por relay",
      "how.probe.body":
        "Por cada relay que comprueba, el monitor publica un evento direccionable de kind 30166 cuyo tag d es la URL normalizada del relay, así el informe más reciente reemplaza al anterior.",
      "how.facts.title": "Los tags describen el relay",
      "how.facts.body":
        'Tiempos de ida y vuelta, red, NIPs soportados (N), requisitos como auth o pago (R, con ! para "no requerido"), kinds aceptados y ubicación. Un valor por tag; repite tags para las listas.',
      "how.query.title": "Los clientes filtran los informes",
      "how.query.body":
        "¿Buscas un relay en Tor que soporte NIP-50? Consulta el kind 30166 con filtros #n y #N en vez de sondear tú mismo cientos de relays.",
      "how.trust.title": "No confíes en un solo monitor",
      "how.trust.body":
        "Un monitor puede equivocarse o mentir. Compara varios y nunca te niegues a conectarte a un relay solo porque no hay informe sobre él.",
      "related.11":
        "Muchos datos replican el documento NIP-11 del relay, que puede incluirse en el contenido.",
      "related.52": "El tag g es un geohash al estilo de NIP-52.",
      "related.65":
        "Los monitores también deberían publicar una lista de relays para que sus informes se puedan encontrar.",
      "related.32": "El tag l es una etiqueta NIP-32, p. ej. el idioma del relay.",
      "flow.label": "Monitorear relays",
      "flow.explain": "Un monitor se anuncia y luego publica informes de forma continua.",
      "flow.monitor": "Anuncia el calendario y las comprobaciones del monitor.",
      "flow.discovery": "Publica un informe por cada relay sondeado.",
      "discovery.label": "Informe de relay (kind 30166)",
      "discovery.explain":
        "Lo que un monitor midió sobre un relay. Se direcciona por la URL del relay.",
      "discovery.content":
        "Opcional: el documento NIP-11 del relay como string JSON. Puede ir vacío.",
      "discovery.tag.d": "El relay del que trata este informe.",
      "discovery.tag.d.relay":
        "URL normalizada del relay, o una pubkey en hex para relays sin URL.",
      "discovery.tag.rtt-open": "Cuánto tardó en abrirse una conexión.",
      "discovery.tag.rtt-read": "Cuánto tardó una lectura (de REQ a la primera respuesta).",
      "discovery.tag.rtt-write": "Cuánto tardó una escritura (de EVENT a OK).",
      "discovery.rtt.ms": "Milisegundos.",
      "discovery.tag.n": "Red en la que está el relay.",
      "discovery.tag.n.network": "clearnet, tor, i2p o loki.",
      "discovery.tag.T": "Tipo de relay en PascalCase, p. ej. PrivateInbox o PublicOutbox.",
      "discovery.tag.T.type": "Un tipo de relay en PascalCase.",
      "discovery.tag.N": "Un NIP que soporta el relay. Un tag por NIP.",
      "discovery.tag.N.nip": "Número de NIP, p. ej. 42.",
      "discovery.tag.R": "Un requisito de las limitaciones NIP-11: auth, writes, pow, payment.",
      "discovery.tag.R.requirement":
        "Nombre del requisito; antepón ! cuando NO es obligatorio (!auth).",
      "discovery.tag.t": "Un tema del relay.",
      "discovery.tag.t.topic": "Palabra del tema.",
      "discovery.tag.k": "Un kind que el relay acepta, o rechaza con el prefijo !.",
      "discovery.tag.k.kind": "Número de kind, opcionalmente con el prefijo !.",
      "discovery.tag.g": "Dónde está el relay, como geohash.",
      geohash: "Geohash, en minúsculas. Más largo = más preciso.",
      "discovery.tag.l": "Una etiqueta, p. ej. el idioma principal del relay.",
      "discovery.tag.l.label": "Valor de la etiqueta, p. ej. en.",
      "discovery.tag.l.namespace": "Espacio de nombres de la etiqueta, p. ej. ISO-639-1.",
      "discovery.example.delta.label": "Informe de un relay de pago",
      "discovery.example.delta.explain":
        "Delta exige pago y AUTH, soporta los NIPs 1/11/42/70 y rechaza los DMs de kind 4.",
      "discovery.example.nip11.label": "Informe con documento NIP-11",
      "discovery.example.nip11.explain":
        "Gamma es gratuito y abierto; su JSON NIP-11 va incluido en el contenido.",
      "monitor.label": "Anuncio de monitor (kind 10166)",
      "monitor.explain":
        "Dice que esta clave publica informes de relays periódicamente, y cómo los prueba.",
      "monitor.tag.frequency": "Cada cuánto publica informes el monitor.",
      "monitor.tag.frequency.seconds": "Segundos entre ejecuciones.",
      "monitor.tag.timeout":
        "Tiempo de espera de una comprobación. El texto del NIP y su ejemplo no coinciden en el orden; lo que publican los monitores es el del ejemplo (comprobación y luego ms).",
      "monitor.tag.timeout.check": "La comprobación a la que se aplica el tiempo de espera.",
      "monitor.tag.timeout.ms": "Tiempo de espera en milisegundos.",
      "monitor.tag.c": "Una comprobación que hace este monitor, en minúsculas.",
      "monitor.tag.c.check": "open, read, write, auth, nip11, dns, geo, ssl, ws…",
      "monitor.tag.g": "Desde dónde opera el monitor (la latencia depende de ello).",
      "monitor.example.label": "Monitor cada hora",
      "monitor.example.explain": "Dave comprueba relays cada hora con cinco tipos de pruebas.",
    },
  },
  n67: {
    title: "Pista de completitud en EOSE",
    summary:
      "Los relays pueden añadir a EOSE una pista que indica si enviaron todas las coincidencias almacenadas o si hay más, para que los clientes sepan cuándo dejar de paginar.",
    text: {
      "how.problem.title": "El problema de adivinar",
      "how.problem.body":
        "Los relays limitan los resultados (a menudo a unos cientos). Un cliente que pide 500 y recibe 300 no sabe si eso es todo o un límite, así que adivina y, o se pierde datos, o hace una petición de más.",
      "how.hint.title": "Un tercer elemento en EOSE",
      "how.hint.body":
        'El relay puede añadir un array de pistas tras el id de suscripción: ["EOSE", "sub", ["finish"]].',
      "how.finish.title": "finish, more, auth",
      "how.finish.body":
        "finish: no hay nada más almacenado, deja de paginar. more: sigue paginando con until. auth: puede haber más si haces AUTH (el relay envía antes el desafío). Pueden aparecer varias pistas juntas.",
      "how.absent.title": "Sin pista no significa nada",
      "how.absent.body":
        "Las pistas son definitivas cuando están presentes. Sin finish ni more, pagina como siempre usando until = el created_at más antiguo que recibiste.",
      "how.compat.title": "Seguro para software antiguo",
      "how.compat.body":
        "Los clientes antiguos ignoran el elemento extra y los relays antiguos siguen enviando dos elementos. Los valores de pista desconocidos deben ignorarse.",
      "related.01": "Añade un elemento opcional al mensaje EOSE de NIP-01.",
      "related.42": "La pista auth remite a la autenticación NIP-42.",
      "related.11": "Los relays que lo soportan incluyen 67 en supported_nips.",
      "flow.label": "Paginar con pistas",
      "flow.explain": "Pide, recibe los eventos almacenados, lee la pista.",
      "flow.req": "El cliente se suscribe con un filtro.",
      "flow.eose": "Tras los eventos almacenados, EOSE dice si hay más.",
      "eose.label": "EOSE con pistas",
      "eose.explain":
        "Fin de los eventos almacenados, más lo que el relay sabe sobre la completitud.",
      "eose.sub": "El id de suscripción del REQ.",
      "eose.hints": "Array opcional de strings de pista. Puede estar vacío.",
      "hint.finish": "Se enviaron todas las coincidencias almacenadas. No pagines.",
      "hint.more": "Hay más coincidencias almacenadas. Pagina para obtenerlas.",
      "hint.auth": "Puede verse más tras hacer AUTH.",
      "eose.example.finish.label": "Completo",
      "eose.example.finish.explain": "El relay envió todo lo que tiene para este filtro.",
      "eose.example.more.label": "Limitado",
      "eose.example.more.explain":
        "El relay se detuvo en su límite interno; vuelve a pedir con until.",
      "eose.example.auth.label": "Completo salvo que inicies sesión",
      "eose.example.auth.explain": "Se envió todo lo público; AUTH puede revelar más.",
      "eose.example.legacy.label": "EOSE al estilo antiguo",
      "eose.example.legacy.explain": "Sin pista: vuelve a la estimación de paginación habitual.",
      "req.label": "REQ (NIP-01)",
      "req.explain": "La suscripción a la que responde la pista. Sin cambios respecto a NIP-01.",
      "req.sub": "Id de suscripción elegido por el cliente.",
      "req.filter": "Un filtro. Ojo con el limit: el límite propio del relay puede ser menor.",
      "req.example.label": "Pedir 500 notas de Alice",
      "req.example.explain":
        "Si el relay limita a 300, solo una pista en EOSE se lo dice al cliente.",
    },
  },
  n68: {
    title: "Feeds centrados en imágenes",
    summary:
      "Las publicaciones de kind 20 giran en torno a fotos, al estilo de Instagram: imágenes alojadas en otro sitio y descritas en tags imeta, con un pie de foto como contenido.",
    text: {
      "how.host.title": "Primero sube, luego describe",
      "how.host.body":
        "Las imágenes viven en servidores de medios. Cada tag imeta describe una imagen: su URL, tipo, tamaño, hash, texto alternativo y copias de respaldo.",
      "how.post.title": "Título y pie de foto",
      "how.post.body":
        "El tag title es obligatorio. El contenido es el pie de foto. Varios tags imeta forman una publicación con varias imágenes.",
      "how.filter.title": "Tags para filtrar",
      "how.filter.body":
        "Repite el tipo de medio de cada imagen en un tag m y su hash en un tag x, para que los clientes puedan pedir a los relays solo los formatos que pueden mostrar o encontrar una imagen por hash.",
      "how.annotate.title": "Etiqueta a personas en la imagen",
      "how.annotate.body":
        'Una entrada imeta "annotate-user <pubkey>:<x>:<y>" coloca un enlace a un perfil en una posición en píxeles. Añade también un tag p por cada persona.',
      "how.video.title": "Mezclar con videos cortos",
      "how.video.body":
        "Los feeds de imágenes pueden mostrar al lado videos cortos NIP-71 de kind 22.",
      "related.92": "Los tags imeta los define NIP-92.",
      "related.94": "El hash x y otros campos imeta siguen los metadatos de archivo de NIP-94.",
      "related.71": "Los videos cortos (kind 22) pueden aparecer en el mismo feed.",
      "related.36": "content-warning para imágenes sensibles viene de NIP-36.",
      "related.B7": "Los servidores Blossom son un lugar habitual para alojar las imágenes.",
      "picture.label": "Publicación de imagen (kind 20)",
      "picture.explain":
        "Una o más imágenes mostradas como una sola publicación, con título y pie de foto.",
      "picture.content": "El pie de foto o la descripción.",
      "picture.tag.title": "Título corto de la publicación. Obligatorio.",
      "picture.tag.title.text": "Texto del título.",
      "picture.tag.imeta":
        'Una imagen: entradas "clave valor" separadas por espacios. Repítelo por cada imagen.',
      "picture.tag.imeta.url": 'La primera entrada: "url https://…" donde vive la imagen.',
      "picture.tag.imeta.entry":
        'Otra entrada "clave valor": m (tipo de medio), dim (AnxAl), x (sha256), alt, blurhash, thumbhash, fallback, annotate-user.',
      "picture.tag.content-warning":
        "Marca la publicación como sensible; los clientes la ocultan tras un clic.",
      "picture.tag.content-warning.reason": "Motivo opcional.",
      "picture.tag.p": "Una persona etiquetada en la publicación.",
      "picture.tag.p.pubkey": "Su pubkey.",
      "picture.tag.p.relay": "Pista de relay opcional.",
      "picture.tag.m": "Tipo de medio de una imagen, para que los relays filtren por formato.",
      "picture.tag.m.type": "Solo se permiten estos tipos de imagen.",
      "picture.tag.x": "SHA-256 de un archivo de imagen, para poder buscarlo por hash.",
      "picture.tag.x.hash": "sha256 del archivo en hex y minúsculas.",
      "picture.tag.t": "Hashtag.",
      "picture.tag.t.tag": "En minúsculas, sin #.",
      "picture.tag.location": "Dónde se tomó, en palabras.",
      "picture.tag.location.place": "Ciudad, región, país.",
      "picture.tag.g": "Dónde se tomó, como geohash.",
      "picture.tag.g.geohash": "Geohash en minúsculas.",
      "picture.tag.L":
        "Espacio de nombres de etiqueta, usado con l para el texto que aparece en la imagen.",
      "picture.tag.L.namespace": "p. ej. ISO-639-1.",
      "picture.tag.l": "Idioma del texto escrito en la imagen.",
      "picture.tag.l.language": "Código de idioma, p. ej. en.",
      "picture.example.single.label": "Una foto",
      "picture.example.single.explain":
        "La foto del puerto de Carol con dimensiones, blurhash, texto alternativo, una copia de respaldo y ubicación.",
      "picture.example.gallery.label": "Dos fotos, una persona etiquetada",
      "picture.example.gallery.explain":
        "Un JPEG y un WebP; el segundo marca a Bob en una posición en píxeles.",
    },
  },
  n69: {
    title: "Eventos de órdenes peer-to-peer",
    summary:
      "Un formato común para ofertas de compra y venta de bitcoin, para que las plataformas de intercambio P2P publiquen en un único libro de órdenes público en lugar de en silos separados.",
    text: {
      "how.pool.title": "Un libro de órdenes para todos",
      "how.pool.body":
        "Cada plataforma publica sus ofertas como eventos direccionables de kind 38383. Cualquier cliente puede mostrar juntas las ofertas de todas las plataformas, lo que da más liquidez a quienes operan.",
      "how.offer.title": "Qué se ofrece",
      "how.offer.body":
        "k indica compra o venta, f la moneda fiat, fa el monto en fiat (un valor, o mínimo y máximo para un rango) y pm los métodos de pago.",
      "how.price.title": "Cómo se fija el precio",
      "how.price.body":
        'amt es la cantidad en sats. 0 significa "usar el precio de mercado cuando alguien tome la orden", ajustado por el porcentaje de premium.',
      "how.status.title": "Actualizar la orden",
      "how.status.body":
        "El tag d es el id de la orden. El creador vuelve a publicarla con el mismo d a medida que cambia s: pending, in-progress, success, canceled o expired.",
      "how.trade.title": "Tomar una orden",
      "how.trade.body":
        "Tomar y liquidar el intercambio ocurre en la plataforma indicada en y (y en source). Las órdenes pending vencidas deberían marcarse como expired; expiration permite que los relays las descarten.",
      "related.01":
        "Las órdenes son eventos direccionables (kind 30000–39999), reemplazados por tag d.",
      "related.40": "El tag expiration es una indicación de borrado NIP-40 para los relays.",
      "related.52": "El geohash g ayuda a emparejar intercambios en persona.",
      "order.label": "Orden P2P (kind 38383)",
      "order.explain": "Una oferta de compra o venta de bitcoin de un creador en una plataforma.",
      "order.tag.d": "Id de la orden, único por creador.",
      "order.tag.d.value": "Cualquier id único, a menudo un UUID.",
      "order.tag.k": "Tipo de orden.",
      "order.tag.k.value": "sell o buy.",
      "order.k.sell": "El creador vende bitcoin a cambio de fiat.",
      "order.k.buy": "El creador compra bitcoin con fiat.",
      "order.tag.f": "Moneda fiat.",
      "order.tag.f.value": "Código ISO 4217, p. ej. EUR, USD, VES.",
      "order.tag.s": "Estado de la orden.",
      "order.tag.s.value": "En qué punto de su ciclo de vida está la orden.",
      "status.pending": "Abierta, esperando a que alguien la tome.",
      "status.canceled": "Retirada por el creador.",
      "status.in-progress": "Tomada; intercambio en curso.",
      "status.success": "Intercambio completado.",
      "status.expired": "Nadie la tomó antes de expires_at.",
      "order.tag.amt": "Cantidad de bitcoin.",
      "order.tag.amt.value": "Satoshis; 0 = calcular a partir del precio de mercado al tomarla.",
      "order.tag.fa":
        "Monto en fiat: una cantidad fija, o mínimo y máximo para una orden de rango.",
      "order.tag.fa.value": "El monto, o el mínimo en un rango.",
      "order.tag.fa.max": "Máximo, solo para órdenes de rango.",
      "order.tag.pm": "Métodos de pago aceptados.",
      "order.tag.pm.value": "Un método por valor, p. ej. SEPA, efectivo, en persona.",
      "order.tag.premium": "Premium sobre el precio de mercado.",
      "order.tag.premium.value": "Porcentaje; negativo para un descuento.",
      "order.tag.source": "Dónde ver o tomar la orden.",
      "order.tag.source.value": "URL en la plataforma.",
      "order.tag.rating": "La reputación del creador en la plataforma.",
      "order.tag.rating.value": "Un string JSON; cada plataforma la calcula a su manera.",
      "order.rating.json": "Resumen de valoraciones.",
      "order.rating.total_reviews": "Número de reseñas.",
      "order.rating.total_rating": "Valoración media.",
      "order.rating.last_rating": "Valoración más reciente.",
      "order.rating.max_rate": "Mejor valoración posible.",
      "order.rating.min_rate": "Peor valoración posible.",
      "order.tag.network": "Red de bitcoin.",
      "order.tag.network.value": "mainnet, testnet, signet…",
      "order.tag.layer": "Por dónde se mueve el bitcoin.",
      "order.tag.layer.value": "onchain, lightning, liquid…",
      "order.tag.name": "Nombre visible del creador.",
      "order.tag.name.value": "Nombre.",
      "order.tag.g": "Ubicación para intercambios en persona.",
      "order.tag.g.value": "Geohash.",
      "order.tag.bond": "Depósito de garantía que pagan ambas partes.",
      "order.tag.bond.value": "Monto.",
      "order.tag.expires_at": "Cuándo una orden pending debe pasar a expired.",
      "order.tag.expires_at.value": "Tiempo Unix.",
      "order.tag.expiration": "Cuándo pueden borrar el evento los relays (NIP-40).",
      "order.tag.expiration.value": "Tiempo Unix.",
      "order.tag.y": "Plataforma que creó la orden.",
      "order.tag.y.value": "Nombre de la plataforma, p. ej. mostro, lnp2pbot.",
      "order.tag.z": "Tipo de documento.",
      "order.tag.z.value": "Siempre order.",
      "order.example.sell.label": "Orden de venta por rango",
      "order.example.sell.explain":
        "Bob vende entre 20 y 100 EUR en sats a precio de mercado + 1 %, por SEPA o en persona.",
      "order.example.buy.label": "Orden de compra completada",
      "order.example.buy.explain":
        "Grace compró 50.000 sats por 50 USD en efectivo, con un 0,5 % de descuento.",
    },
  },
  n70: {
    title: "Eventos protegidos",
    summary:
      'Añadir un tag ["-"] indica a los relays que solo el autor puede publicar este evento, para que otros no lo copien a relays donde no debía estar.',
    text: {
      "how.tag.title": "Un tag de un solo carácter",
      "how.tag.body":
        'Añade ["-"] a cualquier evento. No tiene valor; su sola presencia marca el evento como protegido.',
      "how.default.title": "Los relays lo rechazan por defecto",
      "how.default.body":
        'Un relay que no implementa este NIP debe rechazar los eventos que llevan ["-"]. Solo los relays que comprueban la autoría pueden aceptarlos.',
      "how.auth.title": "Demuestra que eres el autor",
      "how.auth.body":
        "Un relay compatible pide al cliente que haga AUTH (NIP-42) y solo acepta el evento si la pubkey autenticada es igual a la pubkey del evento.",
      "how.pirates.title": "Las copias se rechazan",
      "how.pirates.body":
        "Si otra persona envía el mismo evento firmado, su pubkey de AUTH no coincide, así que el relay lo rechaza. Los reposts tampoco deben incrustar eventos protegidos.",
      "how.limits.title": "Es una petición, no DRM",
      "how.limits.body":
        "Quien pueda leer el evento puede igualmente copiar su texto a otro lugar. El tag solo impide que los relays que cooperan ayuden.",
      "related.42": "Los relays comprueban la autoría con AUTH de NIP-42.",
      "related.18": "Los reposts de eventos protegidos no deben incrustar el original.",
      "related.29": "Los grupos basados en relays suelen proteger así sus eventos.",
      "protected.label": "Evento protegido (cualquier kind)",
      "protected.explain":
        'Cualquier evento con el tag ["-"]. Solo su autor puede publicarlo en un relay.',
      "protected.content": "Lo que normalmente contenga ese kind de evento.",
      "protected.tag.dash": "Marca el evento como protegido. El tag no tiene valores.",
      "protected.example.note.label": "Nota solo para miembros",
      "protected.example.note.explain":
        "Dave publica para los miembros de su relay de pago y no quiere que se difunda.",
      "protected.example.article.label": "Artículo para suscriptores",
      "protected.example.article.explain":
        "La carta de formato largo de Frank, pensada para quedarse en el relay de sus suscriptores.",
      "actor.dave": "Cliente de Dave",
      "actor.relay": "Relay Delta",
      "actor.pirate": "Cliente de otra persona",
      "step.publish.label": 'EVENT con ["-"]',
      "step.publish.explain": "Dave publica una nota protegida antes de autenticarse.",
      "step.challenge.label": "Desafío AUTH",
      "step.challenge.explain": "El relay pide al cliente que demuestre quién es.",
      "step.rejected.label": "OK false: auth-required",
      "step.rejected.explain": "Hasta que Dave se autentique, el evento protegido se rechaza.",
      "step.authenticate.label": "AUTH con un 22242 firmado",
      "step.authenticate.explain":
        "Dave firma el desafío (NIP-42), demostrando que controla su pubkey.",
      "step.retry.label": "EVENT de nuevo",
      "step.retry.explain": "Dave reenvía el mismo evento.",
      "step.accepted.label": "OK true",
      "step.accepted.explain":
        "La pubkey autenticada coincide con el autor del evento, así que se almacena.",
      "step.republish.label": "EVENT copiado",
      "step.republish.explain": "Otra persona intenta publicar la nota firmada de Dave.",
      "step.blocked.label": "OK false",
      "step.blocked.explain":
        "Su conexión no está autenticada como Dave, así que el relay la rechaza.",
    },
  },
  n71: {
    title: "Eventos de video",
    summary:
      "Publicaciones de video dedicadas para clientes al estilo de YouTube o TikTok: horizontales (kind 21) o cortos verticales (kind 22), con cada resolución y pista de audio listada en tags imeta.",
    text: {
      "how.kinds.title": "Normal o corto",
      "how.kinds.body":
        "El kind 21 es para videos normales, en su mayoría horizontales; el kind 22, para videos cortos verticales (historias, reels). La diferencia es de presentación, no de duración.",
      "how.variants.title": "Un imeta por archivo",
      "how.variants.body":
        "Cada tag imeta describe un archivo: resolución (dim), tipo (m), URL, hash, imagen de vista previa, bitrate y duración. Los reproductores eligen la mejor variante para la pantalla y la conexión.",
      "how.fallbacks.title": "Espejos y vistas previas",
      "how.fallbacks.body":
        "Las entradas fallback son otros servidores con el mismo archivo; las entradas image son fotogramas de vista previa. url y fallback valen lo mismo. service nip96 indica a los clientes que pueden encontrar el archivo por hash en la lista de servidores del autor.",
      "how.audio.title": "Pistas de audio separadas",
      "how.audio.body":
        "Un imeta con un tipo de audio es una pista de sonido aparte, p. ej. por idioma. l marca el idioma, ov la versión original y waveform permite a los clientes dibujar el sonido.",
      "how.addressable.title": "Versiones editables",
      "how.addressable.body":
        "Los kinds 34235 y 34236 son gemelos direccionables con un tag d, así puedes corregir títulos o cambiar de alojamiento sin romper enlaces. origin registra de dónde vienen los videos importados.",
      "related.92": "Los tags imeta vienen de NIP-92.",
      "related.94": "Los campos imeta como x, m y dim siguen NIP-94.",
      "related.96": '"service nip96" apunta a los servidores de archivos NIP-96 del autor.',
      "related.68": "Los feeds de imágenes (kind 20) pueden mostrar videos cortos al lado.",
      "related.01": "Los kinds 34235/34236 son eventos direccionables (NIP-01).",
      "video.label": "Video (kind 21 / 22)",
      "video.explain":
        "Una publicación de video. El contenido es la descripción; los tags imeta llevan los archivos.",
      "video.content": "Resumen o descripción del video.",
      "video.tag.title": "Título del video. Obligatorio.",
      "video.tag.title.text": "Texto del título.",
      "video.tag.imeta":
        'Un archivo de video o audio como entradas "clave valor". Repítelo por cada resolución o pista.',
      "video.tag.imeta.entry":
        '"clave valor": url, dim, m, x, image, fallback, service, bitrate, duration, waveform, l…',
      "video.tag.published_at":
        "Cuándo se publicó el video por primera vez (útil en importaciones).",
      "video.tag.published_at.ts": "Tiempo Unix como string.",
      "video.tag.alt": "Descripción de accesibilidad.",
      "video.tag.alt.text": "Lo que muestra el video.",
      "video.tag.text-track": "Subtítulos, subtítulos para sordos o capítulos (WebVTT).",
      "video.tag.text-track.url": "Enlace al archivo WebVTT.",
      "video.tag.text-track.type": "captions, subtitles, chapters o metadata.",
      "video.tag.text-track.lang": "Código de idioma opcional.",
      "video.tag.content-warning": "Marca el video como sensible.",
      "video.tag.content-warning.reason": "Motivo opcional.",
      "video.tag.segment": "Un capítulo: inicio, fin, título y miniatura opcional.",
      "video.tag.segment.start": "Hora de inicio, HH:MM:SS.sss.",
      "video.tag.segment.end": "Hora de fin, HH:MM:SS.sss.",
      "video.tag.segment.title": "Título del capítulo.",
      "video.tag.segment.thumb": "URL de miniatura opcional.",
      "video.tag.t": "Hashtag.",
      "video.tag.t.tag": "En minúsculas, sin #.",
      "video.tag.p": "Alguien que aparece en el video.",
      "video.tag.p.pubkey": "Su pubkey.",
      "video.tag.p.relay": "Pista de relay opcional.",
      "video.tag.r": "Una página web relacionada.",
      "video.tag.r.url": "URL.",
      "video.tag.origin": "De dónde viene un video importado.",
      "video.tag.origin.platform": "Plataforma original, p. ej. peertube.",
      "video.tag.origin.id": "Id en esa plataforma.",
      "video.tag.origin.url": "URL original.",
      "video.tag.origin.meta": "Metadatos adicionales opcionales.",
      "video.tag.duration": "Duración total, como en el ejemplo direccionable.",
      "video.tag.duration.seconds": "Segundos.",
      "video.example.normal.label": "Video horizontal, dos resoluciones",
      "video.example.normal.explain":
        "El time-lapse de Erin en 1080p y 720p, una pista de comentarios en inglés y dos capítulos.",
      "video.example.short.label": "Video corto vertical",
      "video.example.short.explain": "Un clip vertical (kind 22) que etiqueta a Alice.",
      "addressable.label": "Video direccionable (kind 34235 / 34236)",
      "addressable.explain":
        "El mismo formato que 21/22, más un tag d para que el evento pueda actualizarse en su sitio.",
      "addressable.tag.d":
        "Id único de este video. Vuelve a publicar con el mismo d para actualizarlo.",
      "addressable.tag.d.id": "Cualquier string que elijas.",
      "addressable.example.label": "Episodio importado",
      "addressable.example.explain":
        "Traído desde otra plataforma, con origin y la fecha de publicación original.",
    },
  },
  n72: {
    title: "Comunidades moderadas",
    summary:
      "Comunidades al estilo de Reddit donde los moderadores aprueban las publicaciones. Ya no se recomienda: los proyectos nuevos deberían usar los grupos basados en relays de NIP-29.",
    text: {
      "how.unrecommended.title": "No recomendado: usa NIP-29",
      "how.unrecommended.body":
        'El NIP está marcado como no recomendado en el repositorio oficial con "try NIP-29 instead". Las aprobaciones con claves de moderador resultaron frágiles; NIP-29 deja que un relay haga cumplir las reglas del grupo. Se documenta aquí para que puedas leer las comunidades existentes.',
      "how.define.title": "Define la comunidad",
      "how.define.body":
        'El dueño publica un evento direccionable de kind 34550 con nombre, descripción, imagen, moderadores (tags p con "moderator") y relays preferidos.',
      "how.post.title": "Publica en ella",
      "how.post.body":
        "Las publicaciones son comentarios NIP-22 de kind 1111 cuyos tags A/P/K en mayúscula apuntan a la comunidad. En las publicaciones de primer nivel los tags en minúscula también apuntan ahí; en las respuestas apuntan al padre.",
      "how.approve.title": "Los moderadores aprueban",
      "how.approve.body":
        "Un moderador publica un kind 4550 con el tag a de la comunidad, el tag e de la publicación, el tag p del autor y el JSON completo de la publicación en el contenido, para que sobreviva aunque se pierda el original.",
      "how.display.title": "Los clientes eligen qué mostrar",
      "how.display.body":
        "Los clientes muestran las publicaciones aprobadas por los moderadores listados. Si cambian los moderadores, hay que volver a firmar las aprobaciones antiguas o las publicaciones desaparecen, una de las razones por las que NIP-29 lo reemplazó.",
      "related.29": "Reemplazo recomendado: grupos basados en relays.",
      "related.22": "Las publicaciones de comunidad son comentarios NIP-22 de kind 1111.",
      "related.09": "Los moderadores pueden retirar una aprobación con una eliminación NIP-09.",
      "related.18": "La publicación cruzada usa reposts de kind 6/16 con tags a de la comunidad.",
      "flow.label": "Ciclo de vida de una publicación en la comunidad",
      "flow.explain": "Definir, publicar, aprobar.",
      "flow.community": "El dueño define la comunidad y sus moderadores.",
      "flow.post": "Un miembro publica un comentario de kind 1111 dirigido a ella.",
      "flow.approval": "Un moderador la aprueba, incrustando la publicación.",
      "community.label": "Definición de comunidad (kind 34550)",
      "community.explain": "Nombre, descripción, moderadores y relays de una comunidad.",
      "community.content": "Normalmente vacío.",
      "community.tag.d":
        "Identificador de la comunidad; se muestra como nombre si no hay tag name.",
      "community.tag.d.id": "Id corto, p. ej. film-photography.",
      "community.tag.name": "Nombre visible.",
      "community.tag.name.text": "Nombre.",
      "community.tag.description": "De qué trata la comunidad.",
      "community.tag.description.text": "Descripción.",
      "community.tag.image": "Imagen de la comunidad.",
      "community.tag.image.url": "URL de la imagen.",
      "community.tag.image.dim": "Tamaño opcional, AnxAl.",
      "community.tag.p": "Un moderador.",
      "community.tag.p.pubkey": "Pubkey del moderador.",
      "relay-hint": "Pista de relay opcional (puede estar vacía).",
      "community.tag.p.role": "Rol, normalmente moderator.",
      "community.tag.relay": "Un relay que usa la comunidad.",
      "community.tag.relay.url": "URL del relay.",
      "community.tag.relay.marker":
        "Para qué es el relay; sin marcador = publicaciones y aprobaciones.",
      "community.marker.author": "Dónde está el perfil del dueño.",
      "community.marker.requests": "Dónde enviar y leer las solicitudes de publicación.",
      "community.marker.approvals": "Dónde enviar y leer las aprobaciones.",
      "community.example.label": "Comunidad de fotografía analógica",
      "community.example.explain": "Carol es la dueña; ella y Alice moderan.",
      "post.label": "Publicación de comunidad (kind 1111)",
      "post.explain":
        "Un comentario NIP-22 dirigido a una comunidad. Los clientes antiguos usaban kind 1 con un tag a; todavía se pueden leer, pero no crees nuevos.",
      "post.content": "El texto de la publicación.",
      "post.tag.A": "Ámbito raíz: siempre la dirección de la comunidad.",
      "post.tag.A.value": "34550:<pubkey del dueño>:<d>.",
      "post.tag.a": "Padre: la comunidad en las publicaciones de primer nivel.",
      "post.tag.a.value": "Dirección del padre.",
      "post.tag.e": "Publicación padre, en las respuestas.",
      "post.tag.e.value": "Id de la publicación a la que se responde.",
      "post.tag.P": "Autor raíz: el dueño de la comunidad.",
      "post.tag.P.value": "Pubkey del dueño.",
      "post.tag.p": "Autor del padre.",
      "post.tag.p.value": "Pubkey del autor del padre.",
      "post.tag.K": "Kind raíz: 34550.",
      "post.tag.K.value": "Siempre 34550.",
      "post.tag.k": "Kind del padre: 34550 en el primer nivel, normalmente 1111 en las respuestas.",
      "post.tag.k.value": "Número de kind.",
      "post.example.top.label": "Publicación de primer nivel",
      "post.example.top.explain":
        "Bob hace una pregunta a la comunidad; los tags en mayúscula y minúscula apuntan a ella.",
      "post.example.reply.label": "Respuesta",
      "post.example.reply.explain":
        "Carol responde; ahora los tags en minúscula apuntan a la publicación de Bob.",
      "how.legacy.title": "Los clientes antiguos publicaban kind 1",
      "how.legacy.body":
        "Antes de que existieran los comentarios de NIP-22, las publicaciones de comunidad eran notas kind 1 normales con solo un tag a en minúscula que apuntaba a la comunidad. Las nuevas deberían usar kind 1111, pero los clientes aún leen y aprueban estas publicaciones antiguas.",
      "legacy.label": "Publicación de comunidad antigua (kind 1)",
      "legacy.explain":
        "El formato obsoleto, anterior a NIP-22: una nota kind 1 etiquetada con la comunidad. Se muestra por compatibilidad; publica kind 1111 en su lugar.",
      "legacy.deprecated":
        "Formato antiguo: los clientes aún leen y aprueban publicaciones de comunidad kind 1, pero las nuevas deben ser comentarios kind 1111 con tags A, P y K.",
      "legacy.tag.a":
        "La comunidad donde se publicó la nota (a en minúscula, el único tag que llevan las publicaciones antiguas).",
      "legacy.example.label": "Publicación antigua",
      "legacy.example.explain":
        "Bob publica a la antigua: una nota kind 1 solo con el tag a de la comunidad.",
      "approval.label": "Aprobación (kind 4550)",
      "approval.explain":
        "El voto de un moderador de que una publicación pertenece a la comunidad.",
      "approval.content":
        "El evento aprobado, codificado en JSON, para conservar la versión exacta.",
      "approval.tag.a":
        "La comunidad (34550:…). Otros tags a apuntan a publicaciones direccionables aprobadas.",
      "approval.tag.a.address": "Coordenada kind:pubkey:d.",
      "approval.tag.e": "La publicación aprobada (aprueba esa versión exacta).",
      "approval.tag.e.id": "Id de la publicación.",
      "approval.tag.p": "El autor de la publicación, para que reciba aviso.",
      "approval.tag.p.pubkey": "Pubkey del autor.",
      "approval.tag.k": "Kind de la publicación aprobada, para filtrar.",
      "approval.tag.k.kind": "Número de kind.",
      "approval.example.label": "Alice aprueba la publicación de Bob",
      "approval.example.explain":
        "El contenido es la publicación real firmada de Bob; el validador comprueba su firma.",
    },
  },
  n73: {
    title: "IDs de contenido externo",
    summary:
      "Los tags i y k hacen que los eventos de Nostr apunten a cosas fuera de Nostr (libros, páginas web, podcasts, lugares, transacciones de blockchain) para que puedas encontrar todos los comentarios sobre ellas.",
    text: {
      "how.ids.title": "Nombra la cosa",
      "how.ids.body":
        "Un tag i contiene un id global con un prefijo que dice qué es: isbn:…, geo:…, podcast:guid:…, una URL simple, bitcoin:tx:…",
      "how.kinds.title": "Indica qué tipo de id es",
      "how.kinds.body":
        "Un tag k repite el tipo (isbn, web, podcast:guid…), para que los clientes puedan pedir todos los comentarios sobre libros, o todos sobre podcasts.",
      "how.normalise.title": "Escribe los ids de una sola forma",
      "how.normalise.body":
        "Todo el mundo debe escribir un id igual o los filtros fallan: ISBNs sin guiones, geohashes en minúsculas, códigos de país en mayúsculas, URLs sin el #fragmento.",
      "how.hint.title": "Enlace opcional",
      "how.hint.body": "Un segundo valor puede ser una URL donde consultar la cosa.",
      "how.query.title": "Encuentra la conversación",
      "how.query.body":
        'Consulta {"#i": ["isbn:9780765382030"]} para obtener todos los eventos sobre ese libro, desde cualquier cliente.',
      "related.22":
        "Los comentarios NIP-22 usan I/K (raíz) e i/k (padre) para comentar contenido externo.",
      "related.52": "Los ids geohash funcionan como los tags de ubicación de NIP-52.",
      "related.24": "Los ids de hashtag (#tema) se relacionan con los tags t de NIP-24.",
      "ref.label": "Evento que referencia contenido externo",
      "ref.explain":
        "Cualquier kind de evento puede llevar tags i/k. Los comentarios (kind 1111) son lo más habitual.",
      "ref.content": "Lo que normalmente contenga ese kind de evento.",
      "ref.tag.I":
        "Id externo raíz, usado por los comentarios NIP-22 (mayúscula = la cosa de la que trata el hilo).",
      "ref.tag.i": "Id de contenido externo. Repítelo para varios.",
      "ref.tag.i.id":
        "Id con prefijo: URL, isbn:, geo:, iso3166:, isan:, doi:, #tema, podcast:…guid:, <cadena>:tx: o :address:.",
      "ref.tag.i.hint": "URL opcional para consultarlo.",
      "ref.tag.K": "Tipo del id raíz, emparejado con I.",
      "ref.tag.k": "Tipo de id, emparejado con i.",
      "ref.tag.k.kind": "Qué tipo de id externo es.",
      "k.web": "La URL de una página web.",
      "k.isbn": "Un libro, por ISBN sin guiones.",
      "k.geo": "Un lugar, por geohash en minúsculas.",
      "k.iso3166": "Un país o región, ISO 3166 en mayúsculas.",
      "k.isan": "Una película, por ISAN sin la parte de versión.",
      "k.doi": "Un artículo académico, por DOI en minúsculas.",
      "k.hashtag": "Un tema de hashtag, en minúsculas.",
      "k.podcast-guid": "Un feed de podcast.",
      "k.podcast-item": "Un episodio de podcast.",
      "k.podcast-publisher": "Un editor de podcasts.",
      "k.chain-tx": "Una transacción de blockchain.",
      "k.chain-address": "Una dirección de blockchain.",
      "ref.example.book.label": "Comentario sobre un libro",
      "ref.example.book.explain":
        "Frank comenta un ISBN; I/K es la raíz, i/k el padre, con un enlace de consulta.",
      "ref.example.web.label": "Nota sobre una página web",
      "ref.example.web.explain": "Una URL normalizada con k = web.",
      "ref.example.tx.label": "Transacción y país",
      "ref.example.tx.explain":
        "Un evento puede referenciar varias cosas: una transacción de bitcoin y un país.",
    },
  },
  n75: {
    title: "Metas de zaps",
    summary:
      "Una meta de recaudación como evento de kind 9041: una cantidad objetivo y los relays donde se cuentan los zaps. Haz zap a la meta para contribuir y mira cómo se llena la barra de progreso.",
    text: {
      "how.goal.title": "Fija un objetivo",
      "how.goal.body":
        "Un evento de kind 9041 dice para qué recaudas dinero (content) y cuánto (amount, en millisats).",
      "how.relays.title": "Dónde se cuentan los zaps",
      "how.relays.body":
        "El tag relays indica adónde van los recibos de zap. Los clientes que hacen zap a la meta deben copiarlos en el tag relays de la solicitud de zap, para que todos los clientes sumen los mismos recibos.",
      "how.tally.title": "Progreso = suma de recibos",
      "how.tally.body":
        "El progreso es la suma de los recibos de zap NIP-57 de la meta en esos relays. Los recibos posteriores a closed_at no cuentan.",
      "how.split.title": "Varios beneficiarios",
      "how.split.body":
        "Los tags zap reparten las contribuciones entre pubkeys según su peso, como en el apéndice G de NIP-57.",
      "how.link.title": "Vincula una meta a otro contenido",
      "how.link.body":
        "Un evento direccionable (un artículo, una transmisión en vivo) puede mostrar una meta con un tag goal. Quienes hacen zap etiquetan entonces la meta con e en su solicitud de zap.",
      "related.57": "Las contribuciones son zaps NIP-57; los tags zap las reparten.",
      "related.23": "Los artículos de formato largo pueden vincular una meta.",
      "related.53": "Las transmisiones en vivo pueden vincular una meta.",
      "flow.label": "Recaudar dinero",
      "flow.explain": "Crea la meta y luego vincúlala desde tu contenido.",
      "flow.goal": "Erin publica la meta.",
      "flow.link": "Frank la vincula desde su artículo para que los lectores le hagan zap.",
      "goal.label": "Meta de zaps (kind 9041)",
      "goal.explain": "Un objetivo de recaudación. Haz zap a este evento para contribuir.",
      "goal.content": "Para qué es el dinero, en palabras.",
      "goal.tag.relays": "Relays donde se envían y cuentan los zaps a esta meta.",
      "goal.tag.relays.url": "URL del relay. Añade tantas como quieras en el mismo tag.",
      "goal.tag.amount": "El objetivo.",
      "goal.tag.amount.msats": "Millisats (1 sat = 1000 msats).",
      "goal.tag.closed_at": "Los zaps posteriores a este momento no cuentan.",
      "goal.tag.closed_at.ts": "Tiempo Unix.",
      "goal.tag.image": "Imagen de la meta.",
      "goal.tag.image.url": "URL de la imagen.",
      "goal.tag.summary": "Descripción corta.",
      "goal.tag.summary.text": "Una línea.",
      "goal.tag.r": "Enlace a una página web sobre la meta.",
      "goal.tag.r.url": "URL.",
      "goal.tag.a": "Enlace a un evento direccionable sobre la meta.",
      "goal.tag.a.address": "kind:pubkey:d.",
      "goal.tag.zap": "Un beneficiario que recibe una parte de las contribuciones.",
      "goal.tag.zap.pubkey": "Pubkey del beneficiario.",
      "goal.tag.zap.relay": "Dónde encontrar su perfil.",
      "goal.tag.zap.weight": "Parte relativa; cada parte es peso / suma de pesos.",
      "goal.example.simple.label": "Meta mínima",
      "goal.example.simple.explain": "Erin busca 210.000 sats, contados en dos relays.",
      "goal.example.full.label": "Meta con fecha límite y reparto",
      "goal.example.full.explain":
        "Se cierra a los 30 días; Erin recibe 3/4 y Alice 1/4 de cada zap.",
      "link.label": "Contenido que vincula una meta (kinds direccionables)",
      "link.explain":
        "Cualquier evento direccionable puede apuntar a una meta para que los lectores la financien.",
      "link.content": "Lo que normalmente contenga ese kind de evento.",
      "link.tag.goal": "La meta que apoya este contenido.",
      "link.tag.goal.id": "Id del evento de kind 9041.",
      "link.tag.goal.relay": "Pista de relay opcional.",
      "link.example.label": "Artículo con una meta",
      "link.example.explain": "La publicación de formato largo de Frank muestra la meta de Erin.",
    },
  },
  n77: {
    title: "Sincronización Negentropy",
    summary:
      "Una forma de que un cliente y un relay (o dos relays) averigüen qué eventos le faltan a cada uno intercambiando huellas compactas en lugar de listas completas de ids.",
    text: {
      "how.open.title": "Abre una sincronización",
      "how.open.body":
        "El cliente elige un filtro, reúne los eventos coincidentes que ya tiene y envía NEG-OPEN con ese filtro y un mensaje Negentropy inicial.",
      "how.ranges.title": "Huellas, no listas",
      "how.ranges.body":
        "Un mensaje es binario codificado en hex: el byte de versión 0x61 y luego rangos sobre (timestamp, id). Cada rango lleva una huella de 16 bytes de los ids que contiene, una lista explícita de ids o nada (saltar). Si las huellas coinciden, ese rango ya está sincronizado.",
      "how.reply.title": "Acota las diferencias",
      "how.reply.body":
        "El relay compara y responde con NEG-MSG: divide los rangos que difieren en otros más pequeños, o lista los ids cuando un rango es pequeño. Las dos partes se turnan hasta que todos los rangos coinciden.",
      "how.transfer.title": "Después, mueve los eventos",
      "how.transfer.body":
        "Negentropy solo le dice a cada parte qué ids le faltan. Luego el cliente descarga con REQ (por ids) y sube con EVENT, incluso mientras la sincronización continúa.",
      "how.close.title": "Cierra",
      "how.close.body":
        "El cliente envía NEG-CLOSE para que el relay libere memoria. Un NEG-ERR del relay también termina la sincronización.",
      "related.01": "Añade nuevos tipos de mensaje junto a REQ; los filtros son filtros NIP-01.",
      "related.11": "Los relays que lo soportan incluyen 77 en supported_nips.",
      "related.45": "COUNT también evita descargar eventos, pero solo los cuenta.",
      "flow.label": "Una ronda de sincronización",
      "flow.explain":
        "El cliente tiene 3 de las 4 notas del relay; tras un intercambio sabe cuál debe obtener.",
      "flow.open": "El cliente envía la huella de sus 3 ids.",
      "flow.relay": "La huella del relay es distinta; lista sus 4 ids.",
      "flow.client":
        "El cliente podría responder con ids o con un mensaje vacío; aquí ya tiene lo que necesita.",
      "flow.close": "El cliente cierra y obtiene con REQ la nota que le falta.",
      "open.label": "NEG-OPEN",
      "open.explain": "Inicia una sincronización para un filtro.",
      sub: "Id de sincronización. Espacio de nombres separado de las suscripciones REQ; reutilizar uno abierto lo reinicia.",
      "open.filter": "Filtro NIP-01: qué eventos se están conciliando.",
      "open.initial":
        "Primer mensaje Negentropy, en hex. Empieza por 61 (versión 1 del protocolo).",
      "open.example.fp.label": "Abrir con una huella",
      "open.example.fp.explain":
        "61 versión, 00 00 = rango hasta el infinito, 01 = modo huella, y luego 16 bytes de huella sobre los ids de las 3 notas del cliente.",
      "open.example.empty.label": "Abrir sin nada",
      "open.example.empty.explain":
        '6100000200: un rango hasta el infinito en modo lista de ids con cero ids. "No tengo nada; dime lo que tienes."',
      "msg-relay.label": "NEG-MSG (del relay al cliente)",
      "msg-relay.explain":
        "La respuesta del relay: el mismo formato binario, rangos divididos o listados.",
      "msg.message": "Mensaje Negentropy, en hex.",
      "msg-relay.example.label": "El relay lista sus ids",
      "msg-relay.example.explain":
        "Las huellas difieren y el conjunto es pequeño, así que el relay envía modo 02 con 04 ids. El último id es el que le falta al cliente.",
      "msg-client.label": "NEG-MSG (del cliente al relay)",
      "msg-client.explain": "El siguiente paso del cliente en el intercambio.",
      "msg-client.example.ids.label": "El cliente lista sus ids",
      "msg-client.example.ids.explain": "Modo 02 con 03 ids: lo que tiene el cliente en ese rango.",
      "msg-client.example.done.label": "No queda nada que comparar",
      "msg-client.example.done.explain":
        "Solo el byte de versión, sin rangos: todos los rangos están resueltos.",
      "err.label": "NEG-ERR",
      "err.explain":
        "El relay no puede o no quiere continuar. Después, la sincronización queda cerrada.",
      "err.reason":
        "palabra-máquina: mensaje legible, como los motivos de OK de NIP-01. blocked o closed.",
      "err.max": "Opcional: el máximo de registros que el relay está dispuesto a procesar.",
      "err.example.blocked.label": "Consulta demasiado grande",
      "err.example.blocked.explain":
        "El filtro coincidió con demasiados eventos; el relay sugiere un límite.",
      "err.example.closed.label": "Tiempo agotado",
      "err.example.closed.explain":
        "El relay descartó una sincronización inactiva para recuperar memoria.",
      "close.label": "NEG-CLOSE",
      "close.explain":
        "El cliente ha terminado; el relay puede liberar el estado de la sincronización.",
      "close.example.label": "Terminar sync-1",
      "close.example.explain": "Se envía cuando el cliente ya sabe qué obtener y qué subir.",
    },
  },
  n78: {
    title: "Datos específicos de aplicaciones",
    summary:
      "Permite a las apps guardar sus propios datos privados, como ajustes, en tus relays y en el formato que quieran, como kind 30078 (un registro por clave) o kind 78 (muchos registros).",
    text: {
      "how.private.title": "Tu relay como base de datos de la app",
      "how.private.body":
        "Las apps que no necesitan compartir datos con otras apps pueden igualmente guardarlos en Nostr: tú eliges un relay y la app lee y escribe ahí sus propios eventos.",
      "how.address.title": "Nombra el registro con d",
      "how.address.body":
        "El kind 30078 es direccionable: el tag d (a menudo el nombre de la app más un contexto) lo convierte en una clave. Publicar de nuevo con el mismo d reemplaza el valor anterior.",
      "how.anything.title": "El contenido lo decide la app",
      "how.anything.body":
        "El contenido y los demás tags pueden ser cualquier cosa: JSON, texto plano o texto cifrado. Cífralo tú mismo (NIP-44) si los relays no deben leerlo.",
      "how.many.title": "Muchos registros: kind 78",
      "how.many.body":
        "Cuando una app necesita muchos eventos del mismo tipo (un log, un historial), usa el kind 78 normal y los agrupa con un tag.",
      "how.auth.title": "Los relays deberían mantenerlo privado",
      "how.auth.body":
        "Los relays deberían exigir AUTH de NIP-42 y servir estos kinds solo a su autor. No todos lo hacen, así que no guardes secretos en texto plano.",
      "related.42": "Los relays solo deberían servir estos eventos al autor autenticado.",
      "related.44": "Cifra los valores sensibles para ti mismo con NIP-44.",
      "related.01": "30078 es direccionable (se reemplaza por d); 78 es un evento normal.",
      "data.label": "Datos de app (kind 30078)",
      "data.explain": "Un registro por tag d: ajustes, estado, configuración.",
      "data.content": "Cualquier formato que elija la app. A menudo JSON.",
      "data.tag.d": "La clave del registro: nombre de la app y contexto.",
      "data.tag.d.id": "p. ej. my-app/settings.",
      "data.example.settings.label": "Ajustes del cliente",
      "data.example.settings.explain": "Las preferencias de Alice para una app, en JSON.",
      "data.example.config.label": "Configuración remota",
      "data.example.config.explain":
        "El cliente de Dave lee los feature flags que él publica, así los usuarios reciben cambios sin actualizar.",
      "log.label": "Registros de app (kind 78)",
      "log.explain": "Eventos normales para apps que guardan muchos registros de un mismo tipo.",
      "log.content": "Cualquier formato que elija la app.",
      "log.tag.d": "Agrupa los registros del mismo tipo (cualquier tag sirve).",
      "log.tag.d.group": "Nombre del grupo.",
      "log.example.label": "Sesión de lectura",
      "log.example.explain":
        "El registro de lectura de Frank guarda cada sesión como un evento propio.",
    },
  },
};
