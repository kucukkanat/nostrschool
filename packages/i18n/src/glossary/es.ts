// Owner: translation agents. Must define every GlossaryId (enforced by the type).
// Mirrors ./en.ts: same seeAlso/nips. Protocol words that Spanish-speaking Nostr users keep in
// English (relay, kind, zap, npub…) stay in English so the glossary matches what people see in apps.
import type { Glossary } from "./ids.ts";

/** `long` is plain text with blank lines between paragraphs. */
const paras = (...ps: readonly string[]): string => ps.join("\n\n");

export const glossaryEs: Glossary = {
  nostr: {
    term: "Nostr",
    short:
      "Un protocolo abierto para apps sociales: las personas firman mensajes con sus propias claves y los publican en cualquier número de relays independientes.",
    long: paras(
      'Nostr significa "Notes and Other Stuff Transmitted by Relays" (notas y otras cosas transmitidas por relays). No hay servidor central ni cuenta que crear: tu identidad es un par de claves, cada mensaje es un evento firmado y los relays son servidores sencillos que guardan y reenvían eventos.',
      "Como los eventos están firmados, cualquiera puede verificar quién los escribió, sin importar qué relay los entregó. Si un relay te bloquea, publicas en otro y tus seguidores te siguen encontrando.",
    ),
    seeAlso: ["relay", "client", "event", "keypair", "censorship-resistance"],
    nips: ["01"],
  },
  relay: {
    term: "Relay",
    short:
      "Un servidor que acepta eventos de los clientes, los guarda y los envía a quien se suscriba con un filtro que coincida.",
    long: paras(
      "Los relays hablan un protocolo diminuto sobre WebSocket (NIP-01): los clientes envían EVENT para publicar, REQ para suscribirse y CLOSE para parar; los relays responden con EVENT, OK, EOSE, CLOSED y NOTICE.",
      "Los relays no hablan entre sí y no son dueños de tu identidad. Cada uno pone sus propias reglas: algunos son gratuitos y abiertos, otros de pago, otros exigen autenticación, y cualquiera puede descartar eventos que no quiera. Los clientes suelen leer y escribir en varios relays a la vez.",
    ),
    seeAlso: ["client", "websocket", "subscription", "filter", "paid-relay", "outbox-model"],
    nips: ["01", "11", "42"],
  },
  client: {
    term: "Cliente",
    short:
      "La app que usas (web, móvil o de escritorio) para crear, firmar, publicar y leer eventos de Nostr.",
    long: paras(
      "Un cliente guarda tu firmante o habla con él, se conecta a relays, envía suscripciones y muestra los eventos que recibe. Toda la inteligencia vive aquí: elegir relays, construir timelines, verificar firmas, contar reacciones.",
      "Como tu identidad es solo un par de claves y tus datos están en relays, puedes cambiar de cliente cuando quieras y llevarte tus seguidores y publicaciones.",
    ),
    seeAlso: ["relay", "signer", "nostr"],
    nips: ["01"],
  },
  event: {
    term: "Evento",
    short:
      "El único tipo de dato de Nostr: un objeto JSON firmado con id, pubkey, created_at, kind, tags, content y sig.",
    long: paras(
      "Publicaciones, perfiles, reacciones, listas de seguidos, recibos de zap y mensajes: todo son eventos. El número de kind dice qué significa un evento; los tags añaden referencias estructuradas; content guarda el texto.",
      "El id es el hash SHA-256 de una serialización canónica, [0, pubkey, created_at, kind, tags, content], y sig es una firma Schnorr de ese id hecha con la clave privada del autor. Cambia un solo byte y la verificación falla.",
    ),
    seeAlso: ["event-id", "kind", "tag", "signature", "nip01"],
    nips: ["01"],
  },
  kind: {
    term: "Kind",
    short:
      "Un número entero en cada evento que dice qué es: 0 son los metadatos del perfil, 1 una nota de texto corta, 3 una lista de seguidos, 7 una reacción, etc.",
    long: paras(
      "Los kinds se definen a lo largo de los NIPs. Su rango numérico también indica a los relays cómo guardarlos: 1000–9999 (más 1, 2, 4–44) son regulares y se conservan; 10000–19999 (más 0 y 3) son reemplazables; 20000–29999 son efímeros y no se guardan; 30000–39999 son direccionables.",
      "Los clientes ignoran los kinds que no entienden, y así es como salen funciones nuevas sin romper las apps antiguas.",
    ),
    seeAlso: ["event", "replaceable-event", "ephemeral-event", "addressable-event"],
    nips: ["01"],
  },
  tag: {
    term: "Tag (etiqueta)",
    short:
      'Un array de strings adjunto a un evento, como ["p", <pubkey>] para mencionar a alguien o ["e", <id de evento>] para responder a una nota.',
    long: paras(
      "El primer elemento es el nombre del tag y el resto son valores. Los más comunes: e (referencia a un evento), p (pubkey), a (coordenada de un evento direccionable), d (identificador de un evento direccionable), t (hashtag).",
      'Los relays indexan los tags de una sola letra, así que un filtro como {"#p": [<pubkey>]} encuentra todos los eventos que mencionan a una persona.',
    ),
    seeAlso: ["event", "filter", "addressable-event"],
    nips: ["01", "10"],
  },
  pubkey: {
    term: "Clave pública",
    short:
      "Tu identidad pública: una clave secp256k1 de 32 bytes, mostrada como 64 caracteres hex o como npub. Puedes compartirla sin problema.",
    long: paras(
      'Nostr usa claves públicas "x-only" de BIP-340, derivadas de la clave privada. Cada evento lleva la pubkey de su autor, y cualquiera puede usarla para comprobar la firma del evento.',
      "Dentro de los eventos y los mensajes de los relays, las pubkeys van siempre en hex en minúsculas; la forma npub es solo para humanos.",
    ),
    seeAlso: ["privkey", "npub", "keypair", "secp256k1"],
    nips: ["01", "19"],
  },
  privkey: {
    term: "Clave secreta (clave privada)",
    short:
      "El secreto de 32 bytes que demuestra que tú eres tú: quien lo tenga puede firmar eventos en tu nombre. Nunca lo compartas.",
    long: paras(
      "La clave privada (clave secreta) es un número aleatorio en la curva secp256k1. Firma tus eventos y, junto con la clave pública de otra persona, deriva secretos compartidos para mensajes cifrados.",
      "En Nostr no existe «restablecer contraseña»: si se filtra, un atacante puede publicar como tú para siempre; si la pierdes, la identidad desaparece. Guárdala en un firmante dedicado en vez de pegarla en sitios web.",
    ),
    seeAlso: ["nsec", "keypair", "signer", "key-loss"],
    nips: ["01", "19"],
  },
  npub: {
    term: "npub",
    short:
      "Una clave pública codificada en bech32 para que las personas puedan copiarla con seguridad: npub1… en lugar de 64 caracteres hex.",
    long: paras(
      'Definido en NIP-19. El prefijo "npub" te dice qué es la cadena y la suma de verificación integrada detecta erratas. Al decodificar un npub obtienes exactamente los mismos 32 bytes que la pubkey en hex.',
      "Los npub son para mostrar, compartir y hacer códigos QR; el protocolo en sí siempre usa hex.",
    ),
    seeAlso: ["pubkey", "bech32", "nip19", "nsec"],
    nips: ["19"],
  },
  nsec: {
    term: "nsec",
    short:
      "Una clave privada codificada en bech32 (nsec1…). Cualquiera que la vea puede hacerse pasar por ti.",
    long: paras(
      'El prefijo distintivo "nsec" existe para que el software y las personas reconozcan un secreto de un vistazo y se nieguen a pegarlo donde no corresponde.',
      "Trata un nsec como la contraseña maestra de toda tu identidad Nostr: guárdalo en un firmante o gestor de contraseñas y nunca lo escribas en un sitio web.",
    ),
    seeAlso: ["privkey", "bech32", "nip19", "signer"],
    nips: ["19"],
  },
  keypair: {
    term: "Par de claves",
    short:
      "Una clave privada más la clave pública derivada de ella. En Nostr, tu par de claves es tu cuenta.",
    long: paras(
      "Generar un par de claves es instantáneo y sin conexión: eliges 32 bytes aleatorios, multiplicas el punto generador de secp256k1 por ellos y ya tienes una clave pública. Ningún servidor tiene que aprobarlo.",
      "Las matemáticas solo funcionan en un sentido: la clave pública es fácil de calcular a partir de la privada, pero la privada no se puede recuperar a partir de la pública.",
    ),
    seeAlso: ["privkey", "pubkey", "secp256k1"],
    nips: ["01"],
  },
  secp256k1: {
    term: "secp256k1",
    short: "La curva elíptica que Nostr (y Bitcoin) usa para sus claves y firmas.",
    long: paras(
      "Las claves privadas son números entre 1 y el orden de la curva (algo menos de 2²⁵⁶); las claves públicas son puntos de la curva. Nostr reutiliza las librerías probadas de Bitcoin y el esquema Schnorr de BIP-340 sobre esta curva.",
      "La misma curva impulsa ECDH, que NIP-04 y NIP-44 usan para derivar secretos compartidos para el cifrado.",
    ),
    seeAlso: ["keypair", "schnorr", "ecdh"],
    nips: ["01"],
  },
  schnorr: {
    term: "Firma Schnorr",
    short:
      "El esquema de firma que usa Nostr (BIP-340 sobre secp256k1): 64 bytes que demuestran que quien tiene una clave privada aprobó un id de evento.",
    long: paras(
      "Las firmas Schnorr son cortas, rápidas de verificar y fáciles de razonar. Nostr firma el id de evento de 32 bytes, así que la firma compromete cada campo del evento.",
      "La firma BIP-340 puede mezclar aleatoriedad nueva (datos auxiliares), así que firmar el mismo evento dos veces puede producir firmas distintas e igual de válidas.",
    ),
    seeAlso: ["signature", "secp256k1", "event-id"],
    nips: ["01"],
  },
  signature: {
    term: "Firma",
    short:
      "El campo sig de un evento: prueba criptográfica de que el dueño de la pubkey creó exactamente este contenido.",
    long: paras(
      "Cualquiera puede verificar una firma solo con el evento y la clave pública, así que relays y clientes nunca necesitan confiar entre sí: un evento falsificado o modificado simplemente no pasa la verificación.",
      "Las firmas prueban la autoría, no la verdad ni el momento: created_at es lo que el autor haya declarado.",
    ),
    seeAlso: ["schnorr", "event-id", "pubkey", "signer"],
    nips: ["01"],
  },
  hash: {
    term: "Hash",
    short:
      "Una huella de tamaño fijo de unos datos. Cambia un byte de la entrada y la huella cambia por completo.",
    long: paras(
      "Las funciones hash criptográficas son de un solo sentido (no puedes recuperar la entrada) y resistentes a colisiones (no puedes encontrar dos entradas con la misma salida). Nostr usa SHA-256.",
      "El hash es lo que permite que un id de evento identifique un evento exacto, y la prueba de trabajo cuenta los bits cero iniciales de ese hash.",
    ),
    seeAlso: ["sha256", "event-id", "proof-of-work"],
  },
  sha256: {
    term: "SHA-256",
    short:
      "La función hash que usa Nostr: convierte cualquier entrada en 32 bytes (64 caracteres hex).",
    long: paras(
      "Un id de evento es el SHA-256 de los bytes UTF-8 del evento serializado. SHA-256 también aparece dentro de NIP-44 (HKDF y HMAC) y en los hashes de pago de Lightning.",
    ),
    seeAlso: ["hash", "event-id"],
    nips: ["01"],
  },
  bech32: {
    term: "Bech32",
    short:
      "Una codificación de texto amigable con un prefijo legible y una suma de verificación, usada para npub, nsec, note y compañía.",
    long: paras(
      "Bech32 (BIP-173) usa un alfabeto de 32 caracteres que evita caracteres que se confunden, como 1, b, i y o, y una suma de verificación que detecta erratas. La parte antes del 1 (la parte legible por humanos) indica qué hay dentro.",
      "NIP-19 usa bech32 normal (no bech32m) y permite cadenas más largas que el límite de 90 caracteres de Bitcoin para que quepan entidades TLV como nevent.",
    ),
    seeAlso: ["nip19", "npub", "nsec", "note"],
    nips: ["19"],
  },
  nip: {
    term: "NIP",
    short:
      "Nostr Implementation Possibility: un documento corto que describe una función del protocolo, como NIP-01 (lo básico) o NIP-57 (zaps).",
    long: paras(
      "Los NIPs viven en el repositorio nostr-protocol/nips de GitHub. Solo NIP-01 es obligatorio; todo lo demás es opcional, y clientes y relays anuncian o simplemente implementan los que les interesan.",
      "Un NIP se adopta cuando varias apps independientes lo implementan, no por votación, así que el protocolo crece por consenso aproximado y código que funciona.",
    ),
    seeAlso: ["nip01", "nostr"],
  },
  nip01: {
    term: "NIP-01",
    short:
      "La especificación central: estructura de eventos, ids y firmas, rangos de kinds, filtros y los mensajes entre cliente y relay.",
    long: paras(
      "Si implementas NIP-01 puedes publicar y leer en cualquier relay. Define el JSON de los eventos, cómo serializarlo y hacerle hash, las firmas Schnorr, los mensajes de cliente EVENT/REQ/CLOSE, los mensajes de relay EVENT/OK/EOSE/CLOSED/NOTICE y los rangos de kinds regulares/reemplazables/efímeros/direccionables.",
    ),
    seeAlso: ["event", "filter", "relay", "kind"],
    nips: ["01"],
  },
  nip04: {
    term: "NIP-04",
    short:
      "Los mensajes directos cifrados originales (kind 4). Obsoleto: oculta el texto pero revela quién habla con quién y cuándo.",
    long: paras(
      "NIP-04 cifra el contenido con AES-256-CBC usando un secreto compartido ECDH, pero la pubkey del remitente, el tag p del destinatario y la marca de tiempo siguen siendo públicos, y el texto cifrado no tiene autenticación.",
      "Las apps nuevas deberían usar en su lugar los mensajes privados de NIP-17 (cifrado NIP-44 más gift wraps de NIP-59).",
    ),
    seeAlso: ["nip17", "nip44", "direct-message", "ecdh"],
    nips: ["04"],
  },
  nip05: {
    term: "NIP-05",
    short:
      "Identificadores legibles como alice@example.com que un dominio respalda asociando el nombre a una pubkey.",
    long: paras(
      'Pon "nip05": "alice@example.com" en tu perfil; los clientes descargan https://example.com/.well-known/nostr.json?name=alice y comprueban que la entrada names apunta a tu pubkey. El documento también puede listar relays donde encontrarte.',
      "Es la verificación de una relación con un dominio, no de una identidad en el mundo real, y la pubkey sigue siendo la identidad verdadera si el dominio desaparece.",
    ),
    seeAlso: ["metadata", "pubkey"],
    nips: ["05"],
  },
  nip07: {
    term: "NIP-07",
    short:
      "Una API de extensión de navegador (window.nostr) que permite a los sitios web pedir tu pubkey y firmas sin ver nunca tu clave privada.",
    long: paras(
      "La extensión expone getPublicKey() y signEvent(event), además de cifrado/descifrado opcional nip04 y nip44. El sitio web construye un evento sin firmar; la extensión te lo muestra y lo devuelve firmado.",
    ),
    seeAlso: ["signer", "nip46", "privkey"],
    nips: ["07"],
  },
  nip17: {
    term: "NIP-17",
    short:
      "Mensajes directos privados: un mensaje kind 14 se sella y se envuelve para regalo, así los relays no ven remitente, contenido ni momento.",
    long: paras(
      "El mensaje de chat (kind 14) es un rumor sin firmar; se cifra con NIP-44 dentro de un sello kind 13 firmado por el remitente, que a su vez se cifra dentro de un gift wrap kind 1059 firmado por una clave desechable y dirigido al destinatario.",
      "Los usuarios publican una lista kind 10050 con los relays donde quieren recibir DMs. Se crea un wrap distinto para cada destinatario y para la copia del propio remitente.",
    ),
    seeAlso: ["gift-wrap", "seal", "rumor", "nip44", "nip59", "direct-message"],
    nips: ["17", "44", "59"],
  },
  nip19: {
    term: "NIP-19",
    short:
      "Identificadores codificados en bech32 para compartir: npub, nsec, note, más nprofile, nevent y naddr, que incluyen pistas de relays.",
    long: paras(
      "Las formas simples envuelven 32 bytes en bruto. Las formas TLV (tipo–longitud–valor) empaquetan campos extra como URLs de relays, autor y kind, para que un enlace lleve pistas suficientes para encontrar los datos.",
      "Estas cadenas son solo para mostrar y compartir. NIP-21 añade el esquema de URI nostr: (nostr:npub1…) para enlaces.",
    ),
    seeAlso: ["bech32", "npub", "nsec", "note", "nprofile", "nevent", "naddr"],
    nips: ["19", "21"],
  },
  nip23: {
    term: "NIP-23",
    short:
      "Contenido largo: artículos tipo blog en Markdown como eventos direccionables kind 30023 (los borradores usan 30024).",
    long: paras(
      "Cada artículo tiene un identificador en el tag d, así que editarlo vuelve a publicar la misma dirección en vez de crear una publicación nueva. Entre los tags opcionales están title, summary, image y published_at.",
    ),
    seeAlso: ["long-form", "addressable-event", "naddr"],
    nips: ["23"],
  },
  nip42: {
    term: "NIP-42",
    short:
      "Autenticación de clientes ante relays: el relay envía un desafío y el cliente responde con un evento kind 22242 firmado.",
    long: paras(
      'El relay envía ["AUTH", <desafío>]; el cliente responde ["AUTH", <evento>], donde el evento lleva tags relay y challenge. Los relays lo usan para restringir la lectura o la escritura, por ejemplo a miembros de pago o a los destinatarios de mensajes privados.',
      'Los relays indican que hace falta autenticación con prefijos "auth-required:" en los mensajes OK y CLOSED.',
    ),
    seeAlso: ["relay", "paid-relay", "signature"],
    nips: ["42"],
  },
  nip44: {
    term: "NIP-44",
    short:
      "Cifrado versionado y auditado para contenidos de Nostr (v2: ECDH + HKDF + ChaCha20 + HMAC-SHA256 con relleno).",
    long: paras(
      'Una clave de conversación se deriva una vez por cada par de claves a partir del secreto compartido ECDH con HKDF (salt "nip44-v2"). Cada mensaje recibe un nonce aleatorio de 32 bytes, del que se derivan las claves de ChaCha20 y HMAC; el texto se rellena para ocultar su longitud exacta y se autentica con HMAC-SHA256.',
      "Es una pieza de construcción, no un protocolo de mensajería: NIP-17 y NIP-59 lo usan para construir mensajes privados, y NIP-46 lo usa para el tráfico del firmante.",
    ),
    seeAlso: ["encryption", "ecdh", "nip17", "nip59", "nip04"],
    nips: ["44"],
  },
  nip46: {
    term: "NIP-46",
    short:
      "Firma remota de Nostr (Nostr Connect): una app pide a un firmante separado, a menudo llamado bunker, que firme eventos a través de relays.",
    long: paras(
      "Las peticiones y respuestas son eventos kind 24133 cifrados con NIP-44 entre la clave temporal de la app y el firmante remoto. Una conexión empieza con una URI bunker:// que da el firmante o una URI nostrconnect:// que muestra la app.",
      "La clave privada nunca sale del firmante, que puede funcionar en tu teléfono, en un servidor o en un dispositivo hardware y puede pedirte que apruebes cada petición.",
    ),
    seeAlso: ["bunker", "signer", "nip07"],
    nips: ["46"],
  },
  nip57: {
    term: "NIP-57",
    short:
      "Zaps de Lightning: una solicitud de zap firmada (kind 9734) y un recibo de zap (kind 9735) que llevan las propinas en Bitcoin a Nostr.",
    long: paras(
      "El cliente envía una solicitud de zap al servidor LNURL del destinatario (no se publica en relays), paga la factura que recibe, y el servidor de la wallet del destinatario publica un recibo de zap con la factura bolt11 y la solicitud original.",
      "El recibo lo firma la nostrPubkey del servidor de la wallet, así que demuestra que se pagó una factura a través de ese servidor, no que el remitente sea quien dice ser.",
    ),
    seeAlso: ["zap", "lightning", "lnurl", "lud16"],
    nips: ["57"],
  },
  nip59: {
    term: "NIP-59",
    short:
      "Gift wrap: una forma de ocultar quién envió un evento metiéndolo dentro de un sello y de un envoltorio firmado por una clave de un solo uso.",
    long: paras(
      "Tres capas: el rumor (un evento sin firmar), el sello (kind 13, firmado por el autor real, con el rumor cifrado con NIP-44) y el gift wrap (kind 1059, firmado por una clave desechable aleatoria, con un tag p para el destinatario).",
      "Las marcas de tiempo del sello y del wrap se aleatorizan hacia el pasado para que los relays no puedan correlacionar mensajes por tiempo.",
    ),
    seeAlso: ["gift-wrap", "seal", "rumor", "nip17", "nip44"],
    nips: ["59"],
  },
  nip65: {
    term: "NIP-65",
    short:
      "Metadatos de lista de relays: un evento kind 10002 que lista los relays donde publicas (write) y donde lees tus menciones (read).",
    long: paras(
      'Cada relay es un tag r, opcionalmente marcado como "read" o "write"; sin marca significa ambos. Los clientes buscan tus publicaciones en tus relays de escritura y entregan las menciones hacia ti en tus relays de lectura.',
      "Esta lista es la base del modelo outbox. NIP-65 aconseja mantenerla pequeña, unos dos a cuatro relays por categoría.",
    ),
    seeAlso: ["outbox-model", "relay", "replaceable-event"],
    nips: ["65"],
  },
  filter: {
    term: "Filtro",
    short:
      "Un objeto JSON que describe qué eventos quieres: por ids, authors, kinds, tags (#e, #p…), since, until y limit.",
    long: paras(
      'Dentro de un filtro, todos los campos deben coincidir (Y); dentro de un campo, basta con que coincida cualquier valor (O). Un REQ puede llevar varios filtros, y un evento coincide si coincide con cualquiera de ellos. Ejemplo: {"kinds": [1], "authors": [<pubkey>], "limit": 20}.',
      "limit solo se aplica al lote inicial de eventos guardados, que los relays devuelven de más nuevo a más antiguo. NIP-50 añade un campo search opcional para relays que admiten búsqueda de texto completo.",
    ),
    seeAlso: ["req", "subscription", "tag"],
    nips: ["01", "50"],
  },
  subscription: {
    term: "Suscripción",
    short:
      "Una consulta permanente en un relay, abierta con REQ y un id de suscripción: primero llegan las coincidencias guardadas y luego los eventos nuevos en tiempo real.",
    long: paras(
      'El cliente elige el id de suscripción. Los eventos vuelven como ["EVENT", <id de suscripción>, <evento>]; EOSE marca el fin de los eventos guardados; el cliente la termina con CLOSE, y el relay puede terminarla con CLOSED y un motivo.',
      "Enviar un nuevo REQ con el mismo id reemplaza la suscripción anterior en esa conexión.",
    ),
    seeAlso: ["req", "eose", "filter", "relay"],
    nips: ["01"],
  },
  req: {
    term: "REQ",
    short:
      'El mensaje del cliente que pide eventos a un relay: ["REQ", <id de suscripción>, <filtro>, …].',
    long: paras(
      "Un relay responde a un REQ con todos los eventos guardados que coinciden, luego EOSE, y después sigue enviando los eventos nuevos que coincidan hasta que el cliente envía CLOSE o el relay envía CLOSED.",
    ),
    seeAlso: ["subscription", "filter", "eose"],
    nips: ["01"],
  },
  eose: {
    term: "EOSE",
    short:
      '"End of stored events" (fin de los eventos guardados): la señal del relay de que ya envió todo lo que tenía guardado para una suscripción; lo que llegue después es en vivo.',
    long: paras(
      'Se envía como ["EOSE", <id de suscripción>]. Los clientes lo usan para quitar un indicador de carga o para cerrar consultas puntuales. No termina la suscripción.',
    ),
    seeAlso: ["req", "subscription"],
    nips: ["01"],
  },
  websocket: {
    term: "WebSocket",
    short:
      "Una conexión bidireccional de larga duración entre navegador y servidor. Clientes y relays intercambian mensajes de Nostr por ella como arrays JSON.",
    long: paras(
      "Las URLs de los relays empiezan por wss:// (o ws:// en local). Una conexión puede llevar muchas suscripciones a la vez, y el relay puede enviar eventos nuevos en cuanto llegan, sin sondeos.",
    ),
    seeAlso: ["relay", "req"],
    nips: ["01"],
  },
  zap: {
    term: "Zap",
    short:
      "Un pago Lightning a alguien en Nostr, registrado públicamente como un evento de recibo de zap en la nota o el perfil al que diste propina.",
    long: paras(
      "Los zaps convierten los «me gusta» en valor real y dan a relays y clientes una señal resistente al spam. Por dentro siguen NIP-57: solicitud de zap, factura Lightning, pago, recibo de zap.",
    ),
    seeAlso: ["nip57", "lightning", "lud16"],
    nips: ["57"],
  },
  lightning: {
    term: "Red Lightning",
    short:
      "Una red de pagos sobre Bitcoin para pagos instantáneos y con comisiones bajas, que se liquidan pagando facturas.",
    long: paras(
      "Una factura Lightning (cadena bolt11, lnbc…) compromete un importe y un hash de pago; pagarla revela una preimagen que demuestra el pago. Los zaps de Nostr son pagos Lightning con un recibo de Nostr.",
    ),
    seeAlso: ["zap", "lnurl", "lud16"],
    nips: ["57"],
  },
  lnurl: {
    term: "LNURL",
    short:
      "Un conjunto de convenciones HTTP (las especificaciones LUD) que permiten a una wallet pedir a un servidor una factura Lightning nueva.",
    long: paras(
      "Con LNURL-pay (LUD-06) la wallet obtiene los parámetros de pago del servidor y luego llama a su callback con un importe para recibir una factura. Para los zaps, el servidor anuncia allowsNostr y una nostrPubkey y acepta una solicitud de zap de nostr como parámetro.",
    ),
    seeAlso: ["lud16", "lightning", "nip57"],
    nips: ["57"],
  },
  lud16: {
    term: "Dirección Lightning (lud16)",
    short:
      "Una dirección de pago parecida a un email, como alice@wallet.example, guardada como lud16 en tu perfil de Nostr para que la gente pueda enviarte zaps.",
    long: paras(
      "Definida por LUD-16: alice@wallet.example se resuelve en https://wallet.example/.well-known/lnurlp/alice, un endpoint LNURL-pay. Los clientes NIP-57 la leen de tus metadatos kind 0 para iniciar un zap.",
    ),
    seeAlso: ["lnurl", "zap", "metadata"],
    nips: ["57"],
  },
  "outbox-model": {
    term: "Modelo outbox",
    short:
      "Una estrategia en la que los clientes leen las publicaciones de cada persona en los relays donde esa persona escribe, en vez de que todos compartan los mismos pocos relays.",
    long: paras(
      "También llamado modelo gossip. Usando las listas de relays de NIP-65, un cliente busca los relays de escritura de todas las personas que sigues y lee de ellos, y entrega las respuestas en los relays de lectura de las personas mencionadas.",
      "Mantiene Nostr descentralizado: ningún relay necesita los datos de todo el mundo, y los relays pequeños siguen siendo accesibles.",
    ),
    seeAlso: ["nip65", "relay", "follow-list"],
    nips: ["65"],
  },
  "follow-list": {
    term: "Lista de seguidos",
    short:
      "Un evento kind 3 que lista como tags p las pubkeys que sigues. Cada versión nueva reemplaza a la anterior.",
    long: paras(
      "Como es reemplazable, un cliente siempre debe publicar la lista completa; publicar una copia desactualizada deja de seguir a gente por accidente. Cada tag p puede llevar una pista de relay y un apodo (petname).",
      "Las listas de seguidos de todos juntas forman el grafo social que los clientes usan para los timelines y las ideas de red de confianza.",
    ),
    seeAlso: ["replaceable-event", "web-of-trust", "outbox-model"],
    nips: ["02"],
  },
  "gift-wrap": {
    term: "Gift wrap (envoltorio de regalo)",
    short:
      "La capa exterior de un mensaje privado: un evento kind 1059 firmado por una clave desechable, que solo el destinatario puede leer.",
    long: paras(
      "El contenido del wrap es un sello cifrado con NIP-44. Los relays solo ven una pubkey aleatoria, una marca de tiempo difuminada y el tag p del destinatario, así que no pueden saber quién lo envió.",
    ),
    seeAlso: ["seal", "rumor", "nip59", "nip17"],
    nips: ["59"],
  },
  seal: {
    term: "Sello",
    short:
      "La capa intermedia de un mensaje con gift wrap: un evento kind 13 firmado por el remitente real que contiene el rumor cifrado.",
    long: paras(
      "El sello demuestra al destinatario quién es el autor (y solo al destinatario, porque el propio sello va oculto dentro del wrap). Sus tags siempre están vacíos para que no se filtre nada.",
    ),
    seeAlso: ["gift-wrap", "rumor", "nip59"],
    nips: ["59"],
  },
  rumor: {
    term: "Rumor",
    short: "Un evento con id pero sin firma: el contenido más interno de un mensaje con gift wrap.",
    long: paras(
      "Como no está firmado, no se puede probar que un rumor filtrado venga de su autor, lo que da a los mensajes privados negación plausible. La autenticidad la aporta el sello que lo rodea, cuya pubkey debe coincidir con la pubkey del rumor.",
    ),
    seeAlso: ["seal", "gift-wrap", "nip59"],
    nips: ["59"],
  },
  bunker: {
    term: "Bunker",
    short:
      "Un firmante remoto (NIP-46) que guarda tu clave privada y firma cuando se lo piden, así las apps nunca tocan la clave.",
    long: paras(
      "Conectas una app con una URI bunker:// que contiene la pubkey del firmante, relays y un secreto opcional. Cada petición de firma viaja como un evento cifrado, y el bunker puede aplicar permisos.",
    ),
    seeAlso: ["nip46", "signer"],
    nips: ["46"],
  },
  "replaceable-event": {
    term: "Evento reemplazable",
    short:
      "Un evento del que solo se conserva el más nuevo por autor y kind, como un perfil (kind 0) o una lista de seguidos (kind 3).",
    long: paras(
      "Los kinds 0, 3 y 10000–19999 son reemplazables. Cuando un relay recibe uno más nuevo puede borrar el anterior; si dos tienen el mismo created_at, gana el de id más bajo.",
    ),
    seeAlso: ["kind", "addressable-event", "metadata", "follow-list"],
    nips: ["01"],
  },
  "ephemeral-event": {
    term: "Evento efímero",
    short:
      "Un evento (kinds 20000–29999) que los relays reenvían a los suscriptores actuales pero no guardan.",
    long: paras(
      "Se usa para cosas que solo importan en este momento, como indicadores de «escribiendo», peticiones al firmante (kind 24133) y autenticación ante relays (kind 22242).",
    ),
    seeAlso: ["kind", "replaceable-event"],
    nips: ["01"],
  },
  "addressable-event": {
    term: "Evento direccionable",
    short:
      "Un evento reemplazable identificado por kind, autor y un tag d, así una persona puede tener muchos (kinds 30000–39999).",
    long: paras(
      "Su dirección es kind:pubkey:tag-d; gana el evento más nuevo para esa dirección. Los artículos (30023), las listas y los eventos de calendario lo usan. Los documentos antiguos los llaman eventos reemplazables parametrizados.",
      "Otros eventos apuntan a uno con un tag a, y se comparte como naddr.",
    ),
    seeAlso: ["replaceable-event", "naddr", "kind", "tag"],
    nips: ["01"],
  },
  federation: {
    term: "Federación",
    short:
      "Un diseño en el que muchos servidores interoperan pero cada cuenta pertenece a un servidor, como en el email o Mastodon. Nostr lo evita a propósito.",
    long: paras(
      "En una red federada tu identidad (alice@servidor) y tus datos viven en tu servidor de origen, así que si el administrador te banea o lo cierra, los pierdes. En Nostr tu identidad es una clave y los relays son intercambiables: no necesitan saber unos de otros.",
    ),
    seeAlso: ["relay", "censorship-resistance", "nostr"],
  },
  "censorship-resistance": {
    term: "Resistencia a la censura",
    short:
      "La propiedad de que ninguna empresa o servidor por sí solo pueda silenciarte o borrar tu identidad.",
    long: paras(
      "Nostr la obtiene de las claves propias y de muchos relays independientes: cualquier relay puede rechazar tus eventos, pero ninguno puede impedir que publiques en otro sitio ni falsificar tus palabras. Es resistencia, no inmunidad; tu alcance sigue dependiendo de que relays y clientes difundan tu contenido.",
    ),
    seeAlso: ["relay", "federation", "outbox-model"],
  },
  "proof-of-work": {
    term: "Prueba de trabajo",
    short:
      "Probar nonces hasta que el id del evento empiece con suficientes bits cero, para que cada evento cueste algo de cómputo y disuada el spam.",
    long: paras(
      'NIP-13 añade un tag ["nonce", <contador>, <dificultad objetivo>]. La dificultad es el número de bits cero iniciales del id; cada bit extra duplica el trabajo esperado. Los relays pueden exigir una dificultad mínima.',
    ),
    seeAlso: ["spam", "event-id", "hash"],
    nips: ["13"],
  },
  nevent: {
    term: "nevent",
    short:
      "Un enlace bech32 para compartir un evento que además lleva pistas de relays y, opcionalmente, el autor y el kind.",
    long: paras(
      "Una entidad TLV de NIP-19: el tipo 0 es el id del evento, el tipo 1 una URL de relay (repetible), el tipo 2 la pubkey del autor y el tipo 3 el kind. Las pistas ayudan a un cliente a encontrar el evento en relays que todavía no usa.",
    ),
    seeAlso: ["note", "nip19", "event-id"],
    nips: ["19"],
  },
  nprofile: {
    term: "nprofile",
    short: "Un enlace bech32 para compartir un perfil: la pubkey más relays donde encontrarlo.",
    long: paras(
      "Una entidad TLV de NIP-19 con la pubkey (tipo 0) y cualquier número de URLs de relays (tipo 1). Mejor que un npub a secas cuando quieres que los demás encuentren de verdad los eventos de la persona.",
    ),
    seeAlso: ["npub", "nip19"],
    nips: ["19"],
  },
  naddr: {
    term: "naddr",
    short:
      "Un enlace bech32 para compartir un evento direccionable, como un artículo, construido a partir de su kind, su autor y su tag d.",
    long: paras(
      "Una entidad TLV de NIP-19: el tipo 0 es el identificador del tag d, el tipo 1 relays, el tipo 2 el autor y el tipo 3 el kind. Como apunta a una dirección, el enlace sigue funcionando después de editar el artículo.",
    ),
    seeAlso: ["addressable-event", "nip19", "nip23"],
    nips: ["19"],
  },
  note: {
    term: "note",
    short:
      'O bien una nota de texto kind 1 (una "publicación"), o bien la codificación bech32 note1… de un id de evento.',
    long: paras(
      "El kind 1 es la publicación de texto plano de la que están hechos los timelines; las respuestas y los hilos se marcan con tags e y p (NIP-10). La cadena note1… de NIP-19 envuelve solo el id de 32 bytes sin pistas de relays, así que nevent suele ser más útil.",
    ),
    seeAlso: ["event", "nevent", "nip19"],
    nips: ["01", "19"],
  },
  metadata: {
    term: "Metadatos",
    short:
      "Tu perfil: un evento kind 0 cuyo contenido es un JSON con campos como name, about, picture, nip05 y lud16.",
    long: paras(
      "El kind 0 es reemplazable, así que actualizar tu perfil publica uno nuevo. Campos extra como display_name, banner y website vienen de NIP-24.",
      "En las conversaciones sobre privacidad (capítulo 8), metadatos significa otra cosa: datos sobre una comunicación y no su contenido, como quién habla con quién, cuándo, con qué frecuencia y durante cuánto tiempo. El cifrado oculta el contenido, pero los metadatos pueden revelar mucho si no se ocultan también, y para eso sirven los gift wraps.",
    ),
    seeAlso: ["replaceable-event", "nip05", "lud16"],
    nips: ["01", "24"],
  },
  reaction: {
    term: "Reacción",
    short:
      'Un evento kind 7 que reacciona a otro evento: "+" significa me gusta, "-" no me gusta, o cualquier emoji.',
    long: paras(
      "Las reacciones llevan un tag e para el evento y un tag p para su autor, y pueden añadir un tag k con el kind al que se reacciona. Los emojis personalizados usan códigos cortos de NIP-30.",
    ),
    seeAlso: ["event", "tag"],
    nips: ["25"],
  },
  repost: {
    term: "Repost",
    short:
      "Un evento kind 6 que comparte la nota de otra persona con tus seguidores (kind 16 para otros kinds).",
    long: paras(
      "El repost lleva tags e y p que apuntan al original y puede incluir el JSON del evento original en su contenido. Citar, en cambio, es una nota nueva con un tag q.",
    ),
    seeAlso: ["event", "note"],
    nips: ["18"],
  },
  deletion: {
    term: "Solicitud de borrado",
    short:
      "Un evento kind 5 que pide a relays y clientes que eliminen algunos de tus propios eventos anteriores. No está garantizado.",
    long: paras(
      "Hace referencia a eventos con tags e (o tags a para eventos direccionables). Los relays bien portados dejan de servirlos, pero puede haber copias en relays que ignoran la solicitud o en el disco de cualquiera: en una red pública nada se borra de verdad.",
    ),
    seeAlso: ["event", "relay"],
    nips: ["09"],
  },
  "paid-relay": {
    term: "Relay de pago",
    short:
      "Un relay que cobra una tarifa, normalmente en sats, por publicar o leer, lo que financia a quien lo opera y mantiene fuera el spam.",
    long: paras(
      "Los relays describen sus políticas en un documento de información NIP-11 (limitation.payment_required, fees) y suelen usar la autenticación NIP-42 para reconocer a los miembros que pagan.",
    ),
    seeAlso: ["relay", "nip42", "spam"],
    nips: ["11", "42"],
  },
  "web-of-trust": {
    term: "Red de confianza",
    short:
      "Usar el grafo de seguidos para decidir en quién confiar: probablemente no son spammers las personas a las que siguen las personas que tú sigues.",
    long: paras(
      "No es un único NIP sino una familia de técnicas de clientes y relays basadas en listas de seguidos, silenciados y denuncias. Filtra el spam y las suplantaciones sin un moderador central, a costa de que los usuarios nuevos sean más difíciles de descubrir.",
    ),
    seeAlso: ["follow-list", "spam"],
    nips: ["02"],
  },
  ecdh: {
    term: "ECDH",
    short:
      "Diffie–Hellman de curva elíptica: dos personas combinan su propia clave privada con la clave pública de la otra para obtener el mismo secreto compartido.",
    long: paras(
      "Alice calcula privA × pubB y Bob calcula privB × pubA; ambos llegan al mismo punto, y su coordenada x se convierte en el secreto compartido. NIP-04 lo usa directamente como clave AES; NIP-44 lo pasa por HKDF.",
    ),
    seeAlso: ["encryption", "nip44", "secp256k1"],
    nips: ["04", "44"],
  },
  encryption: {
    term: "Cifrado",
    short:
      "Codificar el contenido para que solo quien tenga la clave correcta pueda leerlo. Los eventos de Nostr son públicos salvo que su contenido esté cifrado.",
    long: paras(
      "Nostr solo cifra el contenido; el sobre del evento (pubkey, kind, tags, marca de tiempo) sigue siendo público salvo que lo ocultes con gift wraps. NIP-44 es el esquema actual; NIP-04 está obsoleto.",
    ),
    seeAlso: ["nip44", "ecdh", "gift-wrap"],
    nips: ["44"],
  },
  "direct-message": {
    term: "Mensaje directo",
    short:
      "Un mensaje privado a una o más personas. Los DMs modernos de Nostr siguen NIP-17; los antiguos usaban NIP-04.",
    long: paras(
      "Con NIP-17, los relays solo ven gift wraps dirigidos a los destinatarios, no quién los envió ni qué dicen. Recuerda que una clave privada filtrada expone todos los mensajes pasados: no hay secreto hacia adelante (forward secrecy).",
    ),
    seeAlso: ["nip17", "nip04", "gift-wrap"],
    nips: ["17"],
  },
  "long-form": {
    term: "Contenido largo",
    short:
      "Artículos y entradas de blog escritos en Markdown y publicados como eventos kind 30023.",
    long: paras(
      "Como son direccionables, los artículos se pueden editar sin romper los enlaces. Las apps de lectura los muestran como entradas de blog y enlazan a ellos con naddr.",
    ),
    seeAlso: ["nip23", "addressable-event", "naddr"],
    nips: ["23"],
  },
  "event-id": {
    term: "Id de evento",
    short:
      "El hash SHA-256 de los campos serializados de un evento, escrito como 64 caracteres hex en minúsculas. Nombra exactamente un evento.",
    long: paras(
      "Serializa [0, pubkey, created_at, kind, tags, content] como JSON compacto, codifícalo en UTF-8 y aplícale SHA-256: ese es el id. Relays y clientes lo recalculan para detectar manipulaciones, y la firma se hace sobre él.",
    ),
    seeAlso: ["sha256", "signature", "event"],
    nips: ["01"],
  },
  signer: {
    term: "Firmante",
    short:
      "Software que guarda tu clave privada y firma eventos para las apps: una extensión de navegador, una app del teléfono o un bunker remoto.",
    long: paras(
      "Usar un firmante significa que las apps nunca ven tu clave, y que puedes aprobar o rechazar cada petición. Las opciones habituales son extensiones de navegador NIP-07, firmantes remotos NIP-46 y apps firmanteas de Android NIP-55.",
    ),
    seeAlso: ["nip07", "nip46", "bunker", "privkey"],
    nips: ["07", "46", "55"],
  },
  "key-loss": {
    term: "Pérdida de claves",
    short:
      "Perder o filtrar tu clave privada. Nostr no tiene botón de restablecer, así que en ambos casos la identidad se pierde.",
    long: paras(
      "Sin una autoridad central no hay nadie ante quien demostrar que eres el dueño. Las mitigaciones son operativas: haz una copia de seguridad de tu nsec sin conexión, usa un firmante y, si una clave se filtra, anuncia una clave nueva desde ella mientras aún puedas y pide a tus seguidores que cambien.",
    ),
    seeAlso: ["privkey", "nsec", "signer"],
  },
  spam: {
    term: "Spam",
    short:
      "Eventos masivos no deseados. Con claves gratis y relays abiertos, Nostr combate el spam con políticas de relays, pagos, prueba de trabajo y el grafo social.",
    long: paras(
      "Las herramientas incluyen relays de pago, autenticación NIP-42, prueba de trabajo NIP-13, filtrado por red de confianza en los clientes, listas de silenciados y denuncias NIP-56 (kind 1984). Cada una sacrifica algo de apertura a cambio de menos ruido.",
    ),
    seeAlso: ["paid-relay", "proof-of-work", "web-of-trust"],
    nips: ["13", "42", "56"],
  },
  invoice: {
    term: "Factura Lightning (BOLT11)",
    short:
      "Una solicitud de pago Lightning de un solo uso (una cadena lnbc…) por un monto exacto, definida por BOLT11.",
    long: paras(
      "En un zap, el servidor LNURL del destinatario devuelve una factura con hash de descripción cuya descripción es la solicitud de zap firmada; el recibo del zap la incluye después en una etiqueta bolt11.",
    ),
    seeAlso: ["lightning", "zap", "nip57"],
    nips: ["57"],
  },
  nip11: {
    term: "NIP-11",
    short:
      "El documento de información del relay: un JSON que el relay sirve por HTTP (Accept: application/nostr+json) con su software, los NIPs que soporta, sus límites y sus tarifas.",
    long: paras(
      "Los clientes lo piden a la propia URL del relay (con https:// en lugar de wss://) antes de conectarse, para saber si exige pago o autenticación y qué tamaño pueden tener los eventos y las suscripciones.",
    ),
    seeAlso: ["relay", "paid-relay", "nip42"],
    nips: ["11"],
  },
  ncryptsec: {
    term: "ncryptsec",
    short:
      "Una clave secreta cifrada con contraseña (NIP-49), el formato de respaldo recomendado; empieza por ncryptsec1.",
    long: paras(
      "La clave se cifra con scrypt y XChaCha20-Poly1305, así que un respaldo filtrado no sirve de nada sin la contraseña.",
    ),
    seeAlso: ["nsec", "privkey", "key-loss"],
    nips: ["49"],
  },
};
