// Owner: translation agents. Must structurally match ../../en/nips/r2.ts (enforced by the type).
import type { r2 as en } from "../../en/nips/r2.ts";

export const r2: typeof en = {
  n20: {
    title: "Resultados de comandos",
    summary:
      "Obsoleto: ahora forma parte de NIP-01. Definía el mensaje OK que un relay devuelve tras publicar un evento, indicando si lo guardó y, si no, por qué.",
    text: {
      "how.moved.title": "Este NIP ahora vive en NIP-01",
      "how.moved.body":
        "NIP-20 se integró en NIP-01, así que se espera que todo relay responda con OK. Consulta NIP-01 para las reglas actuales; esta página conserva la explicación para enlaces antiguos.",
      "how.send.title": "El cliente publica un evento",
      "how.send.body":
        'El cliente envía ["EVENT", <evento>] al relay. Antes de NIP-20 no tenía forma de saber si el relay guardaba el evento.',
      "how.ok.title": "El relay responde con OK",
      "how.ok.body":
        "El relay responde con el id del evento y true o false. true significa guardado (o ya guardado); false significa rechazado.",
      "how.prefix.title": "Un motivo legible por máquinas",
      "how.prefix.body":
        'El último elemento es un mensaje. Cuando empieza con un prefijo conocido como "blocked:", "rate-limited:" o "auth-required:", el cliente puede reaccionar automáticamente, por ejemplo iniciando sesión o esperando.',
      "related.01": "El mensaje OK y sus prefijos ahora se definen en NIP-01.",
      "related.42":
        'NIP-42 añade el prefijo "auth-required:" para relays que necesitan que inicies sesión primero.',
      "related.13": 'La prueba de trabajo de NIP-13 es de lo que trata el prefijo "pow:".',
      "msg.ok.label": "OK (resultado del comando)",
      "msg.ok.explain":
        "Lo envía un relay en respuesta a cada EVENT que publica un cliente, para que el cliente sepa si el evento fue aceptado.",
      "msg.ok.event-id":
        "El id del evento al que se refiere este resultado, copiado del EVENT que envió el cliente.",
      "msg.ok.accepted": "true si el relay guardó el evento (o ya lo tenía), false si lo rechazó.",
      "msg.ok.message":
        'Texto legible para el usuario. Cuando el evento se rechaza debería empezar con un prefijo como "invalid:", "pow:", "blocked:", "rate-limited:", "restricted:", "mute:", "error:" o "auth-required:", seguido de un espacio. Puede estar vacío si el evento se acepta.',
      "example.accepted": "Aceptado",
      "example.duplicate": "Ya guardado",
      "example.duplicate.explain":
        'Un duplicado sigue siendo un éxito (true); el prefijo "duplicate:" solo le dice al cliente que no pasó nada nuevo.',
      "example.blocked": "Rechazado por política",
      "example.blocked.explain":
        "Un relay de pago que rechaza a alguien que no es miembro. false más el prefijo blocked: le indica al cliente que pruebe otro relay.",
      "actor.client": "Cliente",
      "actor.relay": "Relay",
      "step.event.label": "EVENT",
      "step.event.explain": "El cliente de Alice publica una nota firmada en el relay.",
      "step.check.label": "Validar y aplicar la política",
      "step.check.explain":
        "El relay comprueba el id y la firma, y luego sus propias reglas: límites de tamaño, filtros de spam, membresía, prueba de trabajo.",
      "step.ok-true.label": "OK true",
      "step.ok-true.explain":
        "Guardado. El cliente puede marcar la nota como publicada en este relay.",
      "step.ok-false.label": "OK false",
      "step.ok-false.explain":
        "Rechazado, con un motivo con prefijo. Aquí el cliente envía demasiado rápido y debería esperar y reintentar más tarde.",
    },
  },
  n21: {
    title: "Esquema de URI nostr:",
    summary:
      'Pon "nostr:" delante de un código NIP-19 (npub, nprofile, note, nevent, naddr) y obtienes un enlace que cualquier app de Nostr puede abrir, dentro de notas, en páginas web o en códigos QR.',
    text: {
      "how.entity.title": "Parte de un código NIP-19",
      "how.entity.body":
        "Elige a qué quieres apuntar: un perfil (npub, nprofile), una nota (note, nevent) o un evento direccionable como un artículo (naddr).",
      "how.prefix.title": 'Añade el esquema "nostr:"',
      "how.prefix.body":
        'La URI es simplemente "nostr:" seguido del código, sin nada en medio. No hay barras ni query string.',
      "how.no-nsec.title": "Nunca para claves secretas",
      "how.no-nsec.body":
        "Sirve cualquier código NIP-19 excepto nsec. Un enlace está pensado para compartirse, y compartir tu clave secreta es regalar tu identidad.",
      "how.open.title": "Las apps lo abren",
      "how.open.body":
        "El sistema operativo entrega los enlaces nostr: a una app de Nostr instalada. Dentro de una nota, los clientes los convierten en menciones o vistas previas (eso es NIP-27).",
      "how.html.title": "Enlazar páginas web con Nostr",
      "how.html.body":
        'Una página web puede decir "esto también está en Nostr" con <link rel="alternate" href="nostr:naddr1…">, o nombrar a su autor con rel="me" o rel="author" apuntando a un nprofile.',
      "related.19": "Los códigos tras nostr: son exactamente las entidades bech32 de NIP-19.",
      "related.27":
        "NIP-27 usa URIs nostr: para mencionar perfiles y notas dentro del texto de una nota.",
      "related.23": "Los artículos (kind 30023) suelen enlazarse con URIs nostr:naddr.",
      "enc.uri.label": "URI nostr:",
      "enc.uri.explain":
        "Convierte un código NIP-19 en un enlace clicable que entiende cualquier cliente de Nostr o manejador del sistema operativo.",
      "enc.uri.entity":
        "Un código NIP-19: npub, nprofile, note, nevent o naddr. nsec no está permitido.",
      "enc.uri.output":
        'El resultado es "nostr:" seguido del código sin cambios. Decodificar es lo inverso: quita "nostr:" y decodifica la parte NIP-19.',
      "example.npub": "Perfil de Alice",
      "example.nevent": "Nota de Erin, con una pista de relay",
      "example.nevent.explain":
        "nevent lleva el id de la nota más un relay donde encontrarla, el autor y el kind, para que las apps la obtengan rápido.",
      "example.naddr": "Artículo de Frank",
      "example.naddr.explain":
        "naddr apunta a un evento direccionable por kind, autor y tag d, así que el enlace sigue funcionando después de editar el artículo.",
    },
  },
  n22: {
    title: "Comentario",
    summary:
      "Comentarios kind 1111: un hilo de respuestas que puedes colgar de cualquier cosa, un artículo, un archivo, un episodio de podcast o una URL web, usando tags en mayúscula para la raíz y en minúscula para el padre.",
    text: {
      "rule.root":
        "Un comentario debe nombrar su raíz con una de E (id de evento), A (dirección) o I (id externo).",
      "rule.parent":
        "Un comentario debe nombrar a su padre con una de e (id de evento), a (dirección) o i (id externo); en un comentario de primer nivel el padre es la raíz.",
      "how.root.title": "Apunta a la raíz con tags en mayúscula",
      "how.root.body":
        "Cada comentario nombra aquello de lo que trata todo el hilo: E para un id de evento, A para un evento direccionable o I para algo fuera de Nostr, como una URL. P nombra al autor de la raíz.",
      "how.parent.title": "Apunta al padre con tags en minúscula",
      "how.parent.body":
        "e, a o i nombran lo que respondes directamente, y p a su autor. En un comentario de primer nivel el padre es la propia raíz, así que los mismos valores aparecen dos veces.",
      "how.kinds.title": "Indica siempre los kinds",
      "how.kinds.body":
        'K y k son obligatorios: el kind de la raíz y el del padre ("30023" para un artículo, "1111" al responder a un comentario, o un tipo NIP-73 como "web"). Cada comentario necesita exactamente una etiqueta raíz (E, A o I) y una etiqueta padre (e, a o i). Las notas kind 1 quedan fuera: a esas se responde con NIP-10.',
      "how.external.title": "Comenta sobre el mundo exterior",
      "how.external.body":
        'Con los tags I e i (NIP-73) puedes comentar una página web, un episodio de podcast, un ISBN de libro o un hashtag. K es entonces el tipo de identificador, como "web".',
      "how.plain.title": "Solo texto plano",
      "how.plain.body":
        "El contenido es texto plano: sin HTML y sin Markdown. Las menciones usan URIs nostr: (NIP-21) con tags q y p opcionales.",
      "related.10":
        "NIP-10 organiza en hilos las notas kind 1; NIP-22 es el modelo de hilos para todo lo demás.",
      "related.73":
        "NIP-73 define los identificadores externos usados en los tags I/i y sus tipos K/k.",
      "related.23": "Las respuestas a artículos largos deben ser comentarios NIP-22.",
      "related.21": "Las citas y menciones dentro del comentario son URIs nostr:.",
      "event.comment.label": "Comentario (kind 1111)",
      "event.comment.explain":
        "Un comentario en texto plano asociado a una raíz (evento, dirección o id externo) y a un elemento padre.",
      content: "El texto del comentario. Texto plano: sin HTML ni formato Markdown.",
      "tag.relay": "URL opcional de un relay donde encontrar el evento referenciado.",
      "tag.root.e": "La raíz es un evento normal: su id. Usa uno de E, A o I.",
      "tag.root.e.id": "Id del evento en la raíz del hilo.",
      "tag.root.e.pubkey":
        "Pubkey opcional del autor del evento raíz, para que los clientes lo encuentren en los relays del autor.",
      "tag.root.a":
        "La raíz es un evento direccionable (un artículo, un repositorio…): su dirección kind:pubkey:d.",
      "tag.root.a.addr": "Dirección del evento raíz como kind:pubkey:d-tag.",
      "tag.root.i": "La raíz es algo fuera de Nostr: un identificador NIP-73, como una URL.",
      "tag.i.value":
        'Un identificador externo NIP-73: una URL, "podcast:item:guid:…", "isbn:…", "#hashtag", etc.',
      "tag.i.hint": "Página web opcional donde se puede ver el elemento externo.",
      "tag.root.k":
        'Kind del elemento raíz: un número de kind como "30023" o un tipo NIP-73 como "web". Obligatorio.',
      "tag.k.value":
        'Un número de kind como texto ("30023", "1111") o un tipo de identificador NIP-73 ("web", "podcast:item:guid"). Nunca "1": a las notas kind 1 se responde con respuestas NIP-10, no con comentarios.',
      "tag.root.p": "Autor del evento raíz, para que reciba la notificación.",
      "tag.root.p.pubkey": "Pubkey del autor del evento raíz.",
      "tag.parent.e": "El padre es un evento normal (a menudo otro comentario): su id.",
      "tag.parent.e.id": "Id del evento al que respondes directamente.",
      "tag.parent.e.pubkey": "Pubkey opcional del autor del evento padre.",
      "tag.parent.a":
        "El padre es un evento direccionable. Añade también un tag e con su id actual.",
      "tag.parent.a.addr": "Dirección del evento padre como kind:pubkey:d-tag.",
      "tag.parent.i":
        "El padre es un elemento externo (el mismo valor que I en un comentario de primer nivel).",
      "tag.parent.k":
        'Kind del elemento padre. "1111" cuando respondes a otro comentario. Obligatorio.',
      "tag.parent.p": "Autor del elemento padre, para que reciba la notificación de la respuesta.",
      "tag.parent.p.pubkey": "Pubkey del autor del elemento padre.",
      "tag.q": "Cita: un evento o dirección citado en el contenido con una URI nostr:.",
      "tag.q.target": "Id del evento (64 hex) o dirección (kind:pubkey:d) que se cita.",
      "tag.q.pubkey": "Autor del evento citado, cuando es un evento normal.",
      "example.on-article": "Comentario en un artículo",
      "example.on-article.explain":
        "Carol comenta el artículo de Frank. Es de primer nivel, así que la raíz (A, K, P) y el padre (a, k, p) son el mismo artículo, más un tag e con el id actual del artículo.",
      "example.reply": "Respuesta a un comentario",
      "example.reply.explain":
        'Frank responde a Carol. La raíz sigue apuntando al artículo; el padre es el comentario de Carol, así que k es "1111".',
      "example.on-url": "Comentario en una página web",
      "example.on-url.explain":
        'Grace comenta una URL. I e i contienen la URL, y K y k son "web". Sin P ni p: no hay un autor de Nostr a quien notificar.',
    },
  },
  n23: {
    title: "Contenido de formato largo",
    summary:
      "Artículos y entradas de blog como kind 30023: contenido Markdown más tags de título, resumen, imagen y hashtags. Cada artículo tiene un tag d, así que puedes editarlo y los enlaces siguen apuntando a la última versión.",
    text: {
      "how.markdown.title": "Escribe en Markdown",
      "how.markdown.body":
        "El contenido es Markdown. No cortes los párrafos a 80 columnas ni incrustes HTML, para que todos los clientes lo muestren igual.",
      "how.d.title": "Dale un tag d",
      "how.d.body":
        "kind 30023 es direccionable: el tag d es el slug del artículo. Publicar de nuevo con el mismo d reemplaza la versión anterior en los relays, y así funciona la edición.",
      "how.meta.title": "Añade metadatos opcionales",
      "how.meta.body":
        "Los tags title, summary e image permiten a los clientes mostrar una tarjeta sin analizar el Markdown. Los tags t añaden hashtags en minúscula.",
      "how.dates.title": "Dos fechas",
      "how.dates.body":
        "created_at es cuándo se guardó esta versión (la última edición). published_at conserva la fecha en que el artículo salió por primera vez, para que las ediciones no lo hagan parecer nuevo.",
      "how.link.title": "Enlázalo con naddr",
      "how.link.body":
        "Comparte un artículo como naddr de NIP-19 (kind + autor + d), o referéncialo desde otros eventos con un tag a. Las menciones dentro del texto siguen NIP-27.",
      "how.drafts.title": "Borradores y respuestas",
      "how.drafts.body":
        "El antiguo kind 30024 para borradores está obsoleto: guarda los borradores con NIP-37. Las respuestas a un artículo son comentarios NIP-22 kind 1111, no notas kind 1.",
      "related.01":
        "Los eventos direccionables (reemplazo por kind:pubkey:d) se definen en NIP-01.",
      "related.19": "naddr es el código NIP-19 que se usa para compartir un artículo.",
      "related.27":
        "Las referencias dentro del artículo usan enlaces nostr: como se describe en NIP-27.",
      "related.22": "Los comentarios en un artículo son eventos NIP-22 kind 1111.",
      "related.37":
        "Los envoltorios de borrador de NIP-37 reemplazan a los borradores kind 30024 obsoletos.",
      "event.article.label": "Artículo (kind 30023)",
      "event.article.explain":
        "Una publicación larga y editable. Los clientes muestran la última versión para cada autor + tag d.",
      content:
        "El cuerpo del artículo en Markdown. Sin saltos de línea dentro de los párrafos y sin HTML.",
      "tag.d":
        "Identificador del artículo para este autor. Mismo d = mismo artículo, versión más nueva.",
      "tag.d.value": 'Un slug estable como "how-relays-work". Mantenlo al editar.',
      "tag.title": "El título del artículo.",
      "tag.title.value": "Título que se muestra sobre el artículo y en las vistas previas.",
      "tag.summary": "Un resumen breve para vistas previas y feeds.",
      "tag.summary.value": "Una o dos frases que describen el artículo.",
      "tag.published_at": "Cuándo se publicó el artículo por primera vez.",
      "tag.published_at.value":
        "Timestamp Unix en segundos, como string. No cambia entre ediciones, a diferencia de created_at.",
      "tag.image": "Una imagen de cabecera que se muestra junto al título.",
      "tag.image.value": "URL de la imagen.",
      "tag.t": "Un hashtag (tema) para descubrir contenido.",
      "tag.t.value": 'Tema en minúscula sin el #, por ejemplo "relays".',
      "tag.e": "Una nota referenciada en el artículo.",
      "tag.e.id": "Id del evento referenciado.",
      "tag.relay": "Relay opcional donde encontrar el elemento referenciado.",
      "tag.a": "Otro evento direccionable (a menudo otro artículo) referenciado en el texto.",
      "tag.a.addr": "Dirección como kind:pubkey:d-tag.",
      "tag.p": "Un perfil mencionado en el artículo, para que reciba la notificación.",
      "tag.p.pubkey": "Pubkey de la persona mencionada.",
      "example.essay": "Ensayo de Frank",
      "example.essay.explain":
        "Un artículo con forma real: slug d, título, resumen, un published_at anterior a created_at (se editó después) y dos hashtags.",
      "example.with-refs": "Artículo con referencias",
      "example.with-refs.explain":
        "Alice enlaza la nota de Bob y el artículo de Frank con URIs nostr:, y añade los tags e y a correspondientes para que los clientes de sus autores muestren la mención.",
      "event.draft.label": "Borrador (kind 30024, obsoleto)",
      "event.draft.explain":
        "La forma antigua de guardar un artículo sin publicar: los mismos tags que kind 30023, con el Markdown cifrado para ti mismo con NIP-04. Aún aparece en los relays, pero las apps nuevas deberían guardar borradores con NIP-37.",
      "draft.content":
        "El cuerpo del borrador, cifrado con NIP-04 del autor a su propia pubkey, para que solo él pueda leerlo.",
      "draft.plaintext":
        "Lo que sale al descifrar: el Markdown del artículo, igual que en un kind 30023.",
      "example.draft": "Borrador de Frank (obsoleto)",
      "example.draft.explain":
        "Frank guarda un artículo a medio escribir. Solo el tag d es público; el texto está cifrado con su propia clave. Hoy usaría un envoltorio de borrador NIP-37.",
    },
  },
  n24: {
    title: "Campos y tags de metadatos extra",
    summary:
      "Un catálogo de extras muy usados que ningún otro NIP define: campos de perfil como display_name, website, banner, bot y birthday, más los tags genéricos r, i, title y t.",
    text: {
      "how.display-name.title": "name y display_name",
      "how.display-name.body":
        "name es el alias corto y siempre debería estar definido. display_name es un nombre más largo que puede usar cualquier carácter y emoji.",
      "how.extras.title": "Más campos de perfil",
      "how.extras.body":
        "website, banner (una imagen de cabecera ancha) y birthday son opcionales. bot: true avisa a los lectores de que la cuenta está total o parcialmente automatizada.",
      "how.deprecated.title": "Campos que ya no se deben usar",
      "how.deprecated.body":
        "displayName y username son grafías antiguas: escribe display_name y name en su lugar. El mapa de relays que antes iba en el content del kind 3 se reemplaza por la lista de relays de NIP-65.",
      "how.tags.title": "Tags que significan lo mismo en todas partes",
      "how.tags.body":
        "Salvo que un NIP más específico diga otra cosa, r es una URL a la que se refiere el evento, i un id externo (NIP-73), title un nombre para listas y anuncios, y t un hashtag en minúscula.",
      "related.01": "Los metadatos de perfil kind 0 se definen en NIP-01; NIP-24 les añade campos.",
      "related.02": "Las listas de seguidos kind 3 se definen en NIP-02.",
      "related.65":
        "Las listas de relays kind 10002 de NIP-65 reemplazan el mapa de relays en el content del kind 3.",
      "related.73": "El tag i lleva ids de contenido externo de NIP-73.",
      "event.profile.label": "Metadatos de perfil (kind 0)",
      "event.profile.explain": "Tu perfil público, con los campos extra que estandariza NIP-24.",
      "content.profile": "Objeto JSON serializado con los campos del perfil.",
      "schema.profile":
        "Campos del perfil. Se permiten campos desconocidos; los clientes ignoran lo que no conocen.",
      "field.name": "Nombre corto o alias. Defínelo siempre, aunque exista display_name.",
      "field.display_name":
        "Un nombre para mostrar más largo y rico. Puede incluir espacios y emoji.",
      "field.about": "Una biografía breve.",
      "field.picture": "URL de la imagen de avatar.",
      "field.website": "Una página web relacionada con el autor.",
      "field.banner":
        "URL de una imagen ancha (unos 1024×768) que se muestra detrás de la cabecera del perfil.",
      "field.bot":
        "true si el contenido de la cuenta está total o parcialmente automatizado (un feed, un chatbot).",
      "field.birthday": "Fecha de nacimiento como objeto. Se puede omitir el año, el mes o el día.",
      "field.birthday.year": "Año, por ejemplo 1990.",
      "field.birthday.month": "Mes del 1 al 12.",
      "field.birthday.day": "Día del mes del 1 al 31.",
      "field.displayName": "Grafía obsoleta: usa display_name.",
      "field.username": "Obsoleto: usa name.",
      "event.contacts-relays.label": "Mapa de relays en la lista de seguidos (kind 3, obsoleto)",
      "event.contacts-relays.explain":
        "Los clientes antiguos guardaban los relays del usuario en el content de la lista de seguidos kind 3. Se muestra aquí para que lo reconozcas; publica una lista de relays NIP-65 en su lugar.",
      "content.contacts-relays":
        "Obsoleto: un objeto JSON que asocia URLs de relay a indicadores de lectura/escritura.",
      "schema.contacts-relays": "URL del relay → { read, write }. Obsoleto en favor de NIP-65.",
      "schema.contacts-relays.entry": "Cómo se usa este relay.",
      "field.read": "true si el usuario lee de este relay.",
      "field.write": "true si el usuario publica en este relay.",
      "tag.p": "Un perfil seguido (NIP-02).",
      "tag.p.pubkey": "Pubkey de la persona seguida.",
      "tag.p.petname": "Apodo local opcional para esta persona.",
      "tag.relay": "Relay opcional donde publica esta persona.",
      "event.tags.label": "Tags genéricos (cualquier kind)",
      "event.tags.explain":
        "Tags con un significado compartido en cualquier kind de evento, salvo que un NIP más específico los defina de otra forma.",
      "content.tags": "El propio content del evento; NIP-24 no dice nada sobre él.",
      "tag.r": "Una URL web a la que se refiere el evento.",
      "tag.r.url": "La URL.",
      "tag.i": "Un identificador externo al que se refiere el evento (NIP-73).",
      "tag.i.value": 'Un id NIP-73 como "isbn:…", "podcast:guid:…" o una URL.',
      "tag.i.hint": "URL opcional donde se puede ver el elemento.",
      "tag.title":
        "Un nombre para un conjunto NIP-51, un evento de calendario NIP-52, un evento en vivo NIP-53 o un anuncio NIP-99.",
      "tag.title.value": "El texto del título.",
      "tag.t": "Un hashtag.",
      "tag.t.value": "El tema, en minúscula y sin el #.",
      "example.full": "Perfil con campos extra",
      "example.full.explain":
        "Erin define name y display_name, un website, un banner y un birthday sin año.",
      "example.bot": "Cuenta bot",
      "example.bot.explain":
        "La cuenta automatizada de estado de Dave indica bot: true para que los clientes la etiqueten.",
      "example.legacy": "Mapa de relays heredado (obsoleto)",
      "example.legacy.explain":
        "Cómo guardaban los relays los clientes antiguos. Todavía se encuentra por ahí; los clientes nuevos deberían leer y escribir kind 10002 en su lugar.",
      "example.note": "Nota con tags genéricos",
      "example.note.explain":
        "Una nota kind 1 que se refiere a una URL (r), un libro (i) y dos hashtags (t).",
    },
  },
  n25: {
    title: "Reacciones",
    summary:
      'Me gusta, no me gusta y reacciones con emoji como eventos kind 7 que apuntan a la nota a la que reaccionaste. "+" es un me gusta, "-" un no me gusta y cualquier otra cosa un emoji. El kind 17 hace lo mismo para páginas web y otras cosas fuera de Nostr.',
    text: {
      "how.content.title": "El content es la reacción",
      "how.content.body":
        '"+" (o un string vacío) significa me gusta, "-" significa no me gusta. Cualquier otro emoji, o un emoji personalizado :shortcode:, se muestra tal cual y no cuenta como ninguno de los dos.',
      "how.target.title": "Apunta al evento",
      "how.target.body":
        "Es obligatorio un tag e con el id del evento al que reaccionas. Añade una pista de relay y la pubkey del autor para que otros lo encuentren. Si añades más tags e, el objetivo debe ser el último.",
      "how.author.title": "Notifica al autor",
      "how.author.body":
        "Un tag p con la pubkey del autor le permite ver la reacción. Para un evento direccionable como un artículo, añade también un tag a y un tag k con el kind del objetivo.",
      "how.emoji.title": "Emoji personalizado",
      "how.emoji.body":
        "Pon exactamente un :shortcode: en el content y un tag emoji de NIP-30 que coincida, con la URL de la imagen. Los clientes que lo soportan muestran la imagen.",
      "how.external.title": "Reaccionar a cosas fuera de Nostr",
      "how.external.body":
        "Para reaccionar a un sitio web o un episodio de podcast, publica un kind 17 en su lugar, con tags k (tipo) e i (identificador) de NIP-73.",
      "related.30": "Las reacciones con emoji personalizado usan tags emoji de NIP-30.",
      "related.73": "Las reacciones externas kind 17 usan los tags k e i de NIP-73.",
      "related.01": "Los tags e, p y a y las pistas de relay funcionan como se define en NIP-01.",
      "event.reaction.label": "Reacción (kind 7)",
      "event.reaction.explain": "Una reacción a otro evento de Nostr.",
      "content.reaction":
        '"+" o vacío = me gusta, "-" = no me gusta, un emoji o un :shortcode: = reacción con emoji.',
      "tag.e":
        "El evento al que se reacciona. Obligatorio; si hay varios tags e, el objetivo es el último.",
      "tag.e.id": "Id del evento al que reaccionas.",
      "tag.e.pubkey": "Autor de ese evento, como pista para encontrarlo.",
      "tag.relay": "Un relay donde se puede encontrar el objetivo (o su autor).",
      "tag.p":
        "Autor del evento al que se reacciona, para que reciba la notificación. El autor del objetivo va al final.",
      "tag.p.pubkey": "Pubkey del autor del evento objetivo.",
      "tag.a":
        "Para eventos direccionables (artículos…): la dirección del objetivo, junto al tag e.",
      "tag.a.addr": "Dirección del evento al que se reacciona como kind:pubkey:d-tag.",
      "tag.k": "Kind del evento al que se reacciona.",
      "tag.k.kind": 'El kind como string, p. ej. "1" o "30023".',
      "tag.emoji": "El emoji personalizado de NIP-30 usado en el content. Solo uno.",
      "tag.emoji.shortcode": "Nombre del emoji: solo letras, dígitos, - y _, sin los dos puntos.",
      "tag.emoji.image": "URL de la imagen del emoji.",
      "tag.emoji.set": "Dirección opcional del conjunto de emoji kind 30030 del que procede.",
      "event.external.label": "Reacción externa (kind 17)",
      "event.external.explain":
        "Una reacción a algo que no es un evento de Nostr: un sitio web, un podcast, un libro.",
      "tag.ext.k": "Tipo NIP-73 de aquello a lo que reaccionas. Va emparejado con un tag i.",
      "tag.ext.k.type": 'Por ejemplo "web", "podcast:guid" o "podcast:item:guid".',
      "tag.ext.i": "Identificador NIP-73 de aquello a lo que reaccionas.",
      "tag.ext.i.value": "El identificador: una URL, o un id con prefijo como podcast:item:guid:….",
      "tag.ext.i.hint": "Página web opcional donde se puede ver el elemento.",
      "example.like": "Dar me gusta a una nota",
      "example.like.explain":
        "A Alice le gusta el dibujo de avestruz de Erin: e con pistas de relay y autor, p para Erin, k = 1.",
      "example.article": "Dar me gusta a un artículo",
      "example.article.explain":
        "A Erin le gusta el artículo de Frank. Como es direccionable, hay un tag a junto al tag e.",
      "example.custom-emoji": "Reacción con emoji personalizado",
      "example.custom-emoji.explain":
        "Bob reacciona con :ostrich:. El tag emoji indica a los clientes qué imagen dibujar.",
      "example.website": "Destacar una página web",
      "example.podcast": "Dar me gusta a un episodio de podcast",
      "example.podcast.explain":
        "Dos pares k/i: el programa (podcast:guid) y el episodio (podcast:item:guid), cada uno con un enlace.",
    },
  },
  n26: {
    title: "Firma delegada de eventos",
    summary:
      "No recomendado: usa la firma remota de NIP-46 en su lugar. Permite que una clave publique en nombre de otra mediante un tag de delegación firmado, limitado por kind y ventana de tiempo.",
    text: {
      "how.unrecommended.title": "No recomendado: usa NIP-46",
      "how.unrecommended.body":
        "Para que funcione, todos los clientes y relays tienen que entender la delegación, lo cual es mucho trabajo para poca ganancia. Para mantener a salvo tu clave principal, usa un firmante remoto NIP-46 (bunker).",
      "how.conditions.title": "Escribe las condiciones",
      "how.conditions.body":
        'El delegante elige qué puede hacer la otra clave, por ejemplo "kind=1&created_at>…&created_at<…": solo notas, solo dentro de una ventana de tiempo. Define siempre ambos límites de tiempo.',
      "how.token.title": "Firma el string de delegación",
      "how.token.body":
        'El delegante firma sha256("nostr:delegation:<pubkey del delegado>:<condiciones>") con una firma Schnorr. Esa firma de 64 bytes es el token.',
      "how.publish.title": "El delegado publica",
      "how.publish.body":
        "El delegado firma un evento normal con su propia clave y añade el tag delegation: pubkey del delegante, condiciones, token.",
      "how.verify.title": "Los lectores verifican y atribuyen",
      "how.verify.body":
        "Un cliente compatible verifica el token contra la pubkey del delegante, comprueba que el evento cumple las condiciones y luego lo muestra como si lo hubiera publicado el delegante.",
      "related.46":
        "La firma remota de NIP-46 es la forma recomendada de mantener tu clave principal fuera de los dispositivos.",
      "related.01":
        "El evento delegado sigue siendo un evento NIP-01 corriente firmado por el delegado.",
      "event.delegated.label": "Evento delegado",
      "event.delegated.explain":
        "Cualquier evento firmado por una clave delegada que lleva un tag delegation que demuestra que el delegante lo permitió.",
      content: "El content normal del evento; la delegación no lo cambia.",
      "tag.delegation":
        "Prueba de que el delegante permitió a esta clave publicar este kind de evento en esta ventana de tiempo.",
      "tag.delegation.delegator":
        "Pubkey del delegante: la identidad en cuyo nombre se publica el evento.",
      "tag.delegation.conditions":
        'Reglas unidas con &: "kind=N" permite un kind; "created_at<T" y "created_at>T" acotan el tiempo.',
      "tag.delegation.token":
        'Firma Schnorr del delegante (64 bytes, hex) sobre sha256("nostr:delegation:<pubkey del delegado>:<condiciones>").',
      "example.note": "Bob publica en nombre de Alice",
      "example.note.explain":
        "Alice permitió a la clave de Bob publicar notas kind 1 en su nombre durante un mes desde el 31 de diciembre de 2024. Bob firma; los clientes compatibles la muestran como nota de Alice.",
    },
  },
  n27: {
    title: "Referencias en notas de texto",
    summary:
      "Cómo mencionar personas y citar eventos dentro del texto de una nota: escribe enlaces nostr: en el content y añade tags p o q cuando quieras notificar a la persona o que la cita cuente.",
    text: {
      "how.write.title": "Las menciones viven en el texto",
      "how.write.body":
        'Cuando escribes "@mattn" y eliges un perfil, el cliente escribe nostr:nprofile1… (o nostr:npub1…) en el content en ese punto. Los eventos funcionan igual con nostr:nevent1…, nostr:note1… o nostr:naddr1….',
      "how.tags.title": "Los tags deciden quién recibe la notificación",
      "how.tags.body":
        "Añadir un tag p para una persona mencionada la notifica. Añadir un tag q para un evento citado permite que ese evento cuente la mención. Ambos son opcionales.",
      "how.read.title": "Los lectores convierten los enlaces en nombres y vistas previas",
      "how.read.body":
        "Un cliente lector encuentra los enlaces nostr: en el content, los decodifica, obtiene el perfil o el evento y muestra @nombre o una vista previa incrustada en lugar del código en bruto.",
      "how.silent.title": "Mencionar sin notificar",
      "how.silent.body":
        "Si omites el tag p sigues teniendo una mención clicable, pero la persona no recibe notificación. Si omites un tag e o q, tu referencia no aparecerá entre las respuestas de esa nota.",
      "related.21": "Las menciones son URIs nostr: como se definen en NIP-21.",
      "related.19":
        "Los códigos dentro de esas URIs son entidades NIP-19 (npub, nprofile, nevent, naddr…).",
      "related.18": "Los tags q para citas vienen de los reposts de NIP-18.",
      "related.23": "Los artículos largos usan el mismo formato de mención en su Markdown.",
      "event.note.label": "Nota con referencias",
      "event.note.explain":
        "Cualquier evento de texto (notas kind 1, artículos kind 30023, comentarios kind 1111) cuyo content menciona perfiles o eventos.",
      content:
        "El texto, con enlaces nostr:npub…, nostr:nprofile…, nostr:note…, nostr:nevent… o nostr:naddr… donde están las menciones.",
      "tag.p": "Notifica a una persona mencionada en el content.",
      "tag.p.pubkey": "Pubkey de la persona mencionada (la que va dentro del npub o nprofile).",
      "tag.relay": "Pista de relay opcional.",
      "tag.q": "Marca un evento citado en el content, para que pueda contar la cita.",
      "tag.q.target": "Id del evento (64 hex) o dirección (kind:pubkey:d) del evento citado.",
      "tag.q.pubkey": "Autor del evento citado, para eventos normales.",
      "example.mention": "Mencionar a dos personas",
      "example.mention.explain":
        "Alice recomienda a Erin y a Bob. Cada nostr:npub del texto tiene su tag p, así que ambos reciben la notificación.",
      "example.quote": "Citar una nota",
      "example.quote.explain":
        "Carol cita la nota de Bob con nostr:note1… y añade un tag q (y un tag p) para que Bob vea la cita.",
      "example.silent": "Mencionar sin notificar",
      "example.silent.explain":
        "Grace enlaza el perfil de Dave con un nprofile (que lleva una pista de relay) pero no añade tag p, así que Dave no recibe aviso.",
    },
  },
  n28: {
    title: "Chat público",
    summary:
      "No recomendado: usa los grupos basados en relays de NIP-29 en su lugar. Canales de chat abiertos construidos con cinco kinds: crear un canal (40), actualizar su información (41), publicar mensajes (42) y ocultar mensajes (43) o silenciar usuarios (44) para ti.",
    text: {
      "how.unrecommended.title": "No recomendado: usa NIP-29",
      "how.unrecommended.body":
        "Cualquiera puede publicar en un canal NIP-28 y la moderación solo ocurre en el cliente de cada lector, así que el spam es difícil de frenar. Los grupos NIP-29 permiten que un relay aplique la membresía y la moderación.",
      "how.create.title": "Crea un canal",
      "how.create.body":
        "Un evento kind 40 crea el canal. Su content es JSON con name, about, picture y relays. El id del evento pasa a ser el id del canal.",
      "how.metadata.title": "Actualiza la información del canal",
      "how.metadata.body":
        "kind 41 reemplaza los metadatos del canal. Apunta al kind 40 con un tag e root. Los clientes ignoran los kind 41 de cualquiera que no sea el creador del canal.",
      "how.message.title": "Publica y responde",
      "how.message.body":
        'Los mensajes kind 42 llevan un tag e al canal marcado como "root". Una respuesta añade un segundo tag e marcado como "reply" y un tag p para la persona a la que se responde (marcadores NIP-10).',
      "how.moderation.title": "La moderación depende de cada cliente",
      "how.moderation.body":
        "kind 43 oculta un mensaje y kind 44 silencia a un usuario, ambos para quien los publicó. Los clientes también pueden usarlos para ocultar contenido a otros.",
      "related.29": "Los grupos basados en relays de NIP-29 son el reemplazo recomendado.",
      "related.10": "Los mensajes usan tags e con marcadores de NIP-10 (root, reply).",
      "related.C7":
        "NIP-C7 define los mensajes de chat kind 9 que se usan dentro de los grupos NIP-29.",
      "flow.channel.label": "Vida de un canal",
      "flow.channel.explain":
        "Desde crear un canal hasta moderarlo, en el orden en que un cliente publicaría.",
      "flow.channel.create": "Dave crea el canal; el id de su evento es el id del canal.",
      "flow.channel.metadata": "Dave actualiza la descripción y añade categorías.",
      "flow.channel.message": "Bob publica una pregunta y Dave responde.",
      "flow.channel.hide": "Grace oculta un mensaje que no necesita ver.",
      "flow.channel.mute": "Grace silencia a un usuario en su propio cliente.",
      "schema.meta": "Metadatos del canal. Los clientes pueden añadir otros campos.",
      "field.name": "Nombre del canal.",
      "field.about": "Descripción del canal.",
      "field.picture": "URL de la imagen del canal.",
      "field.relays": "Relays donde se deben leer y publicar los eventos del canal.",
      "schema.reason": "JSON opcional con un motivo.",
      "field.reason": "Por qué se ocultó el mensaje o se silenció al usuario.",
      "tag.relay": "Relay donde se puede encontrar el evento referenciado.",
      "tag.e-root": 'Apunta al canal (el evento kind 40), marcado como "root".',
      "tag.e-root.id": "Id del evento kind 40 de creación del canal.",
      "tag.marker": "Marcador NIP-10 que indica a qué apunta este tag e.",
      "marker.root": "El canal al que pertenece este evento.",
      "marker.reply": "El mensaje al que se responde.",
      "tag.p": "Persona a la que se responde, para que reciba la notificación.",
      "tag.p.pubkey": "Pubkey de la persona.",
      "tag.t": "Una categoría para el canal, para búsqueda y filtrado.",
      "tag.t.value": "Nombre de la categoría.",
      "event.create.label": "Crear canal (kind 40)",
      "event.create.explain":
        "Crea un canal de chat público. Su id identifica el canal a partir de ahora.",
      "content.create": "JSON serializado con name, about, picture y relays del canal.",
      "event.metadata.label": "Metadatos del canal (kind 41)",
      "event.metadata.explain":
        "Actualiza los metadatos de un canal sin cambiar su id. Solo cuenta el kind 41 más reciente del creador.",
      "content.metadata": "JSON serializado con los nuevos name, about, picture y relays.",
      "event.message.label": "Mensaje del canal (kind 42)",
      "event.message.explain": "Un mensaje de chat en un canal, o una respuesta a otro mensaje.",
      "content.message": "El texto del mensaje.",
      "tag.e-reply": 'Apunta al mensaje al que se responde, marcado como "reply".',
      "tag.e-reply.id": "Id del mensaje kind 42 al que respondes.",
      "event.hide.label": "Ocultar mensaje (kind 43)",
      "event.hide.explain": "Ya no quieres ver un mensaje.",
      "content.hide": 'JSON opcional como {"reason": "…"}.',
      "tag.e-hide": "El mensaje que se oculta.",
      "tag.e-hide.id": "Id del mensaje kind 42.",
      "event.mute.label": "Silenciar usuario (kind 44)",
      "event.mute.explain": "Ya no quieres ver los mensajes de alguien.",
      "content.mute": 'JSON opcional como {"reason": "…"}.',
      "tag.p-mute": "El usuario que se silencia.",
      "tag.p-mute.pubkey": "Pubkey del usuario silenciado.",
      "example.create": "Crear un canal",
      "example.update": "Actualizar la información del canal",
      "example.root": "Primer mensaje",
      "example.reply": "Responder a un mensaje",
      "example.reply.explain":
        "Dos tags e: el canal (root) y el mensaje de Bob (reply), más un tag p para que Bob reciba la notificación.",
      "example.hide": "Ocultar un mensaje",
      "example.mute": "Silenciar a un usuario",
    },
  },
  n29: {
    title: "Grupos basados en relays",
    summary:
      "Grupos cerrados o abiertos que un relay hace cumplir: los miembros publican con un tag h, los administradores gestionan el grupo con los kinds 9000–9020 y el relay publica los metadatos, administradores y miembros del grupo como kinds 39000–39005.",
    text: {
      "how.relay.title": "El relay es dueño del grupo",
      "how.relay.body":
        'Un grupo es un id (como "film-cameras") en un relay que aplica reglas para él. El relay firma el estado del grupo (metadatos, administradores, miembros) con su propia clave, como un evento kind 39000–39005 con tag d.',
      "how.h.title": "Todo lleva un tag h",
      "how.h.body":
        "Los mensajes, hilos y eventos de moderación enviados a un grupo llevan un tag h con el id del grupo. El relay los acepta o rechaza según las reglas del grupo.",
      "how.join.title": "Unirse y salir",
      "how.join.body":
        "Envía un kind 9021 para pedir unirte, con un código de invitación si lo tienes; el relay o un administrador responde con un kind 9000 que te añade. kind 9022 sale del grupo.",
      "how.moderation.title": "Los administradores moderan con eventos",
      "how.moderation.body":
        "Los administradores publican los kinds 9000–9010 (añadir o quitar usuarios, editar metadatos, borrar mensajes, crear invitaciones, fijar eventos). Reproducirlos en orden reconstruye el estado del grupo.",
      "how.previous.title": "Referencias a la línea de tiempo",
      "how.previous.body":
        "El tag previous enumera los primeros 8 caracteres hex de eventos recientes vistos en el grupo. Los relays rechazan eventos que citan ids desconocidos, así que un mensaje no puede reproducirse fuera de contexto en otro relay.",
      "how.forks.title": "Mover o bifurcar",
      "how.forks.body":
        "Si el relay desaparece, los eventos del grupo pueden copiarse a otro relay que mantenga el mismo id y administradores (un traslado) o los cambie (un fork). Los clientes lo notan a través de las listas de grupos kind 10009.",
      "related.28": "NIP-29 reemplaza a los canales de chat público de NIP-28.",
      "related.11":
        'La clave del relay que firma el estado del grupo es la pubkey "self" del documento NIP-11 del relay.',
      "related.C7": "Los mensajes de chat de grupo son eventos kind 9 de NIP-C7 con un tag h.",
      "related.51": "kind 10009 (NIP-51) guarda la lista de grupos en los que está un usuario.",
      "related.98":
        "Los tokens de LiveKit se solicitan con un evento de autenticación HTTP de NIP-98.",
      "related.19":
        "Un grupo se comparte como naddr de su evento kind 39000, opcionalmente con ?invite=<código>.",
      "flow.membership.label": "Unirse a un grupo",
      "flow.membership.explain": "Desde pedir unirse hasta chatear y salir.",
      "flow.membership.join": "Grace pide unirse con el código de invitación que le dio Carol.",
      "flow.membership.put": "Carol (administradora) añade a Grace con un kind 9000.",
      "flow.membership.members": "El relay actualiza la lista de miembros kind 39002.",
      "flow.membership.chat":
        "Los miembros chatean con mensajes kind 9 que llevan los tags h y previous.",
      "flow.membership.leave": "Grace sale con un kind 9022; el relay la elimina.",
      "flow.livekit.label": "Entrar en una sala de audio/vídeo en vivo",
      "flow.livekit.explain":
        "Los grupos con un tag livekit ofrecen una sala de LiveKit junto al chat.",
      "flow.livekit.metadata": "Los metadatos del grupo tienen un tag livekit.",
      "flow.livekit.auth":
        "Grace firma un evento de autenticación kind 27235 para la URL del token.",
      "flow.livekit.token": "Su cliente obtiene un token de LiveKit del relay con ese evento.",
      "flow.livekit.participants": "El relay enumera quién está en vivo en el kind 39004.",
      "tag.h": "El grupo al que se envía este evento.",
      "tag.h.id": "Id del grupo: un string aleatorio, único en su relay.",
      "tag.d":
        "El grupo que describe este evento de estado (los eventos firmados por el relay usan d, no h).",
      "tag.previous":
        "Ids cortos de eventos recientes del grupo, para que el evento no pueda usarse fuera de contexto.",
      "tag.previous.ref":
        "Primeros 8 caracteres hex (4 bytes) de un evento visto en este grupo entre los últimos 50, que no sea tuyo.",
      "tag.name": "Nombre del grupo.",
      "tag.name.value": "Nombre que se muestra en los clientes.",
      "tag.picture": "Imagen del grupo.",
      "tag.url.value": "URL de la imagen.",
      "tag.banner": "Imagen de banner ancha.",
      "tag.about": "Descripción del grupo.",
      "tag.about.value": "Una descripción breve del grupo.",
      "tag.private": "Solo los miembros pueden leer los mensajes del grupo.",
      "tag.restricted": "Solo los miembros pueden escribir en el grupo.",
      "tag.hidden": "El relay oculta los metadatos del grupo a quienes no son miembros.",
      "tag.closed":
        "Las solicitudes para unirse se ignoran salvo que lleven un código de invitación válido.",
      "tag.livekit": "El grupo tiene una sala de audio/vídeo en vivo de LiveKit.",
      "tag.supported_kinds":
        "Kinds de evento que acepta el grupo. Ausente = todos los kinds; vacío = ninguno (solo AV).",
      "tag.supported_kinds.kind": "Un número de kind como string.",
      "tag.parent": "Este grupo es un subgrupo de otro grupo del mismo relay.",
      "tag.parent.value": "Id del grupo padre.",
      "tag.child": "Un subgrupo, en orden de visualización.",
      "tag.child.value": "Id del grupo hijo.",
      "tag.p.pubkey": "La pubkey de un usuario.",
      "tag.p.role":
        'Un nombre de rol como "admin" o "moderator" (el relay decide qué puede hacer cada rol).',
      "tag.e.id": "Id de un evento del grupo.",
      "tag.a": "Un evento direccionable, como kind:pubkey:d.",
      "tag.a.addr": "Dirección del evento.",
      "tag.code": "Código de invitación que preaprueba la solicitud para unirse.",
      "tag.code.value": "El código de invitación.",
      "tag.code-invite": "El código de invitación que se crea.",
      "tag.p-put":
        "El usuario que se añade (o cuyos roles se actualizan), seguido de roles opcionales.",
      "tag.p-remove": "El usuario que se elimina del grupo.",
      "tag.e-delete": "El evento que se borra del grupo.",
      "tag.e-pin": "Un evento fijado, en orden de visualización.",
      "tag.p-admin": "Un administrador y sus roles.",
      "tag.p-member": "Un miembro del grupo.",
      "tag.role": "Un rol que admite este relay.",
      "tag.role.name": "Nombre del rol.",
      "tag.role.description": "Descripción opcional de lo que puede hacer el rol.",
      "tag.participant": "Alguien que está en vivo en la sala de audio/vídeo en este momento.",
      "tag.u": "La URL exacta que se solicita (NIP-98).",
      "tag.u.value": "https://<relay>/.well-known/nip29/livekit/<group-id>",
      "tag.method": "El método HTTP de la solicitud (NIP-98).",
      "tag.method.value": "GET para el endpoint del token.",
      "content.reason": "Motivo opcional, que se muestra a los administradores o en los registros.",
      "content.empty": "Vacío.",
      "content.chat": "El texto del mensaje.",
      "content.description": "Una descripción legible de la lista.",
      "event.chat.label": "Mensaje de grupo (kind 9 u 11)",
      "event.chat.explain":
        "Cualquier evento normal publicado en un grupo: mensajes de chat NIP-C7 (9), hilos (11) y más, con un tag h.",
      "event.join.label": "Solicitud para unirse (kind 9021)",
      "event.join.explain":
        'Pide al relay que te añada. Se rechaza con "duplicate: " si ya eres miembro.',
      "event.leave.label": "Solicitud para salir (kind 9022)",
      "event.leave.explain": "Te quita del grupo; el relay responde con un kind 9001.",
      "event.put-user.label": "Añadir usuario (kind 9000)",
      "event.put-user.explain":
        "Acción de administrador: añadir un usuario o actualizar sus roles.",
      "event.remove-user.label": "Quitar usuario (kind 9001)",
      "event.remove-user.explain": "Acción de administrador: quitar a un usuario del grupo.",
      "event.edit-metadata.label": "Editar metadatos (kind 9002)",
      "event.edit-metadata.explain":
        "Acción de administrador: definir el nombre, la imagen, los indicadores, los kinds admitidos y padre/hijos del grupo.",
      "event.delete-event.label": "Borrar evento (kind 9005)",
      "event.delete-event.explain": "Acción de administrador: borrar un mensaje del grupo.",
      "event.create-group.label": "Crear grupo (kind 9007)",
      "event.create-group.explain":
        "Acción de administrador: crear un grupo con este id en el relay.",
      "event.delete-group.label": "Borrar grupo (kind 9008)",
      "event.delete-group.explain":
        "Acción de administrador: borrar el grupo. Los subgrupos pasan a ser grupos raíz.",
      "event.create-invite.label": "Crear invitación (kind 9009)",
      "event.create-invite.explain":
        "Acción de administrador: crear un código de invitación para solicitudes de unión kind 9021.",
      "event.update-pin-list.label": "Actualizar fijados (kind 9010)",
      "event.update-pin-list.explain":
        "Acción de administrador: la lista completa y ordenada de eventos fijados. Una lista vacía elimina los fijados.",
      "event.metadata.label": "Metadatos del grupo (kind 39000)",
      "event.metadata.explain":
        "Firmado por el relay: cómo deben mostrar el grupo los clientes, y sus indicadores de acceso.",
      "event.admins.label": "Administradores del grupo (kind 39001)",
      "event.admins.explain": "Firmado por el relay: administradores y sus roles.",
      "event.members.label": "Miembros del grupo (kind 39002)",
      "event.members.explain":
        "Firmado por el relay: miembros. Puede ser parcial o no existir; no confíes en él.",
      "event.roles.label": "Roles del grupo (kind 39003)",
      "event.roles.explain": "Firmado por el relay: los nombres de rol que entiende este relay.",
      "event.participants.label": "Participantes en vivo (kind 39004)",
      "event.participants.explain":
        "Firmado por el relay: quién está en la sala de audio/vídeo en vivo.",
      "event.pinned.label": "Eventos fijados (kind 39005)",
      "event.pinned.explain": "Copia firmada por el relay de la última lista de fijados aceptada.",
      "event.livekit-auth.label": "Autenticación LiveKit (kind 27235)",
      "event.livekit-auth.explain":
        "Un evento de autenticación HTTP de NIP-98 que demuestra quién pide el token de LiveKit.",
      "example.chat": "Mensaje de chat",
      "example.join": "Unirse con una invitación",
      "example.join.explain":
        "Grace pide unirse e incluye el código de invitación, para que el relay pueda aceptarla de inmediato.",
      "example.leave": "Salir del grupo",
      "example.put-user": "Añadir a Grace como miembro",
      "example.remove-user": "Quitar a un spammer",
      "example.edit-metadata": "Definir nombre y acceso",
      "example.delete-event": "Borrar un mensaje",
      "example.create-group": "Crear el grupo",
      "example.delete-group": "Borrar el grupo",
      "example.create-invite": "Crear un código de invitación",
      "example.update-pin-list": "Fijar un mensaje",
      "example.metadata": "Metadatos de Film Cameras",
      "example.admins": "Lista de administradores",
      "example.members": "Lista de miembros",
      "example.roles": "Roles admitidos",
      "example.participants": "Quién está en vivo",
      "example.pinned": "Mensajes fijados",
      "example.livekit-auth": "Autenticación de la solicitud del token",
      "example.token": "Obtener un token de LiveKit",
      "http.livekit-token.label": "Endpoint del token de LiveKit",
      "http.livekit-token.explain":
        "El relay comprueba las reglas del grupo y devuelve un JWT de LiveKit y la URL del servidor para su sala de audio/vídeo.",
      "http.livekit-token.authorization":
        '"Nostr " seguido del evento de autenticación kind 27235 en base64.',
      "http.livekit-token.200": "Acceso concedido.",
      "http.livekit-token.200.body":
        "El JWT de LiveKit (su sub empieza con tu pubkey hex) y la URL del servidor LiveKit.",
      "http.livekit-token.401": "Falta el evento de autenticación o no es válido.",
      "http.livekit-token.403": "No tienes permiso para entrar en la sala de este grupo.",
    },
  },
  n30: {
    title: "Emoji personalizados",
    summary:
      "Usa tus propias imágenes como emoji: escribe :shortcode: en el texto y añade un tag emoji que asocie el shortcode a una URL de imagen. Funciona en perfiles, notas, comentarios, reacciones y estados.",
    text: {
      "how.tag.title": "Asocia un shortcode a una imagen",
      "how.tag.body":
        'Cada tag emoji es ["emoji", shortcode, URL de la imagen]. El shortcode solo puede usar letras, dígitos, - y _.',
      "how.shortcode.title": "Escribe :shortcode: en el texto",
      "how.shortcode.body":
        "Pon :ostrich: donde deba aparecer el emoji. Los clientes compatibles con NIP-30 lo reemplazan por la imagen del tag correspondiente; los demás muestran el texto.",
      "how.set.title": "Indica de qué conjunto viene",
      "how.set.body":
        "Un cuarto valor puede apuntar al conjunto de emoji kind 30030 (NIP-51) al que pertenece el emoji, para que los lectores encuentren y añadan el conjunto entero.",
      "how.where.title": "Dónde se muestran los emoji",
      "how.where.body":
        "En los perfiles kind 0 se procesan los campos name y about; en notas (1), comentarios (1111), reacciones (7) y estados de usuario (30315), el content.",
      "related.51": "Los conjuntos de emoji son listas kind 30030 de NIP-51.",
      "related.25": "Una reacción NIP-25 puede ser un único emoji personalizado.",
      "related.38": "Los estados de usuario (NIP-38) pueden incluir emoji personalizados.",
      "related.22": "Los comentarios NIP-22 pueden incluir emoji personalizados.",
      "event.note.label": "Nota con emoji personalizados",
      "event.note.explain": "Una nota, comentario o estado cuyo content usa emoji :shortcode:.",
      "content.note": "Texto con marcadores :shortcode:, uno por cada tag emoji.",
      "tag.emoji": "Define un emoji personalizado usado en este evento.",
      "tag.emoji-one": "El único emoji personalizado usado como reacción.",
      "tag.emoji.shortcode":
        "Nombre usado entre dos puntos en el texto. Solo letras, dígitos, - y _.",
      "tag.emoji.image": "URL de la imagen del emoji.",
      "tag.emoji.set":
        "Dirección opcional (30030:pubkey:d) del conjunto de emoji al que pertenece.",
      "event.reaction.label": "Reacción con emoji personalizado (kind 7)",
      "event.reaction.explain":
        "Una reacción cuyo content es un único :shortcode: con su tag emoji.",
      "content.reaction": "Exactamente un :shortcode:.",
      "tag.e": "El evento al que se reacciona.",
      "tag.e.id": "Id del evento.",
      "tag.e.pubkey": "Autor del evento, como pista.",
      "tag.relay": "Pista de relay opcional.",
      "tag.p": "El autor al que se reacciona.",
      "tag.p.pubkey": "Pubkey del autor.",
      "event.profile.label": "Perfil con emoji personalizados (kind 0)",
      "event.profile.explain":
        "Metadatos de perfil cuyos name y about pueden contener emoji :shortcode:.",
      "content.profile": "JSON del perfil serializado.",
      "schema.profile": "Campos del perfil; solo name y about admiten emoji.",
      "field.name": "Nombre, puede contener :shortcode:.",
      "field.about": "Biografía, puede contener :shortcode:.",
      "example.note": "Nota con dos emoji",
      "example.note.explain":
        "Erin usa :ostrich: de su conjunto de emoji y un :bolt: suelto. Cada shortcode del texto tiene su tag.",
      "example.reaction": "Reaccionar con un emoji personalizado",
      "example.profile": "Emoji en una biografía",
    },
  },
  n31: {
    title: "Tratamiento de eventos desconocidos",
    summary:
      "No recomendado, aunque los tags alt siguen siendo comunes. Da a los eventos de kinds personalizados un tag alt con una descripción legible de una línea, para que los clientes que no conocen el kind puedan mostrar algo sensato.",
    text: {
      "how.unrecommended.title": "No recomendado, pero lo verás",
      "how.unrecommended.body":
        "El NIP está marcado como no recomendado por innecesariamente pesado, y no tiene un reemplazo directo. Muchas apps siguen añadiendo tags alt, así que conviene reconocerlos. Los manejadores de apps de NIP-89 son la forma más completa de tratar los kinds desconocidos.",
      "how.problem.title": "El problema",
      "how.problem.body":
        "Una nota puede citar un evento de calendario o una insignia. Un cliente que solo conoce el kind 1 no tiene ni idea de cómo mostrarlo.",
      "how.alt.title": "Añade un tag alt",
      "how.alt.body":
        'Quien publica añade ["alt", "<resumen corto en texto plano>"] que tenga sentido para alguien que no sabe nada del kind.',
      "how.fallback.title": "Muestra la alternativa",
      "how.fallback.body":
        "El cliente sencillo muestra el texto alt, quizá con un enlace a una app que pueda abrir el evento, en lugar de un recuadro vacío o confuso.",
      "related.89":
        "NIP-89 permite a los clientes encontrar una app que maneje un kind desconocido.",
      "related.52":
        "Los eventos de calendario (NIP-52) son un kind personalizado típico que se beneficia de alt.",
      "event.custom.label": "Evento de kind personalizado con alt",
      "event.custom.explain":
        "Cualquier evento de un kind que no está pensado para leerse como texto, con un resumen alt.",
      content: "El propio content del evento, definido por el NIP de su kind.",
      "tag.alt": "Un resumen breve y legible para clientes que no entienden este kind.",
      "tag.alt.value":
        "Texto plano, una línea, con contexto suficiente para alguien nuevo en el kind.",
      "example.calendar": "Evento de calendario",
      "example.calendar.explain":
        "Una quedada kind 31923. Un cliente kind 1 no puede mostrarla, pero sí imprimir la línea alt.",
      "example.badge": "Definición de insignia",
    },
  },
  n32: {
    title: "Etiquetado",
    summary:
      "Asocia etiquetas a eventos, personas, relays, URLs o temas con el kind 1985: un tag L nombra el vocabulario y los tags l llevan las etiquetas. Los autores también pueden etiquetar sus propios eventos. Se usa para moderación, licencias, idiomas y clasificación.",
    text: {
      "how.namespace.title": "Elige un espacio de nombres",
      "how.namespace.body":
        'El tag L nombra el vocabulario: un estándar ISO ("ISO-639-1"), notación de dominio inverso ("com.example.ontology"), "ugc" para entrada libre del usuario, o "#t" para asociar un hashtag.',
      "how.label.title": "Añade etiquetas",
      "how.label.body":
        'Cada tag l es una etiqueta más el espacio de nombres al que pertenece. La marca debe coincidir con un tag L del evento. Si no hay marca, se asume "ugc".',
      "how.target.title": "Indica qué estás etiquetando",
      "how.target.body":
        "Un evento kind 1985 debe nombrar al menos un objetivo: e (evento), p (persona), a (evento direccionable), r (relay o URL) o t (tema). Añade pistas de relay a e y p.",
      "how.self.title": "Etiqueta tus propios eventos",
      "how.self.body":
        "Cualquier evento puede llevar tags L y l sobre sí mismo, por ejemplo el idioma de una nota o el lugar del que habla.",
      "how.query.title": "Consulta por espacio de nombres",
      "how.query.body":
        'Como L y l son tags de una sola letra, los relays los indexan: un filtro como {"#L": ["license"]} encuentra todas las etiquetas de licencia. Limita cada evento de etiquetas a un solo espacio de nombres.',
      "related.36": "Las advertencias de contenido de NIP-36 pueden matizarse con etiquetas L/l.",
      "related.56": "Los reportes de NIP-56 son otra forma, más específica, de señalar contenido.",
      "related.09": "Las etiquetas masivas se corrigen borrando (NIP-09) y volviendo a publicar.",
      "event.label.label": "Evento de etiquetas (kind 1985)",
      "event.label.explain": "Asocia etiquetas de un espacio de nombres a uno o más objetivos.",
      "content.label":
        "Explicación opcional más larga de por qué se etiquetaron así los objetivos.",
      "tag.L": "Un espacio de nombres de etiquetas usado en este evento.",
      "tag.L.value":
        'Espacio de nombres: un estándar ISO, un nombre de dominio inverso, "ugc" o "#<tag>".',
      "tag.l": "Una etiqueta.",
      "tag.l.value": "La etiqueta en sí: corta y significativa, una categoría más que un valor.",
      "tag.l.mark":
        "El espacio de nombres al que pertenece esta etiqueta; debe coincidir con un tag L.",
      "tag.e": "Objetivo: un evento.",
      "tag.e.id": "Id del evento etiquetado.",
      "tag.p": "Objetivo: una persona.",
      "tag.p.pubkey": "Pubkey de la persona etiquetada.",
      "tag.a": "Objetivo: un evento direccionable.",
      "tag.a.addr": "Dirección como kind:pubkey:d.",
      "tag.r": "Objetivo: un relay o una URL web.",
      "tag.r.url": "La URL del relay (wss://) o la URL web.",
      "tag.t": "Objetivo: un tema.",
      "tag.t.value": "El tema (hashtag) que se etiqueta.",
      "tag.relay": "Pista de relay para el objetivo.",
      "event.self-label.label": "Evento autoetiquetado",
      "event.self-label.explain": "Cualquier evento que se etiqueta a sí mismo con tags L y l.",
      "content.self": "El propio content del evento.",
      "example.topic": "Asociar personas a un tema",
      "example.topic.explain":
        'Carol propone a Erin y a sí misma para #photography. El espacio de nombres "#t" significa "trata esta etiqueta como un tag t".',
      "example.license": "Licenciar un artículo",
      "example.license.explain":
        "Frank etiqueta su artículo como CC-BY-4.0 y lo explica en el content.",
      "example.relay": "Etiquetar un relay",
      "example.language": "Idioma de la nota",
      "example.place": "Ubicación de la nota",
    },
  },
  n33: {
    title: "Eventos reemplazables parametrizados",
    summary:
      'Obsoleto: renombrados como "eventos direccionables" y trasladados a NIP-01. Los kinds 30000–39999 se reemplazan por autor y tag d, así que gana la versión más reciente y una dirección siempre la encuentra.',
    text: {
      "how.moved.title": "Ahora se llaman eventos direccionables, en NIP-01",
      "how.moved.body":
        "Este NIP se renombró y se integró en NIP-01. Las reglas de abajo no cambian; consulta NIP-01 para el texto actual.",
      "how.range.title": "Kinds 30000 a 39999",
      "how.range.body":
        "Los eventos de este rango de kinds son direccionables. Los artículos (30023), los estados de usuario (30315) y las listas (30000+) lo usan.",
      "how.d.title": "El tag d nombra el hueco",
      "how.d.body":
        "Cada evento tiene un tag d. Juntos, kind + pubkey + d forman la dirección del evento: un autor puede tener muchos artículos, uno por cada valor de d.",
      "how.replace.title": "Gana el más reciente",
      "how.replace.body":
        "Cuando un relay recibe un evento más nuevo (según created_at) con la misma dirección, se queda con el nuevo y descarta el anterior. Así funciona la edición.",
      "how.address.title": "Enlaza por dirección, no por id",
      "how.address.body":
        'El id cambia con cada edición, así que enlaza a la dirección: un tag a "kind:pubkey:d" o un naddr de NIP-19.',
      "related.01": "Los eventos direccionables ahora se definen en NIP-01.",
      "related.19": "naddr codifica una dirección (kind, pubkey, d, relays).",
      "related.23": "Los artículos largos son los eventos direccionables más conocidos.",
      "event.addressable.label": "Evento direccionable",
      "event.addressable.explain": "Cualquier evento con un kind de 30000 a 39999 y un tag d.",
      content: "El content, definido por el propio NIP del kind.",
      "tag.d":
        "El identificador que, junto con kind y pubkey, forma la dirección del evento. Obligatorio.",
      "tag.d.value": "Cualquier string, incluso vacío. Mantenlo estable entre ediciones.",
      "example.v2": "Artículo editado",
      "example.v2.explain":
        "El artículo de Frank tras una edición: mismo kind, pubkey y d, created_at más reciente. Los relays solo conservan esta versión.",
      "example.status": "Estado de usuario",
      "actor.author": "Cliente de Frank",
      "actor.relay": "Relay",
      "actor.reader": "Cliente del lector",
      "step.v1.label": "EVENT (primera versión)",
      "step.v1.explain": "Frank publica su artículo con d = protocols-not-platforms.",
      "step.store.label": "Guardar bajo su dirección",
      "step.store.explain": "El relay lo archiva bajo 30023:<frank>:protocols-not-platforms.",
      "step.v2.label": "EVENT (versión editada)",
      "step.v2.explain":
        "Frank corrige una errata y publica de nuevo con el mismo d y un created_at más reciente.",
      "step.replace.label": "Reemplazar la versión anterior",
      "step.replace.explain":
        "Misma dirección, timestamp más reciente: el relay borra la primera versión.",
      "step.req.label": "REQ por dirección",
      "step.req.explain": "Un lector pide el kind 30023 de Frank con ese valor de d.",
      "step.latest.label": "EVENT (solo la última)",
      "step.latest.explain": "El relay responde solo con la versión editada.",
    },
  },
  n34: {
    title: "Cosas de git",
    summary:
      "Colaboración en código sobre Nostr: anuncia repositorios git, publica el estado de sus ramas y envía parches, pull requests, issues y actualizaciones de estado como eventos, sin una forja central.",
    text: {
      "how.announce.title": "Anuncia un repositorio",
      "how.announce.body":
        "Un mantenedor publica un kind 30617 con un identificador d, URLs de clonado y web, y los relays que recogen parches e issues. Publicarlo te convierte en mantenedor del proyecto.",
      "how.euc.title": "Agrupa los forks por su primer commit",
      "how.euc.body":
        'El tag r marcado como "euc" contiene el commit único más antiguo, normalmente el commit raíz. Los repositorios con el mismo euc son el mismo proyecto alojado en sitios distintos.',
      "how.patch.title": "Envía parches",
      "how.patch.body":
        "Un evento kind 1617 lleva la salida de git format-patch, un tag a al repositorio y un tag p al mantenedor. Los parches posteriores de una serie responden al anterior (NIP-10).",
      "how.pr.title": "O abre un pull request",
      "how.pr.body":
        "Los parches de más de 60 kB deberían ser pull requests (kind 1618): una descripción, el commit de la punta en c y una URL de clonado desde donde obtenerlo. kind 1619 mueve la punta.",
      "how.issues.title": "Issues y respuestas",
      "how.issues.body":
        "Los issues son eventos Markdown kind 1621 con un asunto y etiquetas opcionales. Las respuestas a issues, parches y pull requests son comentarios NIP-22.",
      "how.status.title": "El estado según el kind",
      "how.status.body":
        "kind 1630 significa abierto, 1631 aplicado/fusionado/resuelto, 1632 cerrado y 1633 borrador. Gana el estado más reciente del autor o de un mantenedor.",
      "related.22": "Las respuestas a issues, parches y pull requests son comentarios NIP-22.",
      "related.10": "Las series de parches y los eventos de estado usan marcadores e de NIP-10.",
      "related.19": "Las URLs de clonado nostr:// pueden incluir un naddr del anuncio.",
      "related.65": "La lista grasp kind 10317 replica la idea de la lista de relays de NIP-65.",
      "flow.contribute.label": "Contribuir un parche",
      "flow.contribute.explain": "Desde el anuncio de un repositorio hasta un parche fusionado.",
      "flow.contribute.repo": "Dave anuncia delta-relay y enumera sus relays de parches.",
      "flow.contribute.patch":
        "Bob envía un parche a esos relays, etiquetando el repositorio y a Dave.",
      "flow.contribute.status": "Dave lo aplica y publica un estado kind 1631.",
      "flow.contribute.state":
        "El estado del repositorio de Dave ahora apunta main al nuevo commit.",
      "event.repo.label": "Anuncio de repositorio (kind 30617)",
      "event.repo.explain":
        "Indica que existe un repositorio, dónde clonarlo y adónde enviar parches.",
      "tag.d": "Identificador del repositorio, normalmente un nombre corto en kebab-case.",
      "tag.d.value": "El id; también se usa en las URLs de clonado nostr://.",
      "tag.name": "Nombre legible del proyecto.",
      "tag.name.value": "Nombre que se muestra en los clientes.",
      "tag.description": "Descripción breve del proyecto.",
      "tag.description.value": "Una o dos frases.",
      "tag.web": "Páginas web para explorar el código.",
      "tag.web.value": "Una URL para explorar. Pueden seguir más.",
      "tag.clone": "URLs para git clone.",
      "tag.clone.value": "Una URL de clonado. Pueden seguir más.",
      "tag.relays": "Relays que este repositorio vigila en busca de parches e issues.",
      "tag.relays.value": "Una URL de relay. Pueden seguir más.",
      "tag.r-euc":
        "El commit único más antiguo, para reconocer el mismo proyecto entre alojamientos y forks.",
      "tag.r-euc.commit": "Id del commit (40 caracteres hex).",
      "tag.r-euc.marker": 'Siempre "euc".',
      "tag.maintainers": "Otros mantenedores reconocidos.",
      "tag.maintainers.value": "La pubkey de un mantenedor. Pueden seguir más.",
      "tag.u": "Marca este repositorio como fork subordinado de otro.",
      "tag.u.value": "El upstream como 30617:pubkey:id, o su URL git.",
      "tag.u.pubkey": "Pubkey del autor del upstream.",
      "tag.t": "Una etiqueta o hashtag.",
      "tag.t.value": "El texto de la etiqueta.",
      "tag.relay": "Pista de relay opcional.",
      "event.state.label": "Estado del repositorio (kind 30618)",
      "event.state.explain":
        'Fuente de verdad opcional para ramas y etiquetas. Cada ref es su propio tag, con el nombre de la ref: ["refs/heads/main", "<commit>"].',
      "tag.HEAD": "La rama por defecto.",
      "tag.HEAD.value": '"ref: refs/heads/<rama>".',
      "event.patch.label": "Parche (kind 1617)",
      "event.patch.explain":
        "Un parche git enviado a un repositorio. Úsalo para cambios de menos de 60 kB.",
      "content.patch": "La salida de git format-patch.",
      "tag.a": "El repositorio al que va dirigido.",
      "tag.a.addr": "Dirección del repositorio 30617:<pubkey del dueño>:<id del repo>.",
      "tag.r":
        "Un id de commit al que los clientes pueden suscribirse: el euc del repo, o el commit que crea este parche.",
      "tag.r.commit": "Id del commit (40 caracteres hex).",
      "tag.p": "Alguien a quien notificar: el dueño del repositorio u otro usuario.",
      "tag.p.pubkey": "Su pubkey.",
      "tag.t-patch": "Marca el primer parche de una serie o de una revisión.",
      "tag.t-patch.value": '"root" o "root-revision".',
      "marker.root": "Primer parche de una serie.",
      "marker.root-revision": "Primer parche de una serie revisada.",
      "tag.e-previous": "El parche anterior de la serie (respuesta NIP-10).",
      "tag.e-previous.id": "Id del parche anterior.",
      "tag.marker": "Marcador NIP-10.",
      "tag.commit":
        "Id del commit que produce el parche, para que el commit fusionado conserve el mismo id.",
      "tag.commit.value": "Id del commit (40 caracteres hex).",
      "tag.parent-commit": "Padre de ese commit.",
      "tag.parent-commit.value": "Id del commit (40 caracteres hex).",
      "tag.commit-pgp-sig": "Firma PGP del commit; vacía para commits sin firmar.",
      "tag.commit-pgp-sig.value": "-----BEGIN PGP SIGNATURE-----…",
      "tag.committer": "Datos del committer necesarios para recrear exactamente el commit.",
      "tag.committer.name": "Nombre del committer.",
      "tag.committer.email": "Email del committer.",
      "tag.committer.timestamp": "Hora del commit, en segundos Unix.",
      "tag.committer.tz": "Desfase horario en minutos.",
      "event.pr.label": "Pull request (kind 1618)",
      "event.pr.explain":
        "Apunta a cambios propuestos en un repositorio git. Úsalo para cambios más grandes.",
      "content.markdown": "Texto Markdown.",
      "tag.subject": "Título del pull request o del issue.",
      "tag.subject.value": "Título corto.",
      "tag.c": "Commit de la punta de la rama propuesta.",
      "tag.c.value": "Id del commit (40 caracteres hex).",
      "tag.branch-name": "Nombre de rama sugerido para el mantenedor.",
      "tag.branch-name.value": "Nombre de la rama.",
      "tag.e-revises": "Un parche que este PR revisa; ese parche debería cerrarse.",
      "tag.e-revises.id": "Id del parche raíz.",
      "tag.merge-base": "Ancestro común más reciente con la rama de destino.",
      "tag.merge-base.value": "Id del commit (40 caracteres hex).",
      "event.pr-update.label": "Actualización de pull request (kind 1619)",
      "event.pr-update.explain": "Mueve la punta de un pull request existente.",
      "tag.E": "El pull request que se actualiza (raíz NIP-22).",
      "tag.E.value": "Id del evento kind 1618.",
      "tag.P": "Autor del pull request.",
      "tag.P.value": "Su pubkey.",
      "event.issue.label": "Issue (kind 1621)",
      "event.issue.explain":
        "Un informe de error, una petición de funcionalidad o una pregunta sobre un repositorio.",
      "event.status.label": "Estado (kinds 1630–1633)",
      "event.status.explain":
        "Define el estado de un parche, pull request o issue: 1630 abierto, 1631 aplicado/fusionado/resuelto, 1632 cerrado, 1633 borrador.",
      "tag.e-root": 'El issue, PR o parche raíz cuyo estado es este, marcado como "root".',
      "tag.e-root.id": "Id de ese evento.",
      "tag.e-reply": 'La revisión aceptada, marcada como "reply", cuando se aplicó una revisión.',
      "tag.e-reply.id": "Id del parche raíz de la revisión.",
      "tag.q": "Un parche que se aplicó o fusionó (para kind 1631).",
      "tag.q.id": "Id del evento del parche.",
      "tag.q.pubkey": "Autor del parche.",
      "tag.merge-commit": "El commit de merge, cuando se fusionó.",
      "tag.merge-commit.value": "Id del commit (40 caracteres hex).",
      "tag.applied-as-commits":
        "Commits de la rama principal en los que se convirtieron los parches, cuando se aplicaron.",
      "tag.applied-as-commits.value": "Id del commit. Pueden seguir más.",
      "event.grasp.label": "Lista de servidores grasp (kind 10317)",
      "event.grasp.explain":
        "Servidores grasp que prefieres para la actividad NIP-34, en orden de preferencia.",
      "tag.g": "Un servidor grasp.",
      "tag.g.value": "Su URL websocket.",
      "example.repo": "Anunciar delta-relay",
      "example.repo.explain":
        "Dave anuncia el repositorio de su relay, con Alice como co-mantenedora.",
      "example.state": "Ramas y etiquetas",
      "example.state.explain":
        "main y una etiqueta de versión apuntan a commits; HEAD indica que main es la rama por defecto.",
      "example.patch": "El parche de Bob",
      "example.patch.explain":
        "Una corrección de una línea enviada como salida de format-patch, con los datos del commit necesarios para reproducir exactamente el commit.",
      "example.pr": "El pull request de Alice",
      "example.pr-update": "Subir commits nuevos al PR",
      "example.issue": "Grace informa de un error",
      "example.applied": "Marcar el parche como aplicado",
      "example.applied.explain":
        "kind 1631 sobre el parche de Bob, citándolo e indicando el commit en que se convirtió en main.",
      "example.closed": "Alternativa: cerrar el parche",
      "example.grasp": "Los servidores grasp de Bob",
    },
  },
  n35: {
    title: "Torrents",
    summary:
      "Un índice de torrents buscable en Nostr: el kind 2003 enumera el info hash, los archivos, los trackers y los ids de catálogo (IMDb, TMDB…) de un torrent para que cualquiera pueda construir el enlace magnet. En Nostr no se guardan archivos torrent.",
    text: {
      "how.index.title": "El info hash es el torrent",
      "how.index.body":
        "El tag x contiene el info hash v1 de BitTorrent. Es todo lo que necesita un cliente para construir magnet:?xt=urn:btih:<hash> y empezar a descargar de los pares.",
      "how.files.title": "Enumera los archivos",
      "how.files.body":
        "Los tags file indican cada ruta dentro del torrent y su tamaño en bytes, para que la gente vea qué va a obtener antes de descargar.",
      "how.prefixes.title": "Etiqueta con ids de catálogo",
      "how.prefixes.body":
        "Los tags i usan prefijos: tcat: para una ruta de categoría, newznab: para un id de categoría, e imdb:, tmdb:, ttvdb:, mal:, anilist: para ids de bases de datos. Añade un tipo de medio cuando la base de datos tenga varios (tmdb:movie:…).",
      "how.magnet.title": "Trackers y categorías",
      "how.magnet.body":
        "Los tags tracker opcionales se añaden al enlace magnet. Los tags t como movie, tv, hd o uhd permiten explorar los torrents por categoría.",
      "how.comments.title": "Comentarios",
      "how.comments.body":
        "Los comentarios kind 2004 funcionan como notas kind 1 y forman hilos con tags e de NIP-10 que apuntan al torrent.",
      "related.10": "Los comentarios de torrents forman hilos con tags e de NIP-10.",
      "related.73":
        "El tag i sigue la idea de ids externos de NIP-73 con prefijos específicos de torrents.",
      "related.94":
        "Los metadatos de archivo de NIP-94 son la forma, sin torrents, de describir un archivo.",
      "event.torrent.label": "Torrent (kind 2003)",
      "event.torrent.explain":
        "Información suficiente para buscar contenido y construir su enlace magnet.",
      "content.torrent": "Una descripción larga y preformateada del torrent.",
      "tag.title": "Título del torrent.",
      "tag.title.value": "Título que se muestra en los resultados de búsqueda.",
      "tag.x": "Info hash v1 de BitTorrent. Obligatorio.",
      "tag.x.value": "40 caracteres hex (20 bytes), como en magnet:?xt=urn:btih:<hash>.",
      "tag.file": "Un archivo dentro del torrent.",
      "tag.file.path": "Ruta completa dentro del torrent, p. ej. info/example.txt.",
      "tag.file.size": "Tamaño en bytes.",
      "tag.tracker": "Un tracker que usar para este torrent.",
      "tag.tracker.value": "URL del tracker (udp://, http(s)://, ws(s)://).",
      "tag.i": "Una referencia a un catálogo o categoría.",
      "tag.i.value": "prefijo:valor, p. ej. imdb:tt1254207, tmdb:movie:10378, tcat:video,movie,hd.",
      "tag.t": "Una categoría general para explorar.",
      "tag.t.value": "p. ej. movie, tv, hd, uhd.",
      "event.comment.label": "Comentario de torrent (kind 2004)",
      "event.comment.explain":
        "Una respuesta a un torrent; funciona exactamente como una nota kind 1.",
      "content.comment": "El texto del comentario.",
      "tag.e": "El torrent (root) o el comentario al que se responde.",
      "tag.e.id": "Id del evento.",
      "tag.e.marker": "Marcador NIP-10.",
      "marker.root": "El propio torrent.",
      "marker.reply": "El comentario al que respondes.",
      "tag.e.pubkey": "Autor de ese evento.",
      "tag.relay": "Pista de relay opcional.",
      "tag.p": "Alguien a quien notificar, como quien publicó el torrent.",
      "tag.p.pubkey": "Su pubkey.",
      "example.film": "Una película libre",
      "example.film.explain":
        "Big Buck Bunny, indexada con su info hash, dos archivos, un tracker y cuatro ids de catálogo.",
      "example.comment": "Comentar el torrent",
    },
  },
  n36: {
    title: "Contenido sensible",
    summary:
      'Añade un tag content-warning, con un motivo opcional, y los clientes ocultan el evento tras un botón "mostrar de todos modos" hasta que el lector decida verlo.',
    text: {
      "how.tag.title": "Añade un tag content-warning",
      "how.tag.body":
        'El autor añade ["content-warning"] o ["content-warning", "<motivo>"] a cualquier evento cuyo contenido los lectores quizá no quieran ver por sorpresa.',
      "how.hide.title": "Los clientes lo ocultan hasta que se pide",
      "how.hide.body":
        "Un cliente compatible muestra el motivo (si lo hay) y un botón en lugar del contenido. El contenido sigue ahí en texto plano: es una cortesía, no cifrado.",
      "how.labels.title": "Etiquetas opcionales",
      "how.labels.body":
        'Los tags L y l de NIP-32, por ejemplo en el espacio de nombres "content-warning", permiten a relays y clientes filtrar por tipo de advertencia.',
      "related.32": "Las etiquetas L y l pueden matizar la advertencia para filtrar.",
      "related.56": "Los reportes de NIP-56 sirven para señalar contenido de otras personas.",
      "event.note.label": "Evento con advertencia de contenido",
      "event.note.explain":
        "Cualquier evento (normalmente una nota kind 1) cuyo contenido debe ocultarse hasta que el lector acepte.",
      content: "El propio contenido sensible, en texto claro.",
      "tag.content-warning":
        "Pide a los clientes que oculten el contenido hasta que el lector decida mostrarlo.",
      "tag.content-warning.reason": "Motivo breve opcional que se muestra en lugar del contenido.",
      "tag.L": "Un espacio de nombres de etiquetas de NIP-32.",
      "tag.L.value": 'Espacio de nombres, p. ej. "content-warning".',
      "tag.l": "Una etiqueta de NIP-32 que matiza la advertencia.",
      "tag.l.value": 'Etiqueta, p. ej. "medical" o "spoiler".',
      "tag.l.mark": "El espacio de nombres al que pertenece esta etiqueta.",
      "example.spoiler": "Advertencia de spoiler",
      "example.spoiler.explain":
        "Bob oculta un spoiler de una serie tras un motivo que los lectores ven primero.",
      "example.labelled": "Advertencia con etiquetas",
      "example.labelled.explain":
        "Carol añade una etiqueta NIP-32 para que los clientes puedan filtrar contenido médico.",
      "example.bare": "Advertencia sin motivo",
    },
  },
  n37: {
    title: "Eventos borrador",
    summary:
      "Guarda publicaciones sin terminar de cualquier kind en relays sin que nadie más las lea: el borrador se cifra para ti mismo con NIP-44 dentro de un envoltorio kind 31234, con checkpoints opcionales y una lista de relays privados.",
    text: {
      "how.wrap.title": "Cifra el borrador para ti",
      "how.wrap.body":
        "El evento borrador sin firmar se convierte en JSON, se cifra con NIP-44 desde tu clave hacia tu propia clave y se coloca en el content de un kind 31234. Solo tú puedes leerlo.",
      "how.k.title": "Indica qué kind es",
      "how.k.body":
        "El tag k obligatorio indica a tus clientes el kind del borrador (1 para una nota, 30023 para un artículo) sin descifrarlo. El tag d hace reemplazable el envoltorio, así que guardar de nuevo lo sobrescribe.",
      "how.expire.title": "Déjalo caducar",
      "how.expire.body":
        "Se recomienda un tag expiration de NIP-40 (por ejemplo, a 90 días vista), para que los borradores olvidados desaparezcan. Publicar un content vacío marca el borrador como borrado.",
      "how.checkpoint.title": "Conserva un historial",
      "how.checkpoint.body":
        "Los checkpoints kind 1234 son instantáneas cifradas que apuntan a su borrador con un tag a, lo que te da un historial de revisiones.",
      "how.relays.title": "Guarda los borradores en relays privados",
      "how.relays.body":
        "kind 10013 enumera los relays para contenido privado. La propia lista está cifrada para ti, y el evento se publica en tus relays de escritura de NIP-65. Prefiere relays que exijan inicio de sesión NIP-42.",
      "related.44":
        "Los borradores y la lista de relays se cifran con NIP-44 para la propia clave del autor.",
      "related.40": "Los tags expiration de NIP-40 permiten que los borradores caduquen.",
      "related.42": "Los relays de almacenamiento privado deberían exigir autenticación NIP-42.",
      "related.65": "kind 10013 se publica en los relays de escritura NIP-65 del autor.",
      "related.23": "Reemplaza a los borradores de formato largo kind 30024, ya obsoletos.",
      "flow.drafting.label": "Guardar un borrador",
      "flow.drafting.explain": "Adónde van los borradores y cómo se conservan las revisiones.",
      "flow.drafting.relays":
        "La lista de relays privados de Alice indica que los borradores van a relay.delta.example.",
      "flow.drafting.draft":
        "Su cliente guarda la nota a medio escribir como un envoltorio de borrador cifrado.",
      "flow.drafting.checkpoint": "Un checkpoint guarda una revisión del mismo borrador.",
      "event.draft.label": "Envoltorio de borrador (kind 31234)",
      "event.draft.explain":
        "Almacenamiento cifrado para un borrador sin firmar de cualquier kind.",
      "content.draft":
        "Texto cifrado NIP-44 del borrador en JSON, cifrado para la propia pubkey del autor. Vacío = borrado.",
      "content.draft.plain": "Tras descifrar: el evento borrador sin firmar como JSON.",
      "schema.draft": "Una plantilla de evento (kind, created_at, tags, content); sin firmar.",
      "tag.d": "Identificador de este borrador, para que los guardados posteriores lo reemplacen.",
      "tag.d.value": "Cualquier identificador estable.",
      "tag.k": "Kind del borrador que contiene. Obligatorio.",
      "tag.k.value": 'Número de kind como string, p. ej. "1".',
      "tag.expiration": "Cuándo pueden borrar los relays el borrador (NIP-40). Recomendado.",
      "tag.expiration.value": "Timestamp Unix, p. ej. ahora + 90 días.",
      "event.checkpoint.label": "Checkpoint (kind 1234)",
      "event.checkpoint.explain": "Una instantánea cifrada (revisión) de un borrador.",
      "content.checkpoint": "Texto cifrado NIP-44 del borrador en ese momento.",
      "tag.a": "El envoltorio de borrador al que pertenece este checkpoint.",
      "tag.a.value": "Dirección 31234:<pubkey>:<d>.",
      "event.relays.label": "Lista de relays privados (kind 10013)",
      "event.relays.explain": "Los relays donde guardas eventos privados, como los borradores.",
      "content.relays": "Texto cifrado NIP-44 de los tags de relay, cifrado para ti.",
      "content.relays.plain": "Tras descifrar: un array JSON de tags de relay.",
      "schema.relays": "Tags privados.",
      "schema.relays.tag": "Una entrada de relay.",
      "schema.relays.name": 'Siempre "relay".',
      "schema.relays.url": "URL del relay.",
      "example.draft": "Nota a medio escribir",
      "example.draft.explain":
        "La nota kind 1 sin terminar de Alice, cifrada para sí misma, que caduca en 90 días.",
      "example.checkpoint": "Revisión guardada",
      "example.relays": "Relay de borradores",
      "example.relays.explain": 'Se descifra como [["relay", "wss://relay.delta.example"]].',
    },
  },
  n38: {
    title: "Estados de usuario",
    summary:
      "Comparte un estado en vivo junto a tu nombre, como lo que estás haciendo o la canción que suena, como un evento kind 30315 que puede caducar por sí solo.",
    text: {
      "how.type.title": "Un estado por tipo",
      "how.type.body":
        'kind 30315 es direccionable y el tag d es el tipo de estado, así que tienes un estado "general" actual y un estado "music". Publicar de nuevo lo reemplaza.',
      "how.content.title": "El texto del estado",
      "how.content.body":
        'El content es el propio estado: "De excursión", "En una reunión", el título de una canción. Se permiten emoji y emoji personalizados de NIP-30.',
      "how.link.title": "Enlázalo",
      "how.link.body":
        "Opcionalmente añade un tag r (URL), p (perfil), e (nota) o a (evento direccionable) para que los lectores puedan abrir lo que estás haciendo.",
      "how.expire.title": "Déjalo caducar",
      "how.expire.body":
        "Añade un tag expiration de NIP-40 para que el estado desaparezca solo. Para música, ponlo en el momento en que termina la pista.",
      "how.clear.title": "Bórralo",
      "how.clear.body": "Publicar el mismo tipo con content vacío borra ese estado.",
      "related.40": "Los estados pueden caducar con tags expiration de NIP-40.",
      "related.30": "El texto del estado puede contener emoji personalizados de NIP-30.",
      "related.01": "kind 30315 es un evento direccionable como se define en NIP-01.",
      "event.status.label": "Estado de usuario (kind 30315)",
      "event.status.explain":
        "Un estado en vivo que se muestra junto a tu nombre, uno por tipo de estado.",
      content: "El texto del estado. Vacío borra el estado.",
      "tag.d": "El tipo de estado. Obligatorio.",
      "tag.d.value": '"general", "music" u otro tipo.',
      "type.general": "Lo que estás haciendo: trabajando, de excursión, fuera de la oficina.",
      "type.music": "Lo que estás escuchando ahora mismo.",
      "tag.r": "Una URL relacionada con el estado.",
      "tag.r.value": "URL web o URI de app (spotify:…).",
      "tag.p": "Un perfil relacionado con el estado.",
      "tag.p.value": "Pubkey.",
      "tag.e": "Una nota relacionada con el estado.",
      "tag.e.value": "Id del evento.",
      "tag.a":
        "Un evento direccionable relacionado con el estado (un evento en vivo, un artículo).",
      "tag.a.value": "Dirección como kind:pubkey:d.",
      "tag.relay": "Pista de relay opcional.",
      "tag.expiration": "Cuándo debe desaparecer el estado (NIP-40).",
      "tag.expiration.value": "Timestamp Unix.",
      "example.general": "Lo que está haciendo Alice",
      "example.music": "Sonando ahora",
      "example.music.explain":
        "El estado musical de Bob caduca cuando termina la pista de 3 min 51 s.",
      "example.clear": "Borrar el estado",
      "example.clear.explain":
        "Mismo d, content vacío: los clientes dejan de mostrar el estado general de Alice.",
    },
  },
  n39: {
    title: "Vincular perfiles con otras plataformas",
    summary:
      "Demuestra que también controlas cuentas en otros sitios (GitHub, Mastodon, Bluesky, Telegram, Discord…): enuméralas en un evento kind 10011, cada una apuntando a una publicación pública donde esa cuenta menciona tu npub.",
    text: {
      "how.claim.title": "Enumera tus cuentas",
      "how.claim.body":
        'Publica un kind 10011 con un tag i por cuenta: "plataforma:identidad", por ejemplo "github:alice-nostr". Los nombres de plataforma solo usan a-z, 0-9 y ._-/ y nunca dos puntos.',
      "how.proof-text.title": "Publica la prueba en la otra plataforma",
      "how.proof-text.body":
        'Desde esa cuenta, publica "Verifying that I control the following Nostr public key: <tu npub>" como gist, publicación o mensaje.',
      "how.proof.title": "Apunta a la prueba",
      "how.proof.body":
        "El segundo valor del tag i indica dónde está la prueba: un id de Gist, un id de publicación, o <canal>/<mensaje> para Telegram. Cada plataforma define cómo convertirlo en una URL.",
      "how.verify.title": "Los demás verifican",
      "how.verify.body":
        "Un cliente construye la URL de la prueba, la descarga y comprueba que la publicación es de esa cuenta y contiene tu npub. Acepta también redacciones antiguas, siempre que esté el npub.",
      "related.05":
        "NIP-05 vincula tu clave a un nombre de dominio; NIP-39 la vincula a cuentas en otras plataformas.",
      "related.19": "Las pruebas citan tu npub de NIP-19.",
      "related.73":
        "NIP-73 también usa ids con prefijo de plataforma en tags i, para contenido en lugar de identidades.",
      "event.identities.label": "Identidades externas (kind 10011)",
      "event.identities.explain":
        "Tus cuentas declaradas en otras plataformas, cada una con una prueba.",
      "tag.i": "Una identidad declarada con su prueba.",
      "tag.i.claim":
        "plataforma:identidad, p. ej. github:<usuario>, twitter:<usuario>, mastodon:<instancia>/@<usuario>, telegram:<id de usuario>, bluesky:<handle>, discord:<usuario>.",
      "tag.i.proof":
        "Dónde está la prueba: un id de Gist (github), un id de publicación (twitter, mastodon, clave de registro de bluesky), <ref>/<id> (telegram) o <servidor>/<canal>/<mensaje> (discord).",
      "tag.i.extra": "Valores extra para futuras extensiones; los clientes deberían aceptarlos.",
      "example.alice": "Las cuentas de Alice",
      "example.alice.explain":
        "GitHub (prueba en gist.github.com/alice-nostr/<id>), Bluesky (bsky.app/profile/alice.bsky.social/post/<id>) y Mastodon.",
      "example.frank": "Telegram y Discord",
    },
  },
};
