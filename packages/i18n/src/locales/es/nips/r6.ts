// Owner: translation agents. Must structurally match ../../en/nips/r6.ts (enforced by the type).
import type { r6 as en } from "../../en/nips/r6.ts";

/** NIP-22 comment tags (shared by the NIPs whose replies are kind 1111-style comments). */
const commentRoot = {
  "tag.root.e": "E: el evento raíz de la conversación (mayúscula = raíz).",
  "tag.root.e.id": "Id del evento raíz.",
  "tag.root.e.pubkey":
    "Autor del evento raíz, para que los clientes puedan encontrarlo en los relays de ese autor.",
  "tag.root.k": "K: el kind del evento raíz.",
  "tag.root.k.kind": "Número de kind de la raíz, como string.",
  "tag.root.p": "P: el autor del evento raíz.",
  "tag.root.p.pubkey": "Pubkey del autor de la raíz.",
};
const commentParent = {
  "tag.parent.e": "e: el evento al que respondes directamente (minúscula = padre).",
  "tag.parent.e.id": "Id del evento padre. En una respuesta de primer nivel vuelve a ser la raíz.",
  "tag.parent.e.pubkey": "Autor del evento padre.",
  "tag.parent.k": "k: el kind del evento padre.",
  "tag.parent.k.kind": "Número de kind del padre, como string.",
  "tag.parent.p": "p: el autor del padre, para que reciba una notificación.",
  "tag.parent.p.pubkey": "Pubkey del autor del padre.",
};
const relayHint = {
  "tag.relay": "Pista de relay opcional: un relay donde se puede encontrar el evento referenciado.",
};
const imeta = {
  "tag.imeta":
    "Metadatos multimedia NIP-92 para una URL del content: un tag por URL, cada valor es un par 'clave valor'.",
  "tag.imeta.url": "Primera entrada: 'url ' seguido de la URL exacta que aparece en el content.",
  "tag.imeta.property":
    "Más pares 'clave valor', como 'm audio/mp4' (tipo MIME), 'duration 8' (segundos) o 'waveform 0 7 35 …' (amplitudes 0–100 para una vista previa).",
};

export const r6: typeof en = {
  n5A: {
    title: "Sitios web estáticos (nsites)",
    summary:
      "Aloja un sitio web estático en Nostr: un manifiesto firmado asocia cada ruta de archivo con el sha256 de un blob en servidores Blossom, y un servidor anfitrión lo convierte en un sitio web normal.",
    text: {
      "how.files.title": "Un sitio es una lista de archivos",
      "how.files.body":
        "Cada archivo del sitio se sube a un servidor Blossom, que lo guarda bajo su hash sha256. Luego el evento de manifiesto lista un tag path por archivo: la ruta en la que debe servirse y el hash de su contenido.",
      "how.kinds.title": "Sitio raíz o sitio con nombre",
      "how.kinds.body":
        "El kind 15128 es tu sitio raíz: uno por pubkey y sin tag d. El kind 35128 es un sitio con nombre, como un subdominio, con un tag d corto (de 1 a 13 caracteres entre a–z, 0–9 y '-', sin terminar en '-'). Las herramientas antiguas usaban el kind 34128, que ahora es heredado.",
      "how.aggregate.title": "Un solo hash para toda la versión",
      "how.aggregate.body":
        "El tag x contiene el hash agregado: escribe '<sha256> <ruta>' más un salto de línea por cada tag path, ordena las líneas, únelas y calcula el hash del resultado. Dos manifiestos con los mismos archivos obtienen el mismo hash, los publique quien los publique.",
      "how.host.title": "Los servidores anfitriones lo convierten en un sitio web",
      "how.host.body":
        "Un servidor anfitrión lee la etiqueta DNS más a la izquierda: un npub indica el sitio raíz, 'v' más 50 caracteres base36 indica un snapshot, y 50 caracteres base36 más el tag d indican un sitio con nombre.",
      "how.resolve.title": "Servir una ruta",
      "how.resolve.body":
        "Para /blog/ el anfitrión busca /blog/index.html, toma el hash de su tag path y descarga ese blob desde los tags server del manifiesto o desde la lista Blossom kind 10063 del autor. Debería comprobar el hash, y recurre a /404.html cuando falta una ruta.",
      "how.history.title": "Copias y snapshots",
      "how.history.body":
        "Cualquiera puede copiar un sitio bajo su propia clave: a apunta al sitio del que se copió y A al original. Un snapshot kind 5128 congela una versión para poder enlazarla por id de evento.",
      "related.B7":
        "Los archivos viven en servidores Blossom; la lista kind 10063 dice dónde encontrarlos.",
      "related.01":
        "Los eventos reemplazables (15128), direccionables (35128) y regulares (5128) vienen de NIP-01.",
      "related.19": "Los sitios raíz se direccionan con el npub del autor en el nombre de host.",
      "related.89":
        "El tag app puede apuntar a un manejador de aplicaciones NIP-89 al que pertenece el sitio.",
      "related.34": "El tag source puede contener una URL git nostr:// de NIP-34.",
      "flow.publish.label": "Publicar un sitio y conservar una versión",
      "flow.publish.explain":
        "Publica (o actualiza) el sitio con nombre y luego publica un snapshot para que esta versión exacta siga accesible.",
      "flow.publish.named":
        "El manifiesto del sitio con nombre: tag d, tags path y el tag x agregado.",
      "flow.publish.snapshot":
        "El snapshot copia los tags path y el tag x, y apunta al sitio con un tag a.",
      "event.root.label": "Manifiesto del sitio raíz",
      "event.root.explain":
        "Kind 15128, reemplazable: el sitio web principal de una pubkey. No debe tener tag d.",
      "event.named.label": "Manifiesto de sitio con nombre",
      "event.named.explain":
        "Kind 35128, direccionable: un sitio adicional bajo la misma pubkey, identificado por su tag d.",
      "event.snapshot.label": "Snapshot del manifiesto",
      "event.snapshot.explain":
        "Kind 5128, un evento regular: una copia inmutable de los archivos de un sitio en un momento dado. Su created_at es la fecha de la versión.",
      "content.empty": "Siempre vacío: todo está en los tags.",
      "tag.path": "Un archivo del sitio: dónde se sirve y qué blob lo contiene.",
      "tag.path.path": "Ruta absoluta que termina en un nombre de archivo, como /index.html.",
      "tag.path.sha256": "sha256 del contenido del archivo, que también es su dirección Blossom.",
      "tag.x":
        "El hash agregado de todos los tags path, para poder indexar y buscar esta versión del sitio. Recomendado en sitios, obligatorio en snapshots.",
      "tag.x.hash": "sha256 en hex minúscula de las líneas '<sha256> <ruta>' ordenadas.",
      "tag.x.marker": "Siempre la palabra 'aggregate'.",
      "tag.a":
        "En una copia: el sitio del que se copió. En un snapshot: el sitio que captura. Omítelo en un sitio original.",
      "tag.a.site": "Dirección de un manifiesto de sitio 15128 o 35128 (kind:pubkey:d).",
      "tag.A":
        "En una copia: el sitio original al inicio de la cadena de copias. Se copia sin cambios de copia en copia.",
      "tag.A.site": "Dirección del manifiesto del sitio original.",
      ...relayHint,
      "tag.server":
        "Servidores Blossom que deberían tener los archivos. Los anfitriones los prueban primero.",
      "tag.server.url": "URL base de un servidor Blossom.",
      "tag.title": "Un título legible para el sitio.",
      "tag.title.value": "El texto del título.",
      "tag.description": "Una descripción breve del sitio.",
      "tag.description.value": "El texto de la descripción.",
      "tag.source": "Dónde vive el código fuente del sitio.",
      "tag.source.url":
        "Una URL https:// de git o de un archivo comprimido, o una URL git nostr:// de NIP-34.",
      "tag.app": "Un descriptor de app (como un manejador NIP-89) del que forma parte este sitio.",
      "tag.app.descriptor": "Dirección del evento descriptor de la app.",
      "tag.d":
        "El identificador del sitio con nombre, que también pasa a formar parte de su nombre de host.",
      "tag.d.site": "De 1 a 13 caracteres entre a–z, 0–9 y '-', sin terminar en '-'.",
      "example.homepage": "La página principal de Alice",
      "example.homepage.explain":
        "Tres archivos, el hash agregado de esos tres, una pista de servidor Blossom y un enlace al código fuente.",
      "example.blog": "El blog de Alice",
      "example.blog.explain":
        "Un sitio con nombre 'blog', servido en <pubkey de alice en base36>blog.<host>.",
      "example.copy": "Bob replica el blog de Alice",
      "example.copy.explain":
        "Los mismos archivos y el mismo hash agregado, un tag d nuevo, y a/A apuntando al sitio de Alice.",
      "example.blog-v1": "Snapshot de enero del blog",
      "example.blog-v1.explain":
        "Copia los tags path y el tag x del blog de Alice. La versión se identifica por el id de este evento.",
    },
  },
  n7D: {
    title: "Hilos de foro",
    summary:
      "Discusiones al estilo foro: un evento kind 11 con título inicia un hilo, y cada respuesta es un comentario NIP-22 que apunta a ese hilo.",
    text: {
      "how.thread.title": "Inicia un hilo",
      "how.thread.body":
        "Un hilo es un evento kind 11. El content es la publicación inicial, escrita como cualquier nota.",
      "how.title.title": "Dale un título",
      "how.title.body":
        "Los hilos deberían tener un tag title, para que los clientes de foro puedan listarlos como temas en un tablón de mensajes.",
      "how.reply.title": "Las respuestas son comentarios",
      "how.reply.body":
        "Las respuestas deben ser comentarios kind 1111 de NIP-22, no notas kind 1. Indican a qué responden con tags, nunca en el content.",
      "how.flat.title": "Responde siempre al hilo",
      "how.flat.body":
        "Cada respuesta apunta al hilo kind 11 como raíz (E, K, P) y como padre (e, k, p). Así las discusiones se mantienen planas en lugar de anidarse profundamente.",
      "how.fetch.title": "Cargar un hilo",
      "how.fetch.body":
        'Un cliente obtiene el hilo por id y luego sus respuestas con un filtro como {"kinds": [1111], "#E": [<id del hilo>]}.',
      "related.22": "Las respuestas a los hilos son comentarios kind 1111 de NIP-22.",
      "related.C7":
        "NIP-C7 es su equivalente estilo chat: mensajes cortos en lugar de hilos con título.",
      "related.01": "Los hilos son eventos firmados normales de NIP-01.",
      "flow.discussion.label": "Una discusión de foro",
      "flow.discussion.explain": "Alice abre un hilo y Bob le responde con un comentario.",
      "flow.discussion.thread": "El hilo kind 11 con su título.",
      "flow.discussion.reply":
        "La respuesta kind 1111 de Bob, que apunta al hilo como raíz y como padre.",
      "event.thread.label": "Hilo",
      "event.thread.explain": "Kind 11: la primera publicación de un hilo de foro.",
      "content.thread": "La publicación inicial, en texto plano.",
      "tag.title": "El título del hilo, que se muestra en las listas de hilos.",
      "tag.title.value": "El texto del título.",
      "example.home-relays": "Alice pregunta por los relays de casa",
      "example.home-relays.explain":
        "Un hilo con título. La respuesta de Bob, más abajo, apunta al id de este evento.",
      "example.gm": "Un hilo de buenos días",
      "event.reply.label": "Respuesta (kind 1111)",
      "event.reply.explain":
        "Un comentario NIP-22 cuya raíz y cuyo padre son ambos el hilo kind 11.",
      "content.reply": "El texto de la respuesta.",
      ...commentRoot,
      ...commentParent,
      ...relayHint,
      "example.answer": "Bob responde",
      "example.answer.explain":
        "E/K/P señalan el hilo como raíz, e/k/p como padre. En una respuesta a un hilo son lo mismo.",
    },
  },
  nA0: {
    title: "Mensajes de voz",
    summary:
      "Notas de voz cortas de hasta un minuto aproximadamente: kind 1222 para un mensaje nuevo y kind 1244 para una respuesta de voz, cada uno apuntando a un archivo de audio.",
    text: {
      "how.record.title": "Graba y sube",
      "how.record.body":
        "La app graba un clip corto, lo sube (por ejemplo a un servidor Blossom) y pone la URL del archivo en el content. El content es solo la URL, nada más.",
      "how.format.title": "Formato y duración",
      "how.format.body":
        "Se recomienda audio/mp4 (.m4a con AAC u Opus) porque casi cualquier dispositivo puede reproducirlo; ogg, webm y mp3 también pueden funcionar. Los clips deberían durar 60 segundos o menos, y las apps deberían avisar cuando una grabación sea más larga.",
      "how.preview.title": "Muestra una forma de onda antes de descargar",
      "how.preview.body":
        "Un tag imeta opcional puede incluir una forma de onda (amplitudes 0–100, menos de unos 100 valores) y la duración en segundos, para que los clientes dibujen el clip sin descargarlo.",
      "how.reply.title": "Responde con tu voz",
      "how.reply.body":
        "Una respuesta de voz es kind 1244 y usa los tags de comentario de NIP-22: E/K/P para el mensaje raíz y e/k/p para el que respondes.",
      "related.22": "Las respuestas kind 1244 siguen la estructura de comentarios de NIP-22.",
      "related.92": "La forma de onda y la duración van en un tag imeta de NIP-92.",
      "related.B7": "Los archivos de audio suelen guardarse en servidores Blossom.",
      "flow.conversation.label": "Una conversación por voz",
      "flow.conversation.explain": "Bob publica una nota de voz y Carol responde con una propia.",
      "flow.conversation.voice":
        "El mensaje kind 1222 de Bob con una vista previa de la forma de onda.",
      "flow.conversation.reply": "La respuesta kind 1244 de Carol, que apunta al mensaje de Bob.",
      "event.voice.label": "Mensaje de voz",
      "event.voice.explain": "Kind 1222: un mensaje de voz nuevo, de primer nivel.",
      "content.audio": "Exactamente una URL que apunta directamente al archivo de audio.",
      ...imeta,
      "tag.t": "Un hashtag, como en cualquier otra nota.",
      "tag.t.value": "El hashtag, sin '#'.",
      "tag.g": "Un geohash, si el mensaje trata sobre un lugar.",
      "tag.g.value": "Caracteres de geohash (0–9 y letras salvo a, i, l, o).",
      "example.intro": "Bob saluda",
      "example.intro.explain":
        "Un clip m4a de 8 segundos con forma de onda, para que los clientes lo dibujen antes de reproducirlo.",
      "example.plain": "Solo el audio",
      "event.reply.label": "Respuesta de voz",
      "event.reply.explain":
        "Kind 1244: una respuesta de voz, encadenada con los tags de comentario de NIP-22.",
      ...commentRoot,
      ...commentParent,
      ...relayHint,
      "example.answer": "Carol responde por voz",
      "example.answer.explain":
        "Una respuesta de primer nivel: el mensaje de Bob es a la vez la raíz y el padre.",
    },
  },
  nA3: {
    title: "payto: destinos de pago",
    summary:
      "Una lista kind 10133 de las formas en que pueden pagarte, como Bitcoin, Lightning o PayPal, cada una escrita como un tag payto con un tipo y una dirección.",
    text: {
      "how.list.title": "Una lista por persona",
      "how.list.body":
        "El kind 10133 es reemplazable: publicas una lista con todas las formas de pagarte, y una versión nueva reemplaza a la anterior.",
      "how.tag.title": "Un tag por dirección",
      "how.tag.body":
        'Cada dirección de pago es un tag: ["payto", <tipo>, <dirección>]. Añade tantos como quieras.',
      "how.type.title": "El tipo va en minúsculas",
      "how.type.body":
        "El tipo nombra la red o el servicio: bitcoin, lightning, monero, paypal, etc. El NIP lista los más comunes, pero se permite cualquier tipo en minúsculas.",
      "how.render.title": "Convertirlo en un enlace",
      "how.render.body":
        "Los clientes muestran cada destino como un botón. Si la red tiene un esquema URI lo usan (bitcoin:<dirección>); si no, usan RFC 8905: payto://<tipo>/<dirección>.",
      "related.57":
        "Los zaps (NIP-57) son pagos Lightning vinculados a una nota; payto es una simple lista de direcciones.",
      "related.47":
        "Nostr Wallet Connect (NIP-47) permite que una app pague por ti; payto solo dice adónde enviar el dinero.",
      "related.01": "El kind 10133 es un evento reemplazable según lo define NIP-01.",
      "event.targets.label": "Destinos de pago",
      "event.targets.explain": "Kind 10133: tu lista de direcciones de pago.",
      "content.empty": "Vacío: las direcciones están en los tags.",
      "tag.payto": "Una forma de pagarte.",
      "tag.payto.type":
        "Tipo de pago, siempre en minúsculas. Elige uno común o escribe el tuyo; los tipos desconocidos siguen funcionando mediante payto://.",
      "type.bip352": "Dirección de pago silencioso de Bitcoin (BIP-352).",
      "type.bip353": "Dirección Bitcoin legible en DNS, como ₿alice@example.com (BIP-353).",
      "type.cashme": "Cashtag de Cash App, que empieza por $.",
      "type.lightning": "Dirección Lightning, como alice@wallet.example.",
      "tag.payto.address": "La dirección, nombre de usuario o cuenta para ese tipo.",
      "example.wallets": "Las wallets de Alice",
      "example.wallets.explain":
        "Bitcoin se abre como bitcoin:<dirección>; los demás recurren a payto://lightning/… y payto://cashme/….",
      "example.unknown": "Un tipo que no está en la lista",
      "example.unknown.explain":
        "iban no es uno de los tipos comunes, así que el editor avisa, pero los clientes aún pueden mostrar payto://iban/DE89….",
    },
  },
  nA4: {
    title: "Mensajes públicos",
    summary:
      "El kind 24 es un mensaje público corto dirigido a una o más personas, que se muestra en sus notificaciones en lugar de en los feeds, sin hilos y sin privacidad.",
    text: {
      "how.message.title": "Un mensaje para alguien, en público",
      "how.message.body":
        "El kind 24 contiene un mensaje en texto plano en el content. Está firmado y es público, algo así como una postal.",
      "how.receivers.title": "Los tags p nombran a los destinatarios",
      "how.receivers.body": "Añade un tag p por cada persona a la que va dirigido el mensaje.",
      "how.relays.title": "Entregado en las bandejas de entrada",
      "how.relays.body":
        "El remitente lo publica en los relays de entrada (NIP-65) de cada destinatario y en sus propios relays de salida, para que los destinatarios lo encuentren sin seguir al remitente.",
      "how.no-threads.title": "Sin hilos",
      "how.no-threads.body":
        "No hay raíces, respuestas ni salas de chat. Cada mensaje es independiente y se responde desde la pantalla de notificaciones, así que no deben usarse tags e.",
      "how.expire.title": "Deja que caduque",
      "how.expire.body":
        "Sin una conversación alrededor, estos mensajes envejecen mal, así que se recomienda un tag expiration de NIP-40.",
      "how.public.title": "No es privado",
      "how.public.body":
        "Cualquiera puede leer el kind 24. Para mensajes privados usa NIP-17; sus mensajes kind 14 van sellados y envueltos como regalo (gift wrap).",
      "related.65": "Los mensajes se envían a los relays de entrada NIP-65 de los destinatarios.",
      "related.40": "Se recomienda un tag expiration (NIP-40).",
      "related.18": "Los tags q (NIP-18) pueden citar otros eventos mencionados en el content.",
      "related.17": "NIP-17 es la alternativa privada. No confundas el kind 24 con el kind 14.",
      "event.message.label": "Mensaje público",
      "event.message.explain": "Kind 24: un mensaje público para las personas de sus tags p.",
      "content.message": "El mensaje, en texto plano.",
      "tag.p": "Un destinatario del mensaje.",
      "tag.p.pubkey": "La pubkey del destinatario.",
      ...relayHint,
      "tag.expiration": "Cuándo pueden descartar el mensaje los relays y los clientes (NIP-40).",
      "tag.expiration.at": "Tiempo Unix en segundos.",
      "tag.q": "Un evento citado en el content con un enlace nostr: (NIP-18).",
      "tag.q.target": "Un id de evento o una dirección (kind:pubkey:d).",
      "tag.q.pubkey": "Autor del evento citado, cuando es un evento regular.",
      ...imeta,
      "tag.e": "No permitido en el kind 24: estos mensajes nunca apuntan a un hilo ni a un padre.",
      "tag.e.id": "Un id de evento. Para citar un evento usa un tag q.",
      "example.thanks": "Alice le da las gracias a Bob",
      "example.thanks.explain": "Un destinatario y una caducidad una semana después.",
      "example.quote": "Carol comparte un artículo",
      "example.quote.explain":
        "Dos destinatarios y un tag q para el artículo enlazado en el content.",
    },
  },
  nB0: {
    title: "Marcadores web",
    summary:
      "Guarda y comparte marcadores web como eventos kind 39701: el tag d es la URL guardada, y puedes editar el título, los tags y las notas más tarde.",
    text: {
      "how.address.title": "La URL es la dirección",
      "how.address.body":
        "El kind 39701 es direccionable y su tag d es la URL guardada, así que cada persona tiene como máximo un marcador por URL y guardarla de nuevo lo actualiza.",
      "how.scheme.title": "Quita https://",
      "how.scheme.body":
        "En las URLs https, omite todo lo que va antes del nombre de host: 'https://example.com/post' pasa a ser 'example.com/post'. Los demás esquemas conservan su prefijo. Todos escriben el mismo tag d, así que los clientes pueden buscar marcadores por URL.",
      "how.describe.title": "Añade notas",
      "how.describe.body":
        "El content contiene tu descripción de la página y puede estar vacío. Un tag title, tags t para temas y una fecha published_at son opcionales.",
      "how.edit.title": "Edítalo cuando quieras",
      "how.edit.body":
        "Vuelve a publicar el mismo tag d con tags o texto nuevos; los relays solo conservan la versión más reciente.",
      "how.comments.title": "Comentarios",
      "how.comments.body":
        "Los comentarios sobre un marcador deben ser comentarios kind 1111 de NIP-22.",
      "related.01": "El kind 39701 es direccionable, según lo define NIP-01.",
      "related.22": "Los comentarios sobre marcadores son comentarios NIP-22.",
      "related.51":
        "Las listas de marcadores de NIP-51 reúnen notas; NIP-B0 guarda páginas web, un evento por cada una.",
      "event.bookmark.label": "Marcador web",
      "event.bookmark.explain": "Kind 39701: una dirección web guardada con tus notas.",
      "content.bookmark": "Tu descripción de la página. Puede estar vacía.",
      "tag.d": "La URI guardada, que también es el identificador de este evento.",
      "tag.d.uri": "La URL sin 'https://' (otros esquemas como http:// se mantienen).",
      "tag.title": "El título de la página, utilizable como texto de un enlace.",
      "tag.title.value": "El texto del título.",
      "tag.published_at": "Cuándo lo guardaste por primera vez. No cambia al editar.",
      "tag.published_at.at": "Tiempo Unix en segundos, como string.",
      "tag.t": "Un tema o hashtag para el marcador.",
      "tag.t.value": "El tema, sin '#'.",
      "example.nips": "Alice guarda el repositorio de los NIPs",
      "example.nips.explain":
        "Una URL https, así que el tag d empieza en el nombre de host. Dos temas y una fecha de primer guardado.",
      "example.http": "Una página http antigua",
      "example.http.explain": "El http simple conserva su esquema en el tag d. Esta vez sin notas.",
    },
  },
  nB7: {
    title: "Blossom",
    summary:
      "Usa servidores Blossom para multimedia: los archivos se guardan y se encuentran por su hash sha256, y tu lista de servidores kind 10063 indica a los demás dónde buscar cuando un enlace deja de funcionar.",
    text: {
      "how.hash.title": "Los archivos se nombran por su hash",
      "how.hash.body":
        "Un servidor Blossom guarda un archivo bajo su hash sha256, así que una URL se ve como https://servidor/<64 caracteres hex>.png. El hash identifica el archivo sin importar qué servidor lo tenga.",
      "how.servers.title": "Publica tu lista de servidores",
      "how.servers.body":
        "Un evento kind 10063 lista los servidores Blossom a los que subes archivos, por orden de preferencia.",
      "how.fallback.title": "Cuando un enlace se rompe",
      "how.fallback.body":
        "Si una URL en el evento de alguien termina con un hash hex de 64 caracteres y ya no funciona, el cliente lee la lista kind 10063 de esa persona y pide el mismo hash (con la extensión) a esos servidores.",
      "how.verify.title": "Comprueba la descarga",
      "how.verify.body":
        "Como el nombre es el hash, el cliente debería calcular el hash de lo descargado y compararlo. Un servidor no puede cambiar el archivo sin que se note.",
      "how.upload.title": "Subir requiere un permiso firmado",
      "how.upload.body":
        "Para subir, el cliente firma un evento kind 24242 de corta duración (verbo 'upload', el hash del archivo y una caducidad) y lo envía codificado en base64 como 'Authorization: Nostr …'.",
      "related.92": "Los tags imeta (NIP-92) describen URLs multimedia, incluido su hash.",
      "related.94": "Los eventos de metadatos de archivo NIP-94 pueden apuntar a blobs de Blossom.",
      "related.96":
        "NIP-96 es una API HTTP de almacenamiento de archivos más antigua; Blossom es la opción más simple, basada en hashes.",
      "related.98":
        "NIP-98 firma peticiones HTTP con el kind 27235; Blossom usa su propio kind 24242 de la misma manera.",
      "flow.publish-and-find.label": "Sube y luego encuéntralo en cualquier parte",
      "flow.publish-and-find.explain":
        "Alice sube un archivo con un permiso firmado, lista sus servidores, y cualquiera puede volver a encontrar el archivo por su hash.",
      "flow.publish-and-find.auth": "Alice firma un permiso kind 24242 para esta única subida.",
      "flow.publish-and-find.upload":
        "El cliente hace PUT del archivo con el permiso en la cabecera Authorization.",
      "flow.publish-and-find.servers":
        "Su lista kind 10063 dice qué servidores tienen sus archivos.",
      "flow.publish-and-find.fetch": "Un lector obtiene el hash desde otro servidor de esa lista.",
      "event.servers.label": "Lista de servidores Blossom",
      "event.servers.explain":
        "Kind 10063, reemplazable: los servidores donde guardas tus archivos.",
      "content.empty": "Vacío: los servidores están en los tags.",
      "tag.server": "Un servidor Blossom que usas, el preferido primero.",
      "tag.server.url": "La URL base del servidor (https://…).",
      "example.two-servers": "Los servidores de Alice",
      "example.two-servers.explain": "Su propio servidor primero y un espejo en segundo lugar.",
      "event.auth.label": "Evento de autorización",
      "event.auth.explain":
        "Kind 24242 (Blossom BUD-01): un permiso firmado para una acción en un servidor. Se envía en una cabecera HTTP, no se publica en relays.",
      "content.auth": "Una descripción legible de la acción, que se muestra al usuario.",
      "tag.t": "Qué acción permite este permiso.",
      "tag.t.verb": "La acción: get, upload, list o delete.",
      "verb.get": "Descargar un blob.",
      "verb.upload": "Subir un blob nuevo.",
      "verb.list": "Listar tus blobs en el servidor.",
      "verb.delete": "Borrar un blob.",
      "tag.expiration": "Después de este momento el servidor debe rechazar el permiso.",
      "tag.expiration.at": "Tiempo Unix en segundos. Mantenlo unos minutos en el futuro.",
      "tag.x": "El hash del blob al que se refiere la acción. Necesario para upload y delete.",
      "tag.x.sha256": "sha256 del archivo, en hex.",
      "tag.auth-server":
        "Limita el permiso a este servidor, para que no pueda reutilizarse en otro.",
      "example.upload": "Permiso para subir una nota de voz",
      "example.upload.explain": "Válido durante una hora, para exactamente un hash de archivo.",
      "http.fetch.label": "GET /<sha256>",
      "http.fetch.explain":
        "Descarga un blob por su hash, con una extensión de archivo opcional. Los archivos públicos no necesitan autorización.",
      "http.fetch.200": "El archivo. Comprueba que su sha256 coincide con el hash de la URL.",
      "http.fetch.404":
        "Este servidor no lo tiene: prueba con el siguiente servidor de la lista del autor.",
      "example.mirror": "Obtener desde el espejo",
      "example.mirror.explain":
        "El enlace original se rompió, así que el cliente prueba el mismo hash en el segundo servidor de Alice.",
      "http.upload.label": "PUT /upload",
      "http.upload.explain":
        "Sube un archivo (BUD-02). El cuerpo es el archivo en bruto y la cabecera Authorization lleva el evento kind 24242 firmado.",
      "header.authorization":
        "'Nostr ' seguido del evento kind 24242 firmado, codificado en base64.",
      "header.content-type": "El tipo MIME del archivo, como audio/mp4.",
      "http.upload.200": "Guardado. El servidor responde con un descriptor de blob.",
      descriptor: "Un descriptor de blob: dónde vive ahora el archivo y qué es.",
      "descriptor.url": "URL pública del blob en este servidor.",
      "descriptor.sha256": "El sha256 del archivo, que también es su nombre.",
      "descriptor.size": "Tamaño en bytes.",
      "descriptor.type": "Tipo MIME.",
      "descriptor.uploaded": "Momento de la subida, en segundos Unix.",
      "http.upload.401": "Evento de autorización ausente, caducado o no válido.",
      "example.voice-note": "Subida con autorización",
      "example.voice-note.explain":
        "La cabecera contiene el evento kind 24242 firmado de Alice. Decodifica el base64 para ver el JSON.",
    },
  },
  nBE: {
    title: "Protocolo de comunicaciones BLE de Nostr",
    summary:
      "No recomendado. Dos dispositivos cercanos sincronizan eventos de Nostr por Bluetooth Low Energy sin internet: uno actúa como relay y el otro como cliente, usando NIP-77 para averiguar qué falta.",
    text: {
      "how.status.title": "No recomendado",
      "how.status.body":
        "Este NIP solo se ha implementado una vez y necesita revisión, así que está marcado como no recomendado. No indica ningún reemplazo. Con conexión, usa relays normales y la sincronización de NIP-77.",
      "how.advertise.title": "Encontrarse",
      "how.advertise.body":
        "Cada dispositivo anuncia un servicio BLE (UUID 0000180f-…) con su propio UUID de dispositivo como datos.",
      "how.roles.title": "Elegir un relay y un cliente",
      "how.roles.body":
        "El dispositivo con el UUID más alto pasa a ser el servidor GATT y hace de relay; el otro es el cliente. Un dispositivo que siempre quiere un mismo rol usa un UUID de todo F o de todo ceros.",
      "how.chunks.title": "Paquetes pequeños",
      "how.chunks.body":
        "Cada mensaje NIP-01 se comprime con DEFLATE y se divide en fragmentos: un índice de 2 bytes, los datos y un byte que marca el último fragmento. Los mensajes están limitados a 64 KB y solo hay uno en tránsito a la vez.",
      "how.sync.title": "Sincronizar con NIP-77",
      "how.sync.body":
        "El cliente abre una sesión negentropy de NIP-77 y luego ambos se turnan: write, write-success, read-message, respuesta. Cada turno envía un EVENT que falta o un EOSE, hasta que ambos lados lo tienen todo.",
      "how.spread.title": "Reenviar eventos nuevos",
      "how.spread.body":
        "Mientras están conectados, un dispositivo que recibe un evento nuevo lo reenvía a los pares que no lo tienen. El lado relay envía primero una notificación vacía para que el cliente sepa que debe leer.",
      "related.77":
        "La sincronización usa mensajes negentropy de NIP-77 (NEG-OPEN, NEG-MSG), en modo semidúplex.",
      "related.01":
        "Cada mensaje en el canal es un mensaje NIP-01 normal, comprimido y fragmentado.",
      "actor.phone": "Dispositivo A (cliente GATT)",
      "actor.peer": "Dispositivo B (servidor GATT, actúa como relay)",
      "step.advertise.label": "Anunciar",
      "step.advertise.explain":
        "El dispositivo B difunde el UUID del servicio y su UUID de dispositivo.",
      "step.roles.label": "Comparar UUIDs",
      "step.roles.explain":
        "El dispositivo A lee el UUID de B. El de B es mayor, así que B es el servidor (relay) y A se conecta como cliente.",
      "step.neg-open.label": "Escribir NEG-OPEN",
      "step.neg-open.explain":
        "A escribe un NEG-OPEN de NIP-77 con un filtro y su primer mensaje negentropy en la característica de escritura.",
      "step.write-success.label": "write-success",
      "step.write-success.explain": "B confirma la escritura. Solo se mueve un mensaje a la vez.",
      "step.read.label": "read-message",
      "step.read.explain": "A pide leer la respuesta de B desde la característica de lectura.",
      "step.neg-msg.label": "NEG-MSG",
      "step.neg-msg.explain":
        "B responde con su mensaje negentropy: ahora ambos saben qué eventos difieren.",
      "step.send-event.label": "Escribir un EVENT",
      "step.send-event.explain":
        "A envía un evento que le falta a B (o EOSE cuando no le queda ninguno) y vuelve a leer.",
      "step.receive.label": "EVENT o EOSE de vuelta",
      "step.receive.explain":
        "B devuelve un evento que le falta a A, o EOSE cuando no tiene ninguno. Los turnos se repiten hasta que ambos están sincronizados.",
      "step.notify.label": "Notificar algo nuevo",
      "step.notify.explain":
        "Más tarde, cuando B recibe un evento nuevo de otro par, envía una notificación vacía. A lee y recibe el EVENT.",
    },
  },
  nC0: {
    title: "Fragmentos de código",
    summary:
      "Comparte código como eventos kind 1337: el content es el código, y los tags indican el lenguaje, el nombre de archivo, la licencia, las dependencias y el repositorio de origen.",
    text: {
      "how.code.title": "El código es el content",
      "how.code.body":
        "Pon el fragmento en el content tal como está escrito. Los clientes conservan los espacios y la indentación y ofrecen copiarlo con un clic.",
      "how.language.title": "Di qué es",
      "how.language.body":
        "Un tag l con el nombre del lenguaje en minúsculas y un tag extension (sin el punto) permiten a los clientes resaltar el código y guardarlo como archivo.",
      "how.license.title": "Ponle licencia",
      "how.license.body":
        "Usa identificadores SPDX como MIT o Apache-2.0. Repite el tag license para ofrecer varias licencias; quien lo lea puede elegir cualquiera de ellas.",
      "how.repo.title": "Enlaza el origen",
      "how.repo.body":
        "El tag repo apunta al lugar de donde viene el código: una URL normal, o la dirección de un evento de repositorio git NIP-34 más una pista de relay.",
      "how.client.title": "Qué hacen los clientes",
      "how.client.body":
        "Los clientes deberían resaltar la sintaxis, mostrar el lenguaje y la descripción, y pueden permitirte ejecutar, editar, bifurcar o descargar el fragmento.",
      "related.34": "repo puede apuntar a un anuncio de repositorio NIP-34 (kind 30617).",
      "related.01": "Un fragmento es un evento regular de NIP-01.",
      "event.snippet.label": "Fragmento de código",
      "event.snippet.explain": "Kind 1337: un trozo de código más lo que necesitas para usarlo.",
      "content.code": "El código en sí.",
      "tag.l": "Lenguaje de programación.",
      "tag.l.value": "Nombre del lenguaje en minúsculas, como javascript, python o rust.",
      "tag.name": "Nombre del fragmento, normalmente un nombre de archivo.",
      "tag.name.value": "Por ejemplo hello-world.js.",
      "tag.extension": "Extensión de archivo, usada para resaltar y descargar el fragmento.",
      "tag.extension.value": "Sin el punto: js, py, rs.",
      "tag.description": "Qué hace el código, en una frase.",
      "tag.description.value": "El texto de la descripción.",
      "tag.runtime": "Runtime o entorno para el que se escribió.",
      "tag.runtime.value": "Por ejemplo 'node v22.11.0' o 'python 3.12'.",
      "tag.license": "Licencia del código. Repítelo para varias licencias.",
      "tag.license.spdx": "Un identificador corto SPDX: MIT, GPL-3.0-or-later, Apache-2.0…",
      "tag.license.reference": "Enlace opcional al texto completo de la licencia.",
      "tag.dep": "Algo que el código necesita para ejecutarse. Repítelo por cada dependencia.",
      "tag.dep.value": "Un nombre de paquete, opcionalmente con versión.",
      "tag.repo": "De dónde viene el código.",
      "tag.repo.target": "Una URL, o una dirección de repositorio NIP-34 '30617:<pubkey>:<tag d>'.",
      ...relayHint,
      "example.hello": "Hola, Nostr en JavaScript",
      "example.hello.explain":
        "Lenguaje, nombre de archivo, runtime, licencia y la URL de un repositorio.",
      "example.python": "El quicksort de Bob",
      "example.python.explain":
        "Dos licencias (elige cualquiera) y un tag repo que apunta a un repositorio NIP-34 con una pista de relay.",
    },
  },
  nC7: {
    title: "Chats",
    summary:
      "El kind 9 es un mensaje de chat. Para responder, envía otro kind 9 que cite el mensaje anterior con un tag q, así los chats siguen siendo un flujo ordenado y simple.",
    text: {
      "how.message.title": "Un mensaje de chat",
      "how.message.body":
        "Un evento kind 9 cuyo content es el texto del mensaje. No se necesita nada más.",
      "how.quote.title": "Responde citando",
      "how.quote.body":
        "Una respuesta es otro kind 9 con un tag q que nombra el mensaje al que responde: id, pista de relay y autor.",
      "how.mention.title": "Muestra la cita en línea",
      "how.mention.body":
        "El content de la respuesta suele empezar con un enlace nostr:nevent al padre, para que los clientes muestren el mensaje citado encima de la respuesta.",
      "how.stream.title": "Un flujo, un kind",
      "how.stream.body":
        "Los clientes que muestran un chat como un flujo ordenado deben obtener solo el kind 9, para que todas las apps vean los mismos mensajes. Se puede citar otro contenido (NIP-18), pero no forma parte del flujo.",
      "related.18": "Las citas usan tags q de NIP-18.",
      "related.21": "El enlace nostr:nevent del content es una URI de NIP-21.",
      "related.29":
        "Los grupos basados en relays de NIP-29 usan el kind 9 para sus mensajes de chat.",
      "related.7D": "Los hilos de foro de NIP-7D son el equivalente de formato largo.",
      "event.chat.label": "Mensaje de chat",
      "event.chat.explain": "Kind 9: un mensaje en un chat.",
      "content.chat":
        "El texto del mensaje. Una respuesta puede empezar con un enlace nostr: al mensaje citado.",
      "tag.q": "El mensaje al que responde este (una cita).",
      "tag.q.id": "Id del mensaje citado.",
      ...relayHint,
      "tag.q.pubkey": "Autor del mensaje citado.",
      "example.gm": "Alice dice GM",
      "example.gm.explain": "El mensaje de chat más simple: content y ningún tag.",
      "example.reply": "Bob responde",
      "example.reply.explain":
        "El tag q apunta al mensaje de Alice y el content empieza con su nevent para que se muestre en línea.",
    },
  },
  nCC: {
    title: "Geocaching",
    summary:
      "Geocaching en Nostr: esconde un cache como un listado kind 37516, registra hallazgos como kind 7516, demuestra que estuviste allí con un evento kind 7517 firmado con la propia clave del cache, y agrupa caches en rutas.",
    text: {
      "how.hide.title": "Esconde un cache",
      "how.hide.body":
        "El propietario publica un listado kind 37516: el nombre, la ubicación, la dificultad, el terreno y el tamaño son obligatorios; la descripción va en el content.",
      "how.where.title": "Ubicación como geohashes",
      "how.where.body":
        "Los tags g contienen el geohash. Añade varias precisiones (de 3 a 9 caracteres) para que las apps puedan buscar en los alrededores; los clientes deberían exigir al menos 8 caracteres, 9 para caches micro.",
      "how.log.title": "Registra un hallazgo",
      "how.log.body":
        "Quien lo encuentra publica un registro de hallazgo kind 7516 con un tag a que apunta al listado.",
      "how.prove.title": "Demuestra que estuviste allí",
      "how.prove.body":
        "Un cache con tag verification esconde una clave privada en el lugar, a menudo como código QR. Quien lo encuentra la escanea y firma con esa clave un evento kind 7517 que nombra su propio npub y el cache. Incluir ese evento en el registro de hallazgo demuestra la visita.",
      "how.dnf.title": "¿No lo encontraste?",
      "how.dnf.body":
        "Los demás registros son comentarios kind 1111 de NIP-22 sobre el listado, con un tag t: dnf, note, maintenance o archived (solo el propietario, para retirar un cache).",
      "how.trail.title": "Rutas",
      "how.trail.body":
        "Una lista de curación kind 37517 agrupa caches, de cualquier autor y en un orden fijo, en una ruta o búsqueda del tesoro.",
      "related.22": "Los registros que no son hallazgos son comentarios NIP-22 sobre el listado.",
      "related.19":
        "Las pruebas nombran a quien lo encontró por su npub y al cache por su naddr (NIP-19).",
      "related.52":
        "Como los eventos de calendario de NIP-52, los listados son eventos direccionables vinculados a un lugar.",
      "related.01": "Los listados y las listas son eventos direccionables (NIP-01).",
      "flow.verified-find.label": "Un hallazgo verificado",
      "flow.verified-find.explain":
        "Frank esconde un cache con una clave de verificación, Alice lo encuentra, firma una prueba con la clave del cache y lo registra.",
      "flow.verified-find.listing": "El listado de Frank incluye la pubkey de verificación.",
      "flow.verified-find.proof":
        "Alice usa la clave del código QR para firmar una prueba kind 7517 que la nombra.",
      "flow.verified-find.found":
        "Su registro de hallazgo incluye esa prueba como JSON en un tag verification.",
      "event.listing.label": "Listado de geocache",
      "event.listing.explain": "Kind 37516, direccionable: un cache escondido.",
      "content.listing": "Descripción del cache y todo lo que deberían saber quienes lo busquen.",
      "tag.d": "Identificador único de este cache entre los caches del propietario.",
      "tag.d.value": "Cualquier texto; termina formando parte de la dirección del cache.",
      "tag.name": "El nombre del cache.",
      "tag.name.value": "El texto del nombre.",
      "tag.g": "Geohash de la ubicación. Repítelo con distintas precisiones.",
      "tag.g.value": "Caracteres de geohash (0–9 y letras salvo a, i, l, o).",
      "tag.D": "Dificultad: lo difícil que es encontrar o resolver el cache.",
      "tag.T": "Terreno: lo difícil que es llegar al lugar.",
      "tag.rating.score": "Un número entero de 1 (fácil) a 5 (difícil).",
      "tag.S": "Tamaño del contenedor.",
      "tag.S.size": "Uno de micro, small, regular, large, other.",
      "size.micro": "Diminuto, como un bote de carrete de fotos.",
      "size.small": "Caben unos pocos objetos pequeños.",
      "size.regular": "Más o menos como una caja de zapatos.",
      "size.large": "Más grande que una caja de zapatos.",
      "size.other": "No encaja en los tamaños habituales.",
      "tag.t": "Tipo de cache. Si falta, es traditional.",
      "tag.t.type": "traditional, multi, mystery u otro tipo; archived marca un cache retirado.",
      "type.traditional": "La caja está en la ubicación indicada.",
      "type.multi": "Varias etapas llevan hasta la caja.",
      "type.mystery": "Resuelve un acertijo para obtener la ubicación.",
      "type.archived": "El propietario ha retirado este cache.",
      "tag.n":
        "Un modificador que cambia el comportamiento del cache. Como máximo uno por categoría.",
      "tag.n.modifier": "first-to-find o art; los modificadores desconocidos se ignoran.",
      "modifier.first-to-find":
        "Solo el primer hallazgo verificado lo reclama. Necesita un tag verification.",
      "modifier.art": "El propio cache es una obra de arte.",
      "tag.hint":
        "Una pista en texto plano. Los clientes pueden ocultarla con ROT13 para evitar spoilers.",
      "tag.hint.value": "El texto de la pista.",
      "tag.mission":
        "Una 'Key Quest': lo que hay que hacer para reclamar el cache. Solo se permite una.",
      "tag.mission.value": "El texto de la misión.",
      "tag.image": "Una foto.",
      "tag.image.url": "URL de la imagen.",
      "tag.r": "Un relay donde deberían publicarse los registros de este cache.",
      "tag.r.relay": "URL del relay.",
      "tag.verification":
        "Clave pública de la clave de verificación del cache, para hallazgos verificados.",
      "tag.verification.pubkey": "La pubkey, en hex. Su clave privada está escondida en el cache.",
      "tag.F": "Fija al ganador first-to-find; lo añade el propietario al archivar el cache.",
      "tag.F.winner": "Pubkey de quien lo encontró y ganó.",
      "example.old-oak": "Un cache tradicional",
      "example.old-oak.explain":
        "Tres precisiones de geohash, una pista en ROT13 ('Look among the roots', «busca entre las raíces») y una clave de verificación.",
      "example.linocut": "Arte first-to-find",
      "example.linocut.explain":
        "Dos modificadores de categorías distintas y una misión Key Quest.",
      "event.found.label": "Registro de hallazgo",
      "event.found.explain": "Kind 7516: «lo encontré».",
      "content.log": "El mensaje del registro.",
      "tag.a": "El cache que encontraste.",
      "tag.a.cache": "Dirección del listado: 37516:<pubkey del propietario>:<tag d>.",
      ...relayHint,
      "tag.found-verification": "Prueba de que estuviste en el cache: el evento kind 7517 firmado.",
      "tag.found-verification.proof":
        "El evento kind 7517 como string JSON, firmado con la clave del cache.",
      "example.verified": "El hallazgo verificado de Alice",
      "example.verified.explain":
        "El tag verification contiene una prueba real firmada con la clave del cache. Su tag a nombra a Alice, la autora de este registro.",
      "example.simple": "Un hallazgo simple",
      "event.proof.label": "Prueba de hallazgo",
      "event.proof.explain":
        "Kind 7517, firmado con la clave de verificación del cache (aquí la clave de demo de grace), no con la de quien lo encontró.",
      "content.proof": "Exactamente 'Geocache verification for <npub de quien lo encontró>'.",
      "tag.proof-a": "Quién encontró qué cache.",
      "tag.proof-a.value": "<pubkey hex de quien lo encontró>:<naddr del listado del cache>.",
      "example.proof": "Prueba para Alice",
      "example.proof.explain":
        "Firmada con la clave del código QR, nombra el npub de Alice y el naddr del cache.",
      "event.comment.label": "Comentario de registro",
      "event.comment.explain":
        "Kind 1111 (NIP-22): registros que no son hallazgos. El listado es a la vez raíz y padre.",
      "tag.root.a": "A: el listado, como raíz del hilo de comentarios.",
      "tag.root.a.addr": "Dirección del listado.",
      "tag.root.k": "K: siempre 37516.",
      "tag.root.k.kind": "El kind del listado.",
      "tag.root.p": "P: el propietario del cache.",
      "tag.root.p.pubkey": "Pubkey del propietario.",
      "tag.parent.a": "a: de nuevo el listado, como padre directo.",
      "tag.parent.a.addr": "Dirección del listado.",
      "tag.parent.k": "k: siempre 37516.",
      "tag.parent.k.kind": "El kind del listado.",
      "tag.parent.p": "p: el propietario del cache, para que reciba una notificación.",
      "tag.parent.p.pubkey": "Pubkey del propietario.",
      "tag.log-type": "Tipo de registro. Sin él, el registro es una nota.",
      "tag.log-type.type": "dnf, note, maintenance o archived.",
      "log.dnf": "No lo encontró.",
      "log.note": "Información útil o neutral.",
      "log.maintenance": "El cache necesita atención.",
      "log.archived": "El propietario retira el cache; su historial se conserva.",
      "example.dnf": "Bob no lo encontró",
      "example.dnf.explain":
        "Varios DNF seguidos indican a los demás que puede que el cache haya desaparecido.",
      "example.archive": "Frank retira el cache",
      "example.archive.explain": "Solo el registro archived del propietario retira un cache.",
      "event.curation.label": "Lista de curación",
      "event.curation.explain": "Kind 37517, direccionable: una ruta ordenada de caches.",
      "content.curation": "Descripción completa: reglas, consejos o historia.",
      "tag.title": "Nombre de la lista.",
      "tag.title.value": "El texto del título.",
      "tag.curation-a": "Un cache de la ruta. El orden importa.",
      "tag.curation-a.cache": "Dirección de un listado de cualquier autor.",
      "tag.description": "Resumen breve para tarjetas y vistas de exploración.",
      "tag.description.value": "El texto del resumen.",
      "tag.theme": "Tema de página predeterminado para la lista.",
      "tag.theme.value": "adventure o mojave.",
      "tag.map": "Estilo de mapa predeterminado.",
      "tag.map.value": "original, dark, satellite o adventure.",
      "example.park-trail": "La ruta del parque de Frank",
      "example.park-trail.explain":
        "Dos caches de Frank en orden, con un tema y un estilo de mapa.",
    },
  },
  nEE: {
    title: "Mensajería E2EE con el protocolo MLS",
    summary:
      "No recomendado, reemplazado por el protocolo Marmot. Definía chats directos y de grupo cifrados de extremo a extremo en Nostr usando MLS (RFC 9420), con secreto hacia adelante y seguridad poscompromiso.",
    text: {
      "how.status.title": "Reemplazado por Marmot",
      "how.status.body":
        "Este NIP está marcado como no recomendado: su trabajo continúa como el protocolo Marmot (github.com/marmot-protocol/marmot). Lee esta página para entender el diseño, y crea las apps nuevas sobre Marmot.",
      "how.why.title": "Por qué MLS",
      "how.why.body":
        "NIP-17 oculta quién habla con quién, pero usa claves de larga duración: si se filtra una, todos los mensajes se pueden leer. MLS cambia constantemente las claves del grupo, así que los mensajes antiguos siguen a salvo (secreto hacia adelante) y el grupo se recupera tras una filtración (seguridad poscompromiso), incluso en grupos grandes.",
      "how.key-package.title": "Publica un KeyPackage",
      "how.key-package.body":
        "Para poder recibir invitaciones, publicas un KeyPackage kind 443 con tu versión de MLS, ciphersuite y extensiones. Su clave de firma MLS debe ser distinta de tu clave de Nostr. El kind 10051 lista los relays donde los publicas.",
      "how.welcome.title": "Recibe la bienvenida",
      "how.welcome.body":
        "Un miembro del grupo te añade con un Commit de MLS y te envía un Welcome kind 444. El Welcome nunca se firma y viaja envuelto como regalo (gift wrap, NIP-59). Su tag e nombra el KeyPackage que se usó.",
      "how.group.title": "Mensajes de grupo",
      "how.group.body":
        "Cada mensaje de grupo es un kind 445 desde una clave nueva y desechable. Solo el tag h (el id de grupo de Nostr) es visible. El content está cifrado con NIP-44 usando una clave derivada del exporter secret de MLS de la época; dentro hay eventos de Nostr sin firmar, como chats kind 9.",
      "how.commits.title": "Commits en competencia",
      "how.commits.body":
        "Si llegan dos Commits para la misma época, gana el de created_at más bajo (y después el de id más bajo). Los emisores esperan a que un relay confirme un Commit antes de aplicarlo.",
      "related.17":
        "DMs privados de NIP-17: más simples, pero sin secreto hacia adelante ni grupos eficientes.",
      "related.44":
        "Los eventos de grupo se cifran con NIP-44 bajo una clave derivada del exporter secret de MLS.",
      "related.59": "Los eventos Welcome se sellan y se envuelven como regalo (NIP-59).",
      "related.70": "Los KeyPackages pueden llevar el tag protegido '-' (NIP-70).",
      "related.C7": "Los mensajes de aplicación descifrados suelen ser chats kind 9 (NIP-C7).",
      "flow.join.label": "Unirse a un grupo",
      "flow.join.explain":
        "Bob se hace localizable, Alice lo añade y él lee los mensajes del grupo.",
      "flow.join.relays": "Bob lista dónde viven sus KeyPackages (kind 10051).",
      "flow.join.key-package": "Bob publica un KeyPackage (kind 443).",
      "flow.join.welcome":
        "Alice hace commit de la incorporación y le envía un Welcome sin firmar y envuelto como regalo (kind 444).",
      "flow.join.group": "Ahora Bob puede descifrar los eventos kind 445 del grupo.",
      "event.key-package.label": "KeyPackage",
      "event.key-package.explain":
        "Kind 443, firmado con tu clave de Nostr: lo que otros necesitan para añadirte a un grupo MLS.",
      "content.key-package":
        "El KeyPackageBundle de MLS serializado, en hex. Aquí un sustituto corto, no un KeyPackage real.",
      "tag.mls_protocol_version": "Versión del protocolo MLS.",
      "tag.mls_protocol_version.value": "Actualmente siempre 1.0.",
      "tag.ciphersuite": "El ciphersuite de MLS que admite este KeyPackage.",
      "tag.ciphersuite.id": "Id del ciphersuite en hex, como 0x0001.",
      "tag.extensions": "Extensiones de MLS que admite este KeyPackage.",
      "tag.extensions.id":
        "Ids de extensión, como 0x0002 (ratchet_tree), 0x0003 (required_capabilities) o 0x000a (last_resort).",
      "tag.client":
        "Qué app creó este KeyPackage, para que otros puedan decirte dónde aceptar invitaciones.",
      "tag.client.name": "Nombre de la app.",
      "tag.client.handler": "Id opcional del evento manejador NIP-89 de la app.",
      "tag.client.relay": "Relay opcional para ese evento manejador.",
      "tag.relays": "Relays en los que se publica este KeyPackage, para poder borrarlo más tarde.",
      "tag.relays.relay": "Una URL de relay.",
      "tag.protected": "Tag '-' de NIP-70: los relays solo aceptan este evento de su autor.",
      "example.bob-package": "El KeyPackage de Bob",
      "example.bob-package.explain":
        "Un KeyPackage last-resort publicado en dos relays. El Welcome de más abajo apunta al id de este evento.",
      "event.key-package-relays.label": "Relays de KeyPackages",
      "event.key-package-relays.explain":
        "Kind 10051, reemplazable: dónde encontrar tus KeyPackages.",
      "content.empty": "Vacío: los relays están en los tags.",
      "tag.relay": "Un relay que guarda tus KeyPackages.",
      "tag.relay.url": "URL del relay.",
      "example.bob-relays": "Los relays de KeyPackages de Bob",
      "event.welcome.label": "Welcome",
      "event.welcome.explain":
        "Kind 444, nunca firmado (un rumor): se envía envuelto como regalo al nuevo miembro después del Commit que lo añade.",
      "content.welcome": "El mensaje Welcome de MLS serializado. Aquí un sustituto corto.",
      "tag.e": "El KeyPackage usado para añadirte.",
      "tag.e.id": "Id de ese evento kind 443.",
      "tag.welcome-relays": "Relays donde se publican los eventos kind 445 del grupo.",
      "example.welcome-bob": "Alice le da la bienvenida a Bob",
      "example.welcome-bob.explain":
        "Sin firmar a propósito: si se filtrara, no podría publicarse. Se sella y se envuelve como regalo antes de enviarlo.",
      "event.group-event.label": "Evento de grupo",
      "event.group-event.explain":
        "Kind 445: cada mensaje del grupo (Proposals, Commits y mensajes de aplicación), firmado con una clave nueva y desechable.",
      "content.group-event":
        "Carga útil NIP-44. La clave de conversación viene del exporter secret de la época, usado como clave privada junto con su propia clave pública.",
      "content.mls-message":
        "Un MLSMessage serializado. Los mensajes de aplicación contienen eventos de Nostr sin firmar y sin tag h.",
      "tag.h": "El id de grupo de Nostr, el único metadato del grupo que ven los relays.",
      "tag.h.id":
        "Id de grupo hex de 32 bytes. No es el id de grupo de MLS y los administradores pueden cambiarlo.",
      "example.application": "Un mensaje de grupo",
      "example.application.explain":
        "Cifrado bajo un exporter secret de demo. En la demo lo firma la clave de grace; los clientes reales usan una clave aleatoria nueva para cada evento.",
    },
  },
  nF4: {
    title: "Podcasts",
    summary:
      "Podcasts como feeds de Nostr: cada programa tiene su propio par de claves, publica la información del programa en kind 10154 y un evento kind 54 por episodio, y los presentadores confirman su autoría con kind 10164.",
    text: {
      "how.keypair.title": "Un podcast es un par de claves",
      "how.keypair.body":
        "Cada programa tiene su propia clave de Nostr. También puede publicar notas normales, y la clave se puede compartir o traspasar para cambiar de propietario.",
      "how.show.title": "Información del programa",
      "how.show.body":
        "El kind 10154 (reemplazable) contiene el título, la portada, la descripción, los sitios web y las personas detrás del programa con sus roles.",
      "how.episode.title": "Un evento por episodio",
      "how.episode.body":
        "Cada episodio es un evento kind 54 firmado con la clave del podcast: título, imagen, descripción y uno o más tags audio, con las notas del episodio en Markdown en el content. Los episodios se pueden obtener, paginar y compartir uno a uno, a diferencia de un archivo RSS.",
      "how.authors.title": "Confirmar la autoría",
      "how.authors.body":
        "Cualquiera puede nombrarte como presentador, así que los clientes comprueban la otra parte: tu propio evento kind 10164 lista los podcasts que haces. (El JSON de ejemplo del NIP dice 10064, pero su texto dice 10164.)",
      "how.listen.title": "Escucha e interactúa",
      "how.listen.body":
        "Como los episodios son eventos de Nostr, los oyentes pueden darles me gusta, comentarlos o enviarles zaps, y los programas favoritos se pueden listar con NIP-51 (kind 10054).",
      "related.51": "El kind 10054 de NIP-51 lista los podcasts que recomiendas.",
      "related.B7": "Los archivos de audio pueden alojarse en servidores Blossom.",
      "related.25": "Los oyentes reaccionan a los episodios como a cualquier otro evento.",
      "related.01": "Los tres kinds son eventos NIP-01 normales.",
      "flow.authorship.label": "Presentadores verificados",
      "flow.authorship.explain":
        "El programa declara a sus presentadores; la propia lista de cada presentador lo confirma. Los clientes muestran la declaración solo cuando ambos coinciden.",
      "flow.authorship.show": "El kind 10154 del programa nombra a Alice como presentadora.",
      "flow.authorship.authored":
        "El kind 10164 de Alice lista la pubkey del programa, lo que lo confirma.",
      "event.show.label": "Metadatos del podcast",
      "event.show.explain":
        "Kind 10154, reemplazable, firmado con la clave del podcast: el programa en sí.",
      "content.empty": "Vacío: todo está en los tags.",
      "tag.title": "Título.",
      "tag.title.value": "El texto del título.",
      "tag.image": "Imagen de portada.",
      "tag.image.url": "URL de la imagen.",
      "tag.description": "Descripción breve.",
      "tag.description.value": "El texto de la descripción.",
      "tag.website": "Un sitio web del programa. Se puede repetir.",
      "tag.website.url": "URL del sitio web.",
      "tag.p":
        "Una persona que participa en el programa. Solo se confirma con su propio kind 10164.",
      "tag.p.pubkey": "Su pubkey.",
      "tag.p.role": "Rol opcional: host, cohost o editor.",
      "role.host": "Dirige el programa.",
      "role.cohost": "Copresentador habitual.",
      "role.editor": "Edita los episodios.",
      "example.relay-hour": "The Relay Hour",
      "example.relay-hour.explain":
        "Firmado con la clave del programa (la clave de demo de grace), con Alice y Bob como presentadores.",
      "event.authored.label": "Podcasts de autoría propia",
      "event.authored.explain":
        "Kind 10164, firmado por una persona: los podcasts de los que realmente es autora.",
      "tag.authored-p": "Un podcast del que eres autor.",
      "tag.authored-p.pubkey": "La pubkey del podcast.",
      "example.alice-hosts": "Alice lo confirma",
      "example.alice-hosts.explain":
        "Alice lista la pubkey de The Relay Hour, lo que coincide con la declaración del programa.",
      "event.episode.label": "Episodio",
      "event.episode.explain": "Kind 54, firmado con la clave del podcast: un episodio.",
      "content.notes": "Notas del episodio en Markdown.",
      "tag.audio": "Un archivo de audio del episodio. Repítelo para otros formatos.",
      "tag.audio.url": "URL directa del archivo de audio.",
      "tag.audio.type": "Tipo MIME opcional, como audio/mpeg.",
      "example.episode-1": "Episodio 1",
      "example.episode-1.explain":
        "Dos formatos de audio para que los reproductores elijan, y notas del episodio en Markdown.",
    },
  },
};
