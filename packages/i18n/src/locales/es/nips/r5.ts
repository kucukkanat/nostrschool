// Owner: translation agents. Must structurally match ../../en/nips/r5.ts (enforced by the type).
import type { r5 as en } from "../../en/nips/r5.ts";

export const r5: typeof en = {
  n84: {
    title: "Destacados",
    summary:
      "El kind 9802 guarda un fragmento que te gustó de un artículo, una página web o cualquier otra fuente, con un enlace a su origen y a quien lo escribió.",
    text: {
      "how.select.title": "Elige el fragmento",
      "how.select.body":
        "Las palabras destacadas van en content, tal como aparecen en la fuente. En destacados de audio o video, content puede quedar vacío.",
      "how.source.title": "Señala la fuente",
      "how.source.body":
        "Etiqueta dónde vive el fragmento: una etiqueta a o e para un evento de nostr, una etiqueta i para un identificador NIP-73 como el ISBN de un libro, o una etiqueta r para una URL web.",
      "how.attribute.title": "Da crédito al autor",
      "how.attribute.body":
        'Añade etiquetas p para quienes escribieron el original, con un rol como "author" o "editor" como último valor. Funciona incluso con contenido fuera de nostr si el cliente encuentra la pubkey del autor.',
      "how.context.title": "Añade contexto (opcional)",
      "how.context.body":
        "Si el destacado forma parte de un párrafo más largo, una etiqueta context puede llevar el texto que lo rodea para que se entienda su sentido.",
      "how.quote.title": "Conviértelo en una cita",
      "how.quote.body":
        'Añade una etiqueta comment para compartir tu opinión junto al destacado, como un repost con cita. Las pubkeys y URLs mencionadas en el comentario llevan el marcador "mention"; la URL destacada lleva "source".',
      "related.01": "Los destacados son eventos firmados normales.",
      "related.23": "Los artículos de formato largo (kind 30023) son lo que más se suele destacar.",
      "related.73":
        "La etiqueta i usa los identificadores de contenido externo de NIP-73 (libros, podcasts, URLs).",
      "related.94": "Los archivos de audio y video se pueden destacar con content vacío.",
      "related.18": "Un destacado con comentario se muestra como un repost con cita.",
      "event.highlight.label": "Destacado (kind 9802)",
      "event.highlight.explain":
        "Un fragmento que alguien quiso conservar, con etiquetas que apuntan a la fuente y dan crédito a su autor.",
      content:
        "El texto destacado, copiado de la fuente. Puede estar vacío cuando la fuente no es texto (audio, video).",
      "tag.a":
        "Dirección del evento direccionable destacado, como un artículo (kind:pubkey:d-tag).",
      "tag.a.address":
        "La coordenada del artículo: kind, pubkey del autor y etiqueta d unidos por dos puntos.",
      "tag.relay": "Relay donde se encuentra el evento o el autor referenciado. Pista opcional.",
      "tag.e": "Id de la versión exacta del evento que se destacó.",
      "tag.e.event-id": "El id hexadecimal de 64 caracteres del evento destacado.",
      "tag.i":
        "Un identificador externo NIP-73 para la fuente, como un ISBN o el GUID de un podcast.",
      "tag.i.identifier": 'El identificador en sí, p. ej. "isbn:9780765382030".',
      "tag.i.hint": "URL opcional donde se encuentra el contenido identificado.",
      "tag.r":
        "Cualquier otra fuente, normalmente una URL web. También se usa para URLs mencionadas en un comentario.",
      "tag.r.source": "La URL (o texto libre) de la fuente.",
      "tag.r.marker":
        "Indica si esta URL es la fuente destacada o solo se menciona en el comentario.",
      "tag.r.marker.source": "De aquí viene el fragmento destacado.",
      "tag.r.marker.mention": "Una URL mencionada en el comentario, no la fuente.",
      "tag.p":
        "Alguien relacionado con el material destacado: su autor, su editor o una persona mencionada en el comentario.",
      "tag.p.pubkey": "La clave pública de esa persona en hexadecimal.",
      "tag.p.role": "Lo que hizo esta persona. Los clientes lo usan para mostrar los créditos.",
      "tag.p.role.author": "Escribió el material destacado.",
      "tag.p.role.editor": "Editó el material destacado.",
      "tag.p.role.mention":
        "Mencionada en el comentario; obligatorio en las menciones del comentario para que no se lean como autores.",
      "tag.context": "El texto que lo rodea, para que se entienda el destacado.",
      "tag.context.text": "El párrafo o la frase alrededor del destacado.",
      "tag.comment":
        "Tus propias palabras sobre el destacado. Lo convierte en un destacado con cita.",
      "tag.comment.text": "El comentario, que se muestra encima del fragmento citado.",
      "example.nostr-article.label": "Destacado de un artículo de nostr",
      "example.nostr-article.explain":
        "Alice destaca una línea del artículo de formato largo de Frank y le da crédito como autor.",
      "example.web-page.label": "Destacado de una página web",
      "example.web-page.explain":
        "Carol destaca su propia entrada de blog en la web. La etiqueta r lleva la URL con el marcador source.",
      "example.quote-highlight.label": "Destacado con cita y comentario",
      "example.quote-highlight.explain":
        "Bob comparte el mismo fragmento con un comentario que menciona a Alice y la URL de una lista de lectura, cada una con el marcador mention.",
    },
  },
  n85: {
    title: "Afirmaciones de confianza",
    summary:
      "Permite que cálculos pesados, como puntuaciones de red de confianza o recuentos de seguidores, se hagan en un servicio que tú eliges, que publica los resultados como eventos firmados que tu cliente simplemente lee.",
    text: {
      "how.why.title": "Por qué delegar los cálculos",
      "how.why.body":
        "Clasificar a un usuario o contar reacciones requiere millones de eventos. Un teléfono no puede descargar todo eso, así que un servicio de confianza hace el trabajo y publica las respuestas.",
      "how.choose.title": "Elige tus proveedores",
      "how.choose.body":
        'Publicas un kind 10040 que indica, para cada resultado como "30382:rank", en qué clave de servicio confías y en qué relay publica. La lista puede ir en etiquetas públicas o en content cifrado con NIP-44.',
      "how.compute.title": "El servicio calcula",
      "how.compute.body":
        "El proveedor ejecuta su algoritmo y publica una afirmación direccionable. La etiqueta d indica el sujeto: una pubkey (30382), un evento (30383), una dirección (30384) o un id NIP-73 (30385).",
      "how.results.title": "Los resultados son etiquetas",
      "how.results.body":
        "Cada resultado es una etiqueta con un nombre acordado, como rank (0–100) o followers. Cada proveedor puede contar de forma distinta; precisamente por eso eliges uno.",
      "how.read.title": "Los clientes leen las respuestas",
      "how.read.body":
        "Tu cliente obtiene las afirmaciones de los relays que indicaste, firmadas por las claves en las que confías. Los proveedores usan claves distintas por algoritmo, así que la confianza se elige por resultado.",
      "related.01":
        "Las afirmaciones son eventos direccionables: una más nueva reemplaza a la anterior.",
      "related.44":
        "El kind 10040 puede ocultar su lista de proveedores en content cifrado con NIP-44.",
      "related.73":
        "El kind 30385 puntúa cosas externas (hashtags, libros, sitios) por su id NIP-73.",
      "related.02":
        "Las listas de seguidos son los datos en bruto de los que parten la mayoría de las puntuaciones de confianza.",
      "related.51": "El kind 10040 es una lista reemplazable estándar, como otras listas NIP-51.",
      "flow.assertions.label": "Elige un proveedor y lee sus puntuaciones",
      "flow.assertions.explain":
        "La lista 10040 del usuario dice de quién confiar las afirmaciones; el 30382 del proveedor lleva los números.",
      "flow.assertions.providers":
        "Alice designa la clave del servicio de Dave como su fuente de rangos y recuentos de seguidores.",
      "flow.assertions.user":
        "El servicio de Dave publica el rango y las estadísticas de Alice; el cliente de Alice los lee.",
      "event.user.label": "Afirmación de usuario (kind 30382)",
      "event.user.explain":
        "Datos calculados sobre una pubkey, publicados por un proveedor de servicios.",
      "content.empty": "Vacío. Todos los resultados van en las etiquetas.",
      "tag.d.user": "El sujeto de la afirmación: la pubkey descrita.",
      "tag.d.user.subject":
        "Clave pública hexadecimal del usuario al que se refieren las puntuaciones.",
      "tag.followers": "Cuántos seguidores cuenta el proveedor para este usuario.",
      "field.count": "Un número entero, cero o más. Los importes van en sats.",
      "tag.rank":
        "Una puntuación normalizada de 0 a 100. Cuanto más alta, más confianza según el algoritmo de este proveedor.",
      "field.rank": "Número entero entre 0 y 100.",
      "tag.first_created_at":
        "Cuándo vio el proveedor por primera vez una publicación de este usuario.",
      "field.timestamp": "Tiempo Unix en segundos.",
      "tag.post_cnt": "Número de publicaciones.",
      "tag.reply_cnt": "Número de respuestas.",
      "tag.reactions_cnt": "Número de reacciones.",
      "tag.zap_amt_recd": "Total de sats recibidos en zaps.",
      "tag.zap_amt_sent": "Total de sats enviados en zaps.",
      "tag.zap_cnt_recd": "Número de zaps recibidos.",
      "tag.zap_cnt_sent": "Número de zaps enviados.",
      "tag.zap_avg_amt_day_recd": "Promedio de sats recibidos por día.",
      "tag.zap_avg_amt_day_sent": "Promedio de sats enviados por día.",
      "tag.reports_cnt_recd": "Número de denuncias (NIP-56) presentadas contra este usuario.",
      "tag.reports_cnt_sent": "Número de denuncias que presentó este usuario.",
      "tag.t": "Un tema del que este usuario habla a menudo. Repítela para varios temas.",
      "tag.t.topic": "El tema, como un hashtag sin el #.",
      "tag.active_hours_start":
        "Hora del día (UTC) en la que el usuario suele empezar a estar activo.",
      "field.hour": "Hora en UTC, de 0 a 24.",
      "tag.active_hours_end":
        "Hora del día (UTC) en la que el usuario suele dejar de estar activo.",
      "tag.hint": "Repite el sujeto solo para añadirle una pista de relay.",
      "tag.hint.subject": "El mismo valor que la etiqueta d.",
      "tag.hint.relay": "Relay donde se encuentra el sujeto (usuario o evento).",
      "example.rank-alice.label": "Estadísticas del perfil de Alice",
      "example.rank-alice.explain":
        "El servicio de Dave le da a Alice un 89/100 y añade cifras de seguidores, publicaciones y zaps.",
      "example.rank-only.label": "Solo un rango",
      "example.rank-only.explain": "La afirmación útil más pequeña: un sujeto y un rango.",
      "event.event.label": "Afirmación de evento (kind 30383)",
      "event.event.explain": "Estadísticas calculadas sobre un único evento.",
      "tag.d.event": "El sujeto: el id del evento puntuado.",
      "tag.d.event.subject": "Id hexadecimal del evento puntuado.",
      "tag.comment_cnt": "Número de comentarios o respuestas.",
      "tag.quote_cnt": "Número de citas.",
      "tag.repost_cnt": "Número de reposts.",
      "tag.reaction_cnt": "Número de reacciones.",
      "tag.zap_cnt": "Número de zaps.",
      "tag.zap_amount": "Total de sats en zaps.",
      "example.note-stats.label": "Estadísticas de la nota de Bob",
      "example.note-stats.explain":
        "Cifras de interacción de una de las notas de Bob, más una pista de relay para ella.",
      "event.address.label": "Afirmación de dirección (kind 30384)",
      "event.address.explain":
        "Estadísticas de un evento direccionable sumando todas sus versiones.",
      "tag.d.address": "El sujeto: la dirección del evento (kind:pubkey:d-tag).",
      "tag.d.address.subject": "La dirección puntuada.",
      "example.article-stats.label": "Estadísticas del artículo de Frank",
      "example.article-stats.explain":
        "Rango, reposts y zaps de todas las versiones del ensayo de Frank.",
      "event.external.label": "Afirmación externa (kind 30385)",
      "event.external.explain":
        "Estadísticas de algo fuera de nostr: un hashtag, un libro, un sitio web.",
      "tag.d.external": "El sujeto: un identificador NIP-73.",
      "tag.d.external.subject": 'El identificador, p. ej. "#nostr" o "isbn:9780765382030".',
      "tag.k": "El tipo NIP-73 del identificador.",
      "tag.k.type": 'El tipo, p. ej. "#" para hashtags o "isbn" para libros.',
      "example.hashtag.label": "Puntuación de un hashtag",
      "example.hashtag.explain":
        "Qué tan popular y bien clasificado está #nostr, según el servicio de Dave.",
      "event.providers.label": "Proveedores de confianza (kind 10040)",
      "event.providers.explain":
        "La elección del usuario sobre qué clave de servicio usar para cada tipo de resultado.",
      "content.providers":
        "Vacío en una lista pública. En una lista privada, las mismas etiquetas codificadas en JSON y cifradas con NIP-44 para ti mismo.",
      "tag.provider":
        'El nombre de la etiqueta es "<kind>:<etiqueta de resultado>", p. ej. "30382:rank". Repite un nombre para confiar en varios proveedores para el mismo resultado.',
      "tag.provider.key": "La clave pública del servicio para este algoritmo.",
      "tag.provider.relay": "Relay donde ese servicio publica sus afirmaciones.",
      "example.public.label": "Una lista pública de proveedores",
      "example.public.explain":
        "Alice confía en el servicio de Dave para rangos y recuentos, y en el de Grace para los totales de zaps.",
    },
  },
  n86: {
    title: "API de gestión de relays",
    summary:
      "Una API HTTP, en la misma dirección que el WebSocket del relay, que permite a su operador vetar pubkeys, permitir kinds y moderar eventos con llamadas JSON-RPC sencillas firmadas mediante NIP-98.",
    text: {
      "how.same-url.title": "La misma dirección, HTTP normal",
      "how.same-url.body":
        "La API de gestión vive en la propia URL del relay, accesible por https en lugar de wss. El relay la reconoce por el Content-Type application/nostr+json+rpc.",
      "how.authorize.title": "Demuestra que eres el administrador",
      "how.authorize.body":
        "Cada llamada lleva una cabecera Authorization de NIP-98. Aquí la etiqueta payload (el SHA-256 del cuerpo) es obligatoria, para que una cabecera firmada no se pueda reutilizar en otro comando.",
      "how.call.title": "Llama a un método",
      "how.call.body":
        'El cuerpo es un objeto JSON con method (como "banpubkey") y params (un arreglo, a menudo una pubkey o un id de evento más un motivo opcional).',
      "how.discover.title": "Pregunta qué se admite",
      "how.discover.body":
        "supportedmethods devuelve los métodos que este relay te ofrece. Pueden variar según el usuario y sus permisos.",
      "how.answer.title": "Lee la respuesta",
      "how.answer.body":
        "El relay responde con result (a menudo solo true) o con un mensaje de error. Si falta la autorización o es incorrecta, devuelve HTTP 401.",
      "related.98": "Cada llamada se autoriza con un evento NIP-98 en la cabecera Authorization.",
      "related.11":
        "El documento de información del relay se sirve desde la misma URL con otra cabecera Accept.",
      "related.43": "Los métodos claim gestionan los códigos de invitación de NIP-43.",
      "related.42":
        "NIP-42 autentica a los clientes WebSocket; esta API usa en cambio autenticación HTTP.",
      "flow.manage.label": "Firma y luego llama",
      "flow.manage.explain":
        "El administrador firma un evento kind 27235 para la petición exacta y luego lo envía con el cuerpo RPC.",
      "flow.manage.auth":
        "Dave firma un evento de autenticación que indica la URL del relay, POST y el hash del cuerpo.",
      "flow.manage.rpc": "El evento en base64 va en la cabecera Authorization de la llamada RPC.",
      "event.auth.label": "Autorización de administrador (kind 27235)",
      "event.auth.explain": "Un evento NIP-98 que autoriza exactamente una petición de gestión.",
      "event.auth.content": "Vacío.",
      "event.auth.u": "La URL a la que se llama: la dirección del relay por https.",
      "event.auth.u.url": "Debe coincidir exactamente con la URL de la petición.",
      "event.auth.method": "El método HTTP. Las llamadas de gestión siempre usan POST.",
      "event.auth.method.value": "POST.",
      "event.auth.payload": "SHA-256 del cuerpo de la petición. Obligatorio en esta API.",
      "event.auth.payload.hash": "Hash hexadecimal de los bytes exactos del cuerpo JSON.",
      "example.auth.label": "Autenticación para supportedmethods",
      "example.auth.explain":
        "El evento que firma Dave antes de preguntar qué métodos admite el relay.",
      "http.rpc.label": "Llamada de gestión",
      "http.rpc.explain":
        "Un POST al estilo JSON-RPC a la URL del relay: un método, sus parámetros, una respuesta.",
      "header.content-type": "Indica al relay que esta petición HTTP es una llamada de gestión.",
      "header.content-type.value": "El único valor aceptado.",
      "header.authorization":
        'La cadena "Nostr " seguida del evento kind 27235 firmado y codificado en base64.',
      body: "La llamada: qué método ejecutar y con qué parámetros.",
      "body.method": "Nombre del método a ejecutar.",
      "method.supportedmethods": "Lista los métodos que tienes disponibles. Sin parámetros.",
      "method.banpubkey":
        "Veta una pubkey (y la quita de la lista de permitidos). Parámetros: pubkey, motivo opcional.",
      "method.unbanpubkey":
        "Quita una pubkey de la lista de vetados. Parámetros: pubkey, motivo opcional.",
      "method.listbannedpubkeys": "Lista las pubkeys vetadas con sus motivos. Sin parámetros.",
      "method.allowpubkey":
        "Añade una pubkey a la lista de permitidos (y levanta su veto). Parámetros: pubkey, motivo opcional.",
      "method.unallowpubkey":
        "Quita una pubkey de la lista de permitidos. Parámetros: pubkey, motivo opcional.",
      "method.listallowedpubkeys": "Lista las pubkeys permitidas con sus motivos. Sin parámetros.",
      "method.createrole": "Crea un rol. Parámetros: id, etiqueta, descripción, color, orden.",
      "method.editrole": "Actualiza un rol. Parámetros: id, etiqueta, descripción, color, orden.",
      "method.deleterole": "Elimina un rol. Parámetros: id.",
      "method.assignrole": "Asigna un rol a una pubkey. Parámetros: pubkey, id del rol.",
      "method.unassignrole": "Quita un rol a una pubkey. Parámetros: pubkey, id del rol.",
      "method.listclaims":
        "Lista los códigos de invitación NIP-43 que acepta el relay. Sin parámetros.",
      "method.createclaim": "Crea un código de invitación NIP-43. Parámetros: el código.",
      "method.deleteclaim": "Revoca un código de invitación NIP-43. Parámetros: el código.",
      "method.listeventsneedingmoderation":
        "Lista los eventos pendientes de revisión. Sin parámetros.",
      "method.allowevent":
        "Permite un evento (y levanta su veto). Parámetros: id del evento, motivo opcional.",
      "method.unallowevent":
        "Quita un evento de la lista de permitidos. Parámetros: id del evento, motivo opcional.",
      "method.banevent":
        "Veta un evento (y lo quita de la lista de permitidos). Parámetros: id del evento, motivo opcional.",
      "method.unbanevent":
        "Quita un evento de la lista de vetados. Parámetros: id del evento, motivo opcional.",
      "method.listbannedevents": "Lista los eventos vetados con sus motivos. Sin parámetros.",
      "method.listallowedevents": "Lista los eventos permitidos con sus motivos. Sin parámetros.",
      "method.changerelayname": "Cambia el nombre del relay. Parámetros: el nuevo nombre.",
      "method.changerelaydescription":
        "Cambia la descripción del relay. Parámetros: el nuevo texto.",
      "method.changerelayicon": "Cambia el icono del relay. Parámetros: la URL del nuevo icono.",
      "method.allowkind": "Acepta un kind de evento. Parámetros: el número de kind.",
      "method.disallowkind": "Deja de aceptar un kind de evento. Parámetros: el número de kind.",
      "method.listallowedkinds": "Lista los kinds aceptados. Sin parámetros.",
      "method.listdisallowedkinds": "Lista los kinds rechazados. Sin parámetros.",
      "method.blockip": "Bloquea una dirección IP. Parámetros: IP, motivo opcional.",
      "method.unblockip": "Desbloquea una dirección IP. Parámetros: IP.",
      "method.listblockedips": "Lista las IP bloqueadas con sus motivos. Sin parámetros.",
      "body.params":
        "Los argumentos del método, en orden. Un arreglo vacío para métodos sin parámetros.",
      "body.params.item": "Un argumento.",
      "body.params.string":
        "Un argumento de texto: una pubkey, un id de evento, un motivo, un nombre, una URL o una IP.",
      "body.params.number": "Un argumento numérico: un kind o el orden de un rol.",
      "response.200": "La llamada se procesó.",
      "response.200.body": "La respuesta del relay.",
      "response.200.result":
        "El resultado del método: true para las acciones, un arreglo para los métodos de listado.",
      "response.200.error": "Solo aparece si la llamada falló: un error legible por humanos.",
      "response.401": "Falta la cabecera Authorization o no es válida.",
      "example.supportedmethods.label": "¿Qué puedo hacer aquí?",
      "example.supportedmethods.explain": "Dave pregunta a su relay qué métodos de gestión admite.",
      "example.banpubkey.label": "Vetar a un spammer",
      "example.banpubkey.explain":
        "Dave veta una pubkey con un motivo que el relay guarda en su lista de vetados.",
      "example.allowkind.label": "Aceptar artículos de formato largo",
      "example.allowkind.explain": "Dave empieza a aceptar el kind 30023 en su relay.",
    },
  },
  n87: {
    title: "Descubrimiento de Cashu y Fedimint",
    summary:
      "Las mints de ecash se anuncian con un evento y la gente recomienda las mints en las que confía, así un monedero puede encontrar una mint a través de las personas que sigues.",
    text: {
      "how.announce.title": "Una mint se anuncia",
      "how.announce.body":
        "Una mint Cashu publica un kind 38172 con su URL, los NUTs (funciones de Cashu) que admite y la red en la que funciona. La etiqueta d es la propia pubkey de la mint.",
      "how.federation.title": "Las federaciones hacen lo mismo",
      "how.federation.body":
        "Una federación Fedimint publica un kind 38173. Su etiqueta d es el id de la federación y sus etiquetas u listan códigos de invitación para unirse.",
      "how.recommend.title": "La gente recomienda mints",
      "how.recommend.body":
        "Un usuario publica un kind 38000 para avalar una mint, con una breve reseña en content. Es direccionable, así que puede cambiar de opinión más adelante.",
      "how.discover.title": "Los monederos buscan recomendaciones",
      "how.discover.body":
        'Un monedero pide a los relays los kind 38000 de las personas que sigues, filtrados por la etiqueta k ("38172" para Cashu, "38173" para Fedimint).',
      "how.connect.title": "Luego se conecta",
      "how.connect.body":
        "La etiqueta a apunta al anuncio exacto de la mint y la etiqueta u dice cómo conectarse. Seguir la etiqueta a evita impostores que dicen ser la misma mint.",
      "related.01": "Los anuncios y las recomendaciones son eventos direccionables.",
      "related.60": "Los monederos Cashu (NIP-60) necesitan una mint para guardar ecash.",
      "related.61": "Los nutzaps (NIP-61) se pagan a través de mints que puedes descubrir aquí.",
      "related.89":
        "Usa el mismo patrón de anunciar y recomendar que los manejadores de aplicaciones.",
      "flow.find-a-mint.label": "Encuentra una mint a través de tus amigos",
      "flow.find-a-mint.explain":
        "Una mint se anuncia; un amigo la recomienda; tu monedero se conecta.",
      "flow.find-a-mint.announce": "La mint de Dave publica su URL y las funciones que admite.",
      "flow.find-a-mint.recommend": "Alice la recomienda, apuntando al anuncio con una etiqueta a.",
      "event.recommendation.label": "Recomendación de mint (kind 38000)",
      "event.recommendation.explain": "Un usuario avala una mint de ecash.",
      "content.review": "Reseña opcional de la mint, en texto plano.",
      "tag.k": "Qué tipo de mint se recomienda.",
      "tag.k.kind": "38172 para una mint Cashu, 38173 para una federación Fedimint.",
      "tag.d.recommendation":
        "Identifica la mint: la etiqueta d de su anuncio (pubkey de la mint o id de la federación).",
      "tag.d.identifier": "El mismo valor que la etiqueta d del anuncio de la mint.",
      "tag.u.recommendation":
        "Cómo conectarse a la mint: una URL o un código de invitación. Puede repetirse.",
      "tag.u.connect": "URL de la mint (Cashu) o código de invitación (Fedimint).",
      "tag.mint-type": 'Etiqueta opcional: "cashu" o "fedimint".',
      "mint-type.cashu": "Una mint Cashu, accesible por URL.",
      "mint-type.fedimint":
        "Una federación Fedimint, a la que te unes con un código de invitación.",
      "tag.a": "Apunta al evento de anuncio de la mint. Puede repetirse.",
      "tag.a.address": "Dirección del anuncio: kind:pubkey:d-tag.",
      "tag.a.relay": "Relay donde se encuentra el anuncio.",
      "example.recommend-cashu.label": "Recomendar una mint Cashu",
      "example.recommend-cashu.explain": "Alice avala la mint Cashu de Dave y enlaza a su anuncio.",
      "example.recommend-fedimint.label": "Recomendar una federación",
      "example.recommend-fedimint.explain":
        "Bob recomienda una federación en signet con su código de invitación.",
      "event.cashu-mint.label": "Anuncio de mint Cashu (kind 38172)",
      "event.cashu-mint.explain": "Una mint Cashu dice dónde está y qué admite.",
      "content.metadata":
        "JSON opcional al estilo del kind 0 (name, about, picture). Si está vacío, los clientes muestran el perfil de quien publica.",
      "tag.d.cashu": "La pubkey de la mint, tal como la indica su endpoint /v1/info.",
      "tag.d.cashu.pubkey": "Clave pública comprimida de la mint, 33 bytes en hexadecimal.",
      "tag.u.cashu": "La URL de la mint.",
      "tag.u.cashu.url": "Dirección HTTPS de la mint.",
      "tag.nuts": "Qué NUTs de Cashu (funciones del protocolo) admite la mint.",
      "tag.nuts.list": 'Números de NUT separados por comas, p. ej. "1,2,3,4,5".',
      "tag.n": "La red de Bitcoin en la que funciona la mint.",
      "tag.n.network": "Una de mainnet, testnet, signet o regtest.",
      "network.mainnet": "Bitcoin real.",
      "network.testnet": "Red de pruebas de Bitcoin.",
      "network.signet": "Red de pruebas firmada, buena para demostraciones.",
      "network.regtest": "Red de pruebas local para desarrollo.",
      "example.cashu.label": "La mint Cashu de Dave",
      "example.cashu.explain":
        "Una mint en mainnet que admite los NUTs del 1 al 12, sin metadatos adicionales.",
      "event.fedimint.label": "Anuncio de Fedimint (kind 38173)",
      "event.fedimint.explain": "Una federación dice cómo unirse a ella y qué módulos ejecuta.",
      "tag.d.fedimint": "El id de la federación.",
      "tag.d.fedimint.id": "Id de la federación de 32 bytes en hexadecimal.",
      "tag.u.fedimint":
        "Un código de invitación para unirse a la federación. Lista todos los códigos conocidos.",
      "tag.u.fedimint.invite": 'Un código de invitación bech32 que empieza por "fed11".',
      "tag.modules": "Módulos que ejecuta la federación.",
      "tag.modules.list": 'Nombres separados por comas, p. ej. "lightning,wallet,mint".',
      "example.fedimint.label": "Una federación en signet",
      "example.fedimint.explain":
        "Dave anuncia una federación de pruebas, con su nombre en content.",
    },
  },
  n88: {
    title: "Encuestas",
    summary:
      "Una encuesta es un evento kind 1068 con una pregunta y opciones; cada voto es un evento kind 1018 enviado a los relays que indica la encuesta, y los clientes cuentan un voto por persona.",
    text: {
      "how.ask.title": "Haz la pregunta",
      "how.ask.body": "El content de la encuesta es la pregunta o el título que verá la gente.",
      "how.options.title": "Enumera las opciones",
      "how.options.body":
        "Cada etiqueta option tiene un id corto y un texto. Los votos se refieren al id, así que los textos pueden estar en cualquier idioma.",
      "how.where.title": "Indica dónde votar",
      "how.where.body":
        "Las etiquetas relay indican los relays donde deben enviarse y contarse los votos. polltype dice si es de opción única o múltiple, y endsAt cuándo se cierra la votación.",
      "how.vote.title": "Vota",
      "how.vote.body":
        "Un voto es un kind 1018 con una etiqueta e que apunta a la encuesta y una o más etiquetas response con ids de opción.",
      "how.count.title": "Cuenta de forma justa",
      "how.count.body":
        "Los clientes obtienen los votos de los relays de la encuesta y se quedan solo con el último voto de cada pubkey antes de endsAt. También pueden contar solo a personas de un conjunto de seguidos o con una buena puntuación de confianza.",
      "related.01": "Las encuestas y los votos son eventos firmados normales.",
      "related.51": "Los conjuntos de seguidos (kind 30000) pueden limitar qué votos se cuentan.",
      "related.13": "La prueba de trabajo es una forma de filtrar votos spam.",
      "related.09":
        "Los relays de encuestas deberían ignorar las solicitudes de borrado de votos para que los resultados se mantengan estables.",
      "flow.vote.label": "Preguntar y responder",
      "flow.vote.explain": "Sale una encuesta y los votos vuelven por los relays de la encuesta.",
      "flow.vote.poll": "Alice publica la pregunta con dos opciones.",
      "flow.vote.response":
        "Bob vota haciendo referencia al id de la encuesta y a un id de opción.",
      "event.poll.label": "Encuesta (kind 1068)",
      "event.poll.explain": "Una pregunta con una lista de opciones y reglas de votación.",
      "content.poll": "La pregunta o el título de la encuesta.",
      "tag.option": "Una respuesta que se puede elegir. Repítela para cada opción.",
      "tag.option.id": "Id alfanumérico corto al que se refieren los votos.",
      "tag.option.label": "El texto que se muestra para esta opción.",
      "tag.relay": "Un relay donde deben publicarse los votos. Repítela para varios.",
      "tag.relay.url": "URL WebSocket del relay.",
      "tag.polltype": "Si se puede elegir una opción o varias. Si falta, es de opción única.",
      "tag.polltype.type": "singlechoice o multiplechoice.",
      "polltype.singlechoice": "Solo cuenta la primera etiqueta response de un voto.",
      "polltype.multiplechoice": "Cuenta cada id de opción distinto de un voto.",
      "tag.endsAt": "Cuándo se cierra la encuesta.",
      "tag.endsAt.time": "Tiempo Unix en segundos.",
      "example.single.label": "Encuesta de opción única",
      "example.single.explain":
        "Alice hace una pregunta de sí o no, abierta durante una semana, con votos en dos relays.",
      "example.multiple.label": "Encuesta de opción múltiple",
      "example.multiple.explain":
        "Dave pregunta a los usuarios de su relay qué funciones quieren; pueden elegir varias.",
      "event.response.label": "Voto (kind 1018)",
      "event.response.explain": "La respuesta de una persona a una encuesta.",
      "content.response": "Normalmente vacío.",
      "tag.e": "La encuesta que se responde.",
      "tag.e.poll": "Id del evento de encuesta kind 1068.",
      "tag.response": "Una opción elegida. Repítela en encuestas de opción múltiple.",
      "tag.response.id": "El id de opción de la encuesta.",
      "example.vote-yay.label": "Un voto único",
      "example.vote-yay.explain": 'Bob elige "Yay" en la encuesta de Alice.',
      "example.vote-many.label": "Un voto de opción múltiple",
      "example.vote-many.explain": "Erin elige dos opciones en la encuesta de Dave.",
    },
  },
  n89: {
    title: "Manejadores de aplicaciones recomendados",
    summary:
      "Cuando tu app encuentra un kind de evento que no sabe mostrar, puede buscar una app que sí sepa: las apps anuncian qué kinds manejan (31990) y la gente las recomienda (31989).",
    text: {
      "how.unknown.title": "Aparece un kind desconocido",
      "how.unknown.body":
        "Tu cliente social ve, por ejemplo, un artículo kind 30023 que no sabe mostrar. En lugar de quedarse ahí, puede buscar una app que maneje ese kind.",
      "how.announce.title": "Las apps anuncian lo que manejan",
      "how.announce.body":
        "Una app publica un kind 31990 con una etiqueta k por cada kind que admite. Una app puede listar muchos kinds; una pubkey puede publicar varios manejadores.",
      "how.templates.title": "Plantillas de URL",
      "how.templates.body":
        'Las etiquetas web, ios y android llevan enlaces con "<bech32>" donde va la entidad. El segundo valor dice qué entidad NIP-19 encaja; una etiqueta sin él es la opción por defecto.',
      "how.recommend.title": "La gente recomienda apps",
      "how.recommend.body":
        "Un usuario publica un kind 31989 cuya etiqueta d es el número de kind, con etiquetas a que apuntan a los eventos de manejador que le gustan, por plataforma.",
      "how.open.title": "Ábrelo en la app adecuada",
      "how.open.body":
        "Tu cliente consulta los 31989 tuyos y de tus seguidos para ese kind, sigue la etiqueta a hasta el 31990, rellena la plantilla de URL con el nevent o naddr del evento y lo abre.",
      "how.client-tag.title": "La etiqueta client",
      "how.client-tag.body":
        "Las apps pueden añadir una etiqueta client a los eventos que publican, con su nombre y su manejador. Revela qué app usas, así que los usuarios deberían poder desactivarla.",
      "related.19":
        "Las URLs de los manejadores se rellenan con entidades NIP-19 (nevent, naddr, nprofile…).",
      "related.31":
        "Hasta que se abre un manejador, los clientes muestran el texto alt del evento de NIP-31.",
      "related.5A": "Las etiquetas latest y next apuntan a manifiestos nsite de apps web.",
      "related.90":
        "Las máquinas expendedoras de datos anuncian los kinds de trabajo que atienden con el kind 31990.",
      "related.87": "Las mints de ecash usan el mismo patrón de anunciar y recomendar.",
      "flow.find-handler.label": "Encuentra una app para un kind",
      "flow.find-handler.explain":
        "La recomendación de un amigo lleva al evento de manejador de la app.",
      "flow.find-handler.recommend": "Alice recomienda el lector de Frank para el kind 30023.",
      "flow.find-handler.handler": "El evento de manejador da la URL en la que abrir el artículo.",
      "event.handler.label": "Información del manejador (kind 31990)",
      "event.handler.explain": "Una app dice qué kinds puede mostrar y cómo enlazar a ella.",
      "content.metadata":
        "JSON opcional al estilo del kind 0 (name, about, picture). Si está vacío, los clientes usan el perfil de quien publica.",
      "tag.d.handler": "Un id aleatorio o descriptivo para este evento de manejador.",
      "tag.d.identifier": "Cualquier cadena, única entre los eventos de manejador de esta pubkey.",
      "tag.k": "Un kind de evento que esta app puede manejar. Repítela para varios kinds.",
      "tag.k.kind": "El número de kind.",
      "tag.web": "Plantilla de URL web para abrir una entidad.",
      "tag.platform.template": 'URL con "<bech32>" donde el cliente inserta la entidad NIP-19.',
      "tag.platform.entity":
        "Qué tipo de entidad espera esta URL. Omítelo para un enlace genérico.",
      "entity.npub": "Una clave pública sin más.",
      "entity.nprofile": "Un perfil con pistas de relay.",
      "entity.note": "Un id de evento sin más.",
      "entity.nevent": "Un evento con pistas de relay y autor.",
      "entity.naddr": "La coordenada de un evento direccionable.",
      "tag.ios": "Plantilla de enlace profundo para iOS.",
      "tag.android": "Plantilla de enlace profundo para Android.",
      "tag.latest": "El manifiesto nsite actual de la app web.",
      "tag.manifest.address": "Dirección del evento de manifiesto del sitio: kind:pubkey:d-tag.",
      "tag.manifest.relay": "Relay donde se encuentra el manifiesto.",
      "tag.next": "El manifiesto nsite previsto para la próxima versión.",
      "example.longform-reader.label": "Un lector de artículos",
      "example.longform-reader.explain":
        "La app de Frank maneja el kind 30023, con enlaces web por entidad y un enlace profundo para iOS.",
      "event.recommendation.label": "Recomendación (kind 31989)",
      "event.recommendation.explain": "Un usuario recomienda apps para un kind de evento.",
      "content.recommendation": "Vacío.",
      "tag.d.recommendation": "El kind para el que es esta recomendación.",
      "tag.d.kind": "El número de kind, como texto.",
      "tag.a": "Un manejador recomendado. Repítela para varias apps o plataformas.",
      "tag.a.handler": "Dirección del evento kind 31990 de la app.",
      "tag.a.relay": "Relay donde se encuentra el evento de manejador.",
      "tag.a.platform": "Dónde aplica esta recomendación: web, ios, android…",
      "example.recommend-reader.label": "Recomendar un lector",
      "example.recommend-reader.explain":
        "Alice recomienda el lector de Frank para artículos en web e iOS.",
      "event.client-tag.label": "Nota con etiqueta client",
      "event.client-tag.explain": "Cualquier evento puede decir qué app lo publicó.",
      "content.note": "El texto de la nota.",
      "tag.client": "La app que publicó este evento.",
      "tag.client.name": "El nombre de la app.",
      "tag.client.handler": "Dirección del evento de manejador kind 31990 de la app.",
      "tag.client.relay": "Relay donde se encuentra el evento de manejador.",
      "example.note-with-client.label": "Una nota publicada desde una app",
      "example.note-with-client.explain":
        "La nota de Frank da crédito a la app desde la que la publicó.",
    },
  },
  n90: {
    title: "Máquinas expendedoras de datos (DVM)",
    summary:
      "Un mercado de computación de pago sobre nostr: publicas un trabajo (traducir, resumir…), los servicios compiten por hacerlo y publican el resultado. Ya no se recomienda: se prefieren especificaciones más pequeñas para casos de uso concretos.",
    text: {
      "how.status.title": "No recomendado",
      "how.status.body":
        "Los autores del NIP lo marcaron como no recomendado: se volvió demasiado amplio. Los proyectos nuevos deberían preferir especificaciones pequeñas para un solo caso de uso. Aun así vale la pena conocerlo, porque existen muchas DVM.",
      "how.request.title": "Publica un trabajo",
      "how.request.body":
        "Un cliente publica una solicitud de trabajo en los kinds 5000–5999. Las etiquetas i llevan las entradas (texto, una URL, un evento o la salida de otro trabajo); param, output y bid dan forma al trabajo.",
      "how.feedback.title": "Los servicios responden",
      "how.feedback.body":
        "Cualquier proveedor de servicios puede responder con un feedback kind 7000: processing, payment-required, error, partial o success.",
      "how.result.title": "Llegan los resultados",
      "how.result.body":
        "El kind del resultado es siempre el kind de la solicitud más 1000 (5002 → 6002). Cita la solicitud, etiqueta al cliente y lleva la salida en content.",
      "how.pay.title": "Paga",
      "how.pay.body":
        "Una etiqueta amount (en millisats, opcionalmente con una factura bolt11) pide el pago. El cliente paga la factura o hace zap al resultado.",
      "related.89":
        "Los servicios anuncian los kinds de trabajo que manejan con el kind 31990 de NIP-89.",
      "related.57": "Los clientes pueden pagar un resultado haciéndole zap.",
      "related.04": "Los trabajos privados cifran sus entradas con NIP-04.",
      "related.09": "Un trabajo se puede cancelar con una solicitud de borrado kind 5.",
      "flow.job.label": "Solicitud, feedback, resultado",
      "flow.job.explain": "El recorrido completo de un trabajo de traducción.",
      "flow.job.request": "Alice pide una traducción al español y ofrece hasta 5 sats.",
      "flow.job.feedback": "El servicio de Dave pide 3 sats antes de continuar.",
      "flow.job.result": "El servicio de Dave publica la traducción como kind 6002.",
      "event.job-request.label": "Solicitud de trabajo (kinds 5000–5999)",
      "event.job-request.explain":
        "Un cliente pide algún cálculo. El kind indica el tipo de trabajo.",
      "content.request":
        "Vacío, o las etiquetas i/param cifradas con NIP-04 cuando el trabajo es privado.",
      "tag.i": "Una entrada para el trabajo. Repítela para varias entradas.",
      "tag.i.data": "La entrada en sí: texto, una URL o un id de evento/trabajo.",
      "tag.i.input-type": "Cómo interpretar el dato.",
      "input-type.url": "Obtén el dato de esta URL.",
      "input-type.event": "El dato es un evento de nostr con este id.",
      "input-type.job":
        "Usa la salida de un trabajo anterior con este id (encadenamiento de trabajos).",
      "input-type.text": "El dato es el propio valor.",
      "tag.i.relay": "Dónde encontrar el evento o el trabajo, para esos tipos de entrada.",
      "tag.i.marker": "Pista opcional sobre cómo se usa esta entrada en el trabajo.",
      "tag.output": "El formato que el cliente quiere recibir.",
      "tag.output.mime": 'Un tipo MIME, p. ej. "text/plain".',
      "tag.param": "Un ajuste propio del trabajo, como clave y valor.",
      "tag.param.key": 'Nombre del ajuste, p. ej. "language".',
      "tag.param.value": 'Valor del ajuste, p. ej. "es".',
      "tag.bid": "Lo máximo que pagará el cliente.",
      "tag.bid.msats": "Importe en millisats.",
      "tag.relays": "Relays donde los proveedores deben publicar el feedback y los resultados.",
      "tag.relays.relay": "Una URL de relay. Lista tantas como necesites en la misma etiqueta.",
      "tag.p.provider":
        "Un proveedor de servicios al que el cliente prefiere para el trabajo. Otros pueden intentarlo igualmente.",
      "tag.p.provider.pubkey": "La pubkey del proveedor.",
      "tag.t": "Un tema para el trabajo.",
      "tag.t.topic": "Palabra del tema.",
      "tag.encrypted": "Indica que las entradas o salidas van cifradas en content.",
      "example.translate.label": "Traducir una frase",
      "example.translate.explain":
        "Alice pide una traducción al español (kind 5002) y ofrece 5 sats.",
      "example.summarize-note.label": "Resumir una nota",
      "example.summarize-note.explain":
        "Grace pide al servicio de Dave que resuma un hilo por id de evento (kind 5001).",
      "event.job-feedback.label": "Feedback del trabajo (kind 7000)",
      "event.job-feedback.explain": "Un proveedor le cuenta al cliente cómo va el trabajo.",
      "content.feedback": "Vacío, o una muestra parcial del resultado.",
      "tag.status": "En qué fase está el trabajo.",
      "tag.status.value": "Uno de los estados siguientes.",
      "status.payment-required": "Paga antes de que el proveedor continúe.",
      "status.processing": "En proceso.",
      "status.error": "El trabajo falló.",
      "status.success": "Terminado.",
      "status.partial": "Hecho en parte; content puede tener una muestra.",
      "tag.status.info": "Información adicional legible por humanos.",
      "tag.amount": "El pago que pide el proveedor.",
      "tag.amount.msats": "Importe en millisats.",
      "tag.amount.bolt11": "Factura Lightning opcional por ese importe.",
      "tag.e": "La solicitud de trabajo a la que se refiere.",
      "tag.e.id": "Id del evento de solicitud de trabajo.",
      "tag.e.relay": "Relay donde se vio la solicitud.",
      "tag.p.customer": "El cliente que pidió el trabajo.",
      "tag.p.customer.pubkey": "La pubkey del cliente.",
      "example.payment-required.label": "Pago requerido",
      "example.payment-required.explain":
        "El servicio de Dave le pide a Alice 3 sats antes de traducir.",
      "event.job-result.label": "Resultado del trabajo (kinds 6000–6999)",
      "event.job-result.explain": "La salida de un trabajo, del proveedor que lo hizo.",
      "content.result": "La salida del trabajo, o la salida cifrada en los trabajos privados.",
      "tag.request": "La solicitud de trabajo original, como texto JSON.",
      "tag.request.event": "El evento de solicitud firmado completo, convertido en cadena.",
      "example.translation.label": "La traducción",
      "example.translation.explain":
        "El servicio de Dave devuelve el texto en español y pide 3 sats.",
    },
  },
  n92: {
    title: "Metadatos de archivos adjuntos (imeta)",
    summary:
      "Cuando una nota enlaza una imagen o un video, una etiqueta imeta describe ese archivo (tipo, tamaño, dimensiones, hash, texto alternativo) para que los clientes muestren una buena vista previa antes de descargarlo.",
    text: {
      "how.link.title": "Pon la URL en el texto",
      "how.link.body":
        "La URL del archivo se queda en content, así cualquier cliente puede seguir mostrando un enlace simple.",
      "how.describe.title": "Descríbelo en una etiqueta imeta",
      "how.describe.body":
        "Añade una etiqueta imeta por URL. Debe tener la url y al menos un campo más.",
      "how.pairs.title": "Entradas clave-valor",
      "how.pairs.body":
        'Cada entrada es una cadena "clave valor", separada en el primer espacio. Las claves vienen de NIP-94: m, dim, x, blurhash, alt, fallback…',
      "how.render.title": "Vistas previas enriquecidas",
      "how.render.body":
        "Los clientes pueden reservar espacio con dim, mostrar un blurhash mientras carga, verificar el archivo con x y probar URLs de respaldo. Un imeta que no coincide con ninguna URL de content puede ignorarse.",
      "related.94": "imeta puede usar cualquier campo que NIP-94 define para archivos.",
      "related.B7":
        "Los servidores Blossom devuelven los metadatos que los clientes convierten en etiquetas imeta.",
      "related.68": "Las publicaciones de imágenes (NIP-68) describen cada imagen con imeta.",
      "related.71": "Los eventos de video (NIP-71) describen cada variante con imeta.",
      "event.attachment.label": "Nota con archivos",
      "event.attachment.explain":
        "Una nota cuyo content enlaza archivos, descritos con etiquetas imeta.",
      content: "El texto de la nota, incluida cada URL de archivo.",
      "tag.imeta": "Metadatos de una URL que aparece en content.",
      "tag.imeta.url": 'La primera entrada: "url " seguido de la URL del archivo usada en content.',
      "tag.imeta.entry": 'Más entradas "clave valor", p. ej. "m image/jpeg" o "dim 3024x4032".',
      "example.photo.label": "Una foto con metadatos completos",
      "example.photo.explain":
        "Erin publica un dibujo con tipo, blurhash, tamaño, texto alternativo, hash y un respaldo.",
      "example.two-files.label": "Dos adjuntos",
      "example.two-files.explain":
        "Carol enlaza una imagen y un video; cada uno tiene su propia etiqueta imeta.",
    },
  },
  n94: {
    title: "Metadatos de archivos",
    summary:
      "El kind 1063 describe un archivo compartido (dónde descargarlo, su tipo, hash, tamaño y vistas previas) para que las apps de intercambio de archivos puedan indexarlos y filtrarlos en los relays.",
    text: {
      "how.upload.title": "Súbelo a algún sitio",
      "how.upload.body":
        "El archivo en sí vive en un servidor (NIP-96, Blossom) o en un torrent. Nostr solo lleva la descripción.",
      "how.locate.title": "Di dónde y qué",
      "how.locate.body":
        "url dice dónde descargarlo y m da su tipo MIME, para que los clientes sepan cómo mostrarlo.",
      "how.verify.title": "Hazlo verificable",
      "how.verify.body":
        "x es el SHA-256 del archivo tal como se sirve. ox es el hash de la subida original, si el servidor la modificó (redimensionada, sin metadatos).",
      "how.preview.title": "Facilita las vistas previas",
      "how.preview.body":
        "dim, blurhash, thumb, image y alt permiten a los clientes mostrar un marcador de posición y una descripción antes de descargar.",
      "how.filter.title": "Indexa y filtra",
      "how.filter.body":
        'Los relays pueden indexar estas etiquetas, así las apps pueden pedir, por ejemplo, todos los archivos "image/png". Los clientes sociales normalmente ignoran el kind 1063.',
      "related.92": "Las etiquetas imeta reutilizan estos campos dentro de otros eventos.",
      "related.96":
        "Los servidores NIP-96 devuelven una descripción con la forma del kind 1063 tras la subida.",
      "related.B7": "Los servidores Blossom identifican los archivos por el mismo hash SHA-256.",
      "related.35": "Los torrents (NIP-35) son otra forma de compartir archivos por nostr.",
      "event.file.label": "Metadatos de archivo (kind 1063)",
      "event.file.explain": "La descripción de un archivo compartido.",
      content: "Un pie o una descripción del archivo.",
      "tag.url": "Dónde descargar el archivo.",
      "tag.url.value": "La URL de descarga.",
      "tag.m": "El tipo MIME del archivo, en minúsculas.",
      "tag.m.value": 'Por ejemplo "image/png" o "application/pdf".',
      "tag.x": "SHA-256 del archivo.",
      "tag.x.value": "64 caracteres hexadecimales.",
      "tag.ox": "SHA-256 del archivo original, antes de que el servidor lo modificara.",
      "tag.ox.value": "64 caracteres hexadecimales.",
      "tag.size": "Tamaño del archivo.",
      "tag.size.value": "Tamaño en bytes.",
      "tag.dim": "Tamaño de la imagen o del video.",
      "tag.dim.value": 'Ancho x alto en píxeles, p. ej. "800x600".',
      "tag.magnet": "Un enlace magnet del archivo.",
      "tag.magnet.value": "URI magnet:.",
      "tag.i": "Infohash del torrent.",
      "tag.i.value": "40 caracteres hexadecimales (20 bytes).",
      "tag.blurhash": "Un pequeño marcador de posición difuminado para mostrar mientras carga.",
      "tag.blurhash.value": "La cadena blurhash.",
      "tag.thumb": "Una miniatura con la misma relación de aspecto.",
      "tag.thumb.value": "URL de la miniatura.",
      "tag.preview.hash": "SHA-256 opcional del archivo de vista previa.",
      "tag.image": "Una imagen de vista previa con las mismas dimensiones.",
      "tag.image.value": "URL de la imagen de vista previa.",
      "tag.summary": "Un breve extracto de texto.",
      "tag.summary.value": "El extracto.",
      "tag.alt": "Descripción para quienes no pueden ver el archivo.",
      "tag.alt.value": "Texto de descripción accesible.",
      "tag.fallback": "Otro sitio de donde obtener el archivo si url falla. Puede repetirse.",
      "tag.fallback.value": "URL de respaldo.",
      "tag.service": "Qué tipo de servicio aloja el archivo.",
      "tag.service.value": 'Por ejemplo "nip96".',
      "example.image.label": "Una foto subida",
      "example.image.explain":
        "Carol comparte una foto que el servidor convirtió, por eso x y ox son distintos.",
      "example.torrent.label": "Un archivo también en BitTorrent",
      "example.torrent.explain":
        "Dave comparte un archivo de un relay con un enlace magnet y su infohash.",
    },
  },
  n96: {
    title: "Integración de almacenamiento de archivos HTTP",
    summary:
      "Una API REST para subir archivos a servidores de almacenamiento con autenticación de nostr y luego enlazarlos en notas. Ya no se recomienda: usa Blossom (NIP-B7) en las apps nuevas.",
    text: {
      "how.status.title": "No recomendado: usa Blossom",
      "how.status.body":
        "Este NIP está obsoleto en favor de NIP-B7 (Blossom). Clientes y servidores antiguos todavía lo usan, por eso se explica aquí.",
      "how.discover.title": "Encuentra la API",
      "how.discover.body":
        "Un servidor publica /.well-known/nostr/nip96.json. api_url es adonde van las subidas y los borrados; plans describe los límites.",
      "how.authorize.title": "Firma un evento NIP-98",
      "how.authorize.body":
        "Las subidas, los borrados y los listados necesitan una cabecera Authorization: un evento kind 27235 que indica la URL y el método, opcionalmente con el hash del archivo en payload.",
      "how.upload.title": "Sube",
      "how.upload.body":
        "Envía el archivo por POST como multipart form data con caption y alt. El servidor responde con una descripción al estilo NIP-94: url, ox (hash original) y más.",
      "how.by-hash.title": "Todo por hash",
      "how.by-hash.body":
        "Los archivos están en <api_url>/<sha256 del original>. Cualquier servidor NIP-96 que tenga el mismo archivo lo sirve en la misma ruta, y ?w= pide una imagen redimensionada.",
      "how.choose.title": "Elige tus servidores",
      "how.choose.body":
        "Los usuarios listan sus servidores de subida preferidos en el kind 10096 para que todos los clientes suban a los mismos sitios.",
      "related.B7": "Blossom reemplaza a este NIP en las apps nuevas.",
      "related.98": "Todas las llamadas autenticadas usan NIP-98 HTTP Auth.",
      "related.94":
        "Las respuestas de subida y los listados usan el formato de metadatos de archivo de NIP-94.",
      "related.92": "Los clientes convierten la respuesta de subida en una etiqueta imeta.",
      "flow.upload.label": "De la lista de servidores a la descarga",
      "flow.upload.explain":
        "Elige un servidor, lee su información, autoriza, sube y luego descarga por hash.",
      "flow.upload.list": "La lista de servidores de Alice dice que suba a files.beta.example.",
      "flow.upload.info": "Su nip96.json da el api_url y los límites.",
      "flow.upload.auth": "Alice firma un evento de autenticación para la URL de subida.",
      "flow.upload.upload": "El cliente envía el archivo por POST con esa cabecera.",
      "flow.upload.download": "Cualquiera puede obtener el archivo por su hash original.",
      "event.auth.label": "Autorización de subida (kind 27235)",
      "event.auth.explain": "Un evento NIP-98 que autoriza una petición al servidor de archivos.",
      "event.auth.content": "Vacío.",
      "event.auth.u": "La URL exacta a la que se llama.",
      "event.auth.u.url": "Debe ser igual a la URL de la petición, incluida la query.",
      "event.auth.method": "El método HTTP de la petición.",
      "event.auth.method.value": "POST para subir, GET para listar, DELETE para borrar.",
      "event.auth.payload": "SHA-256 del archivo que se sube (opcional).",
      "event.auth.payload.hash": "Hash del archivo, no de todo el cuerpo del formulario.",
      "example.auth-upload.label": "Autenticación para una subida",
      "example.auth-upload.explain": "Alice autoriza la subida de un archivo concreto.",
      "event.server-list.label": "Servidores preferidos (kind 10096)",
      "event.server-list.explain": "A qué servidores de archivos quiere subir el usuario.",
      "event.server-list.content": "Vacío.",
      "event.server-list.server": "Un servidor preferido.",
      "event.server-list.server.url": "URL base del servidor.",
      "example.two-servers.label": "Dos servidores",
      "example.two-servers.explain":
        "Alice prefiere el servidor de archivos de Beta, con el de Alpha como segunda opción.",
      "document.server-info.label": "Información del servidor (nip96.json)",
      "document.server-info.explain": "Qué ofrece el servidor y dónde está su API.",
      info: "El documento de información NIP-96 del servidor.",
      "info.api-url":
        "Adonde van las subidas y los borrados (y las descargas, si no hay download_url). Vacío cuando está delegado.",
      "info.download-url": "URL base opcional y separada para descargas, como una CDN.",
      "info.delegated-to-url":
        "Solo para relays: otro servidor cuyo nip96.json se usa en su lugar.",
      "info.supported-nips": "NIPs que admite el servidor.",
      "info.tos-url": "Página de términos del servicio.",
      "info.content-types": "Tipos MIME que acepta; se permiten comodines como audio/*.",
      "info.plans": 'Planes de almacenamiento por clave. "free" es la única clave estándar.',
      plan: "Un plan de almacenamiento.",
      "plan.name": "Nombre visible.",
      "plan.is-nip98-required":
        "Si las subidas necesitan autenticación NIP-98 en este plan (por defecto true).",
      "plan.url": "La página de presentación del plan.",
      "plan.max-byte-size": "Archivo más grande permitido, en bytes.",
      "plan.file-expiration":
        "Cuánto tiempo se guardan los archivos: [mín, máx] días, 0 = para siempre.",
      "plan.media-transformations":
        "Cambios que el servidor puede aplicar, por tipo de medio (p. ej. redimensionar imágenes).",
      "example.server.label": "Un servidor de archivos",
      "example.server.explain":
        "El servidor de Beta con una CDN para descargas y un plan gratuito de 10 MB.",
      "example.delegated.label": "Un relay que delega",
      "example.delegated.explain":
        "Un relay que remite a los clientes al nip96.json de otro servidor.",
      "http.upload.label": "Subir un archivo",
      "http.upload.explain": "POST a api_url como multipart/form-data.",
      "header.authorization": 'La cadena "Nostr " más el base64 del evento kind 27235 firmado.',
      form: "Los campos del formulario que se envían con el archivo.",
      "form.file": "El archivo en sí. Obligatorio.",
      "form.caption": "Una descripción libre. Recomendado.",
      "form.expiration":
        "Tiempo Unix a partir del cual el archivo puede borrarse; vacío para conservarlo.",
      "form.size": "Tamaño en bytes, para que el servidor pueda rechazarlo antes.",
      "form.alt": "Descripción accesible. Recomendado.",
      "form.media-type": "avatar o banner, para un tratamiento especial.",
      "form.content-type": "Tipo MIME, para que el servidor pueda rechazarlo antes.",
      "form.no-transform": 'Pon "true" para pedir al servidor que guarde el archivo tal cual.',
      "upload.201": "Subido; es un archivo nuevo.",
      "upload.body": "El resultado de la subida.",
      "schema.status": "Resultado general.",
      "schema.status.success": "Funcionó.",
      "schema.status.error": "Falló; message dice por qué.",
      "schema.status.processing": "Todavía en proceso.",
      "schema.message": "Mensaje legible por humanos.",
      "upload.processing-url": "Dónde consultar el estado mientras el servidor procesa el archivo.",
      "schema.nip94": "Una descripción de archivo NIP-94 sin id, pubkey ni sig.",
      "schema.tags": "Etiquetas NIP-94: url y ox siempre están presentes.",
      "schema.tag": "Una etiqueta: nombre, valor y quizá más valores.",
      "schema.caption": "El pie.",
      "schema.created-at": "Hora de subida (en los listados).",
      "upload.200": "Este archivo (mismo hash) ya estaba guardado.",
      "upload.202": "Aceptado, se procesará más tarde; consulta processing_url.",
      "upload.400": "Datos de formulario no válidos o no admitidos.",
      "upload.402": "Pago requerido (el flujo no está especificado).",
      "upload.403": "No permitido, o el hash del archivo no coincide con la etiqueta payload.",
      "upload.413": "Archivo demasiado grande.",
      "example.upload-photo.label": "Subir una foto",
      "example.upload-photo.explain": "Alice sube un PNG con un pie y un texto alternativo.",
      "http.download.label": "Descargar un archivo",
      "http.download.explain": "GET por el hash del archivo original; no hace falta autenticación.",
      "download.200": "El archivo.",
      "download.404": "Aquí no hay ningún archivo con ese hash.",
      "example.download-photo.label": "Descargar por hash",
      "example.download-photo.explain":
        "La extensión es opcional; ayuda al servidor a elegir un Content-Type.",
      "example.download-thumb.label": "Descargar una versión pequeña",
      "example.download-thumb.explain":
        "?w=32 pide una imagen de unos 32 píxeles de ancho, si se admite.",
      "http.delete.label": "Borrar un archivo",
      "http.delete.explain":
        "DELETE por hash. Solo quien lo subió puede borrarlo; en las subidas compartidas solo se quita a este propietario.",
      "delete.200": "Borrado.",
      "delete.body": "Confirmación.",
      "delete.403": "No eres propietario de este archivo.",
      "example.delete-photo.label": "Borrar mi foto",
      "example.delete-photo.explain": "Alice elimina el PNG que subió.",
      "http.list.label": "Listar mis archivos",
      "http.list.explain": "GET a api_url con page y count para ver tus subidas.",
      "list.200": "Una página de tus archivos.",
      "list.body": "Información de paginación y archivos.",
      "list.count": "Tamaño de página que usa el servidor.",
      "list.total": "Número total de tus archivos.",
      "list.page": "El número de esta página.",
      "list.files": "Tus archivos como descripciones NIP-94.",
      "list.401": "Authorization ausente o no válida.",
      "example.list-first-page.label": "Primera página",
      "example.list-first-page.explain": "Alice pide sus diez primeras subidas.",
    },
  },
  n98: {
    title: "HTTP Auth",
    summary:
      "Inicia sesión en una API HTTP con tu clave de nostr: firma un evento kind 27235 de corta duración que indique la URL y el método exactos, y envíalo en la cabecera Authorization.",
    text: {
      "how.build.title": "Describe la petición",
      "how.build.body":
        "Crea un evento kind 27235 con una etiqueta u (la URL completa, query incluida) y una etiqueta method (GET, POST…). content queda vacío.",
      "how.payload.title": "Vincula el cuerpo",
      "how.payload.body":
        "En las peticiones con cuerpo, añade una etiqueta payload con el SHA-256 del cuerpo para que la firma cubra lo que envías.",
      "how.header.title": "Envíalo como cabecera",
      "how.header.body":
        'Firma el evento, codifícalo en JSON, pásalo a base64 y envía "Authorization: Nostr <base64>".',
      "how.check.title": "El servidor comprueba",
      "how.check.body":
        "El servidor verifica la firma, el kind 27235, un created_at reciente (unos 60 segundos), que u sea igual a la URL de la petición y que method sea igual al método de la petición.",
      "how.reject.title": "O rechaza",
      "how.reject.body":
        "Si alguna comprobación falla, el servidor responde 401 Unauthorized. La pubkey del evento es quien eres.",
      "related.01":
        "El evento de autenticación es un evento firmado normal que nunca se publica en los relays.",
      "related.42": "NIP-42 es el equivalente por WebSocket para los relays.",
      "related.86": "Las llamadas de gestión de relays se autorizan con esto.",
      "related.96": "Los servidores de archivos NIP-96 lo usan para las subidas.",
      "related.B7": "Blossom usa en cambio sus propios eventos de autenticación kind 24242.",
      "flow.authorize.label": "Firma y luego envía",
      "flow.authorize.explain": "Un evento autoriza una petición.",
      "flow.authorize.sign": "Alice firma un evento que indica la URL y el método.",
      "flow.authorize.send":
        "El cliente lo envía codificado en base64 en la cabecera Authorization.",
      "event.auth.label": "Evento de autenticación HTTP (kind 27235)",
      "event.auth.explain":
        "Un evento de un solo uso, sin publicar, que demuestra quién envió una petición HTTP.",
      content: "Debería estar vacío.",
      "tag.u": "La URL completa de la petición.",
      "tag.u.url": "URL absoluta, exactamente como se pidió, incluida la query string.",
      "tag.method": "El método HTTP.",
      "tag.method.value": "GET, POST, PUT, PATCH, DELETE…",
      "tag.payload": "SHA-256 del cuerpo de la petición. Recomendado para POST, PUT y PATCH.",
      "tag.payload.hash": "SHA-256 hexadecimal de los bytes exactos del cuerpo.",
      "example.auth-get.label": "Autenticación para un GET",
      "example.auth-get.explain": "Alice autoriza la lectura de sus notas desde una API.",
      "example.auth-post.label": "Autenticación para un POST",
      "example.auth-post.explain":
        "Alice autoriza una actualización de su perfil; payload es el hash del cuerpo JSON.",
      "http.request.label": "Petición autorizada",
      "http.request.explain":
        "Cualquier petición HTTP que lleve una cabecera Authorization de NIP-98.",
      "header.authorization": 'La cadena "Nostr " más el evento firmado codificado en base64.',
      body: "El cuerpo de la petición, aquí JSON (sirve cualquier cuerpo). Su SHA-256 va en la etiqueta payload del evento de autenticación.",
      "response.200": "Autorizado; el servidor procesa la petición.",
      "response.401": "Evento de autenticación ausente, caducado o que no coincide.",
      "example.get.label": "GET con autenticación",
      "example.get.explain": "La cabecera lleva el evento firmado para esta URL exacta.",
      "example.post.label": "POST con autenticación",
      "example.post.explain": "El hash del cuerpo coincide con la etiqueta payload del evento.",
    },
  },
  n99: {
    title: "Anuncios clasificados",
    summary:
      "El kind 30402 es un anuncio clasificado: algo en venta, en alquiler o gratis, escrito en Markdown con título, precio, ubicación e imágenes, y editable porque es direccionable.",
    text: {
      "how.address.title": "Un anuncio, una dirección",
      "how.address.body":
        "Los anuncios son direccionables: la etiqueta d identifica el anuncio, así que al editarlo (nuevo precio, vendido) se reemplaza la versión anterior.",
      "how.describe.title": "Descríbelo en Markdown",
      "how.describe.body":
        "content es la descripción completa en Markdown, como un artículo de formato largo.",
      "how.price.title": "Pon un precio",
      "how.price.body":
        'price tiene un importe, un código de moneda (EUR, USD, BTC, SATS…) y una frecuencia opcional, p. ej. ["price", "15", "EUR", "month"].',
      "how.find.title": "Haz que se encuentre",
      "how.find.body":
        "Las etiquetas t son categorías, location y g (geohash) dicen dónde, y las etiquetas image forman una galería. Los clientes filtran por ellas.",
      "how.lifecycle.title": "Borradores y artículos vendidos",
      "how.lifecycle.body":
        'El kind 30403 tiene la misma forma y guarda borradores o anuncios inactivos. Una etiqueta status con "sold" marca el trato como cerrado.',
      "related.01": "Los anuncios son eventos direccionables.",
      "related.23": "La misma estructura que los artículos de formato largo.",
      "related.15": "NIP-15 es una especificación de mercado más estricta y estructurada.",
      "related.58": "Las etiquetas image siguen el formato de imagen de las insignias de NIP-58.",
      "related.52": "Las etiquetas g de geohash funcionan como las de los eventos de calendario.",
      "event.listing.label": "Anuncio clasificado (kind 30402 / 30403)",
      "event.listing.explain":
        "Un anuncio de un producto, servicio, alquiler o cualquier otra cosa. 30403 es un borrador.",
      content: "Descripción en Markdown.",
      "tag.d": "Identificador de este anuncio entre los anuncios del autor.",
      "tag.d.value": "Cualquier cadena única, p. ej. un slug.",
      "tag.title": "El título del anuncio.",
      "tag.title.value": "Título corto.",
      "tag.summary": "Un eslogan de una línea.",
      "tag.summary.value": "Texto del eslogan.",
      "tag.published_at": "Cuándo se publicó el anuncio por primera vez.",
      "tag.published_at.value": "Tiempo Unix en segundos, como cadena.",
      "tag.location": "Dónde está el artículo o el servicio.",
      "tag.location.value": "Texto libre, p. ej. una ciudad.",
      "tag.price": "Lo que cuesta.",
      "tag.price.amount": "El importe, como número dentro de una cadena.",
      "tag.price.currency": "Código ISO 4217 o similar: EUR, USD, BTC, SATS…",
      "tag.price.frequency": "Para precios recurrentes: hour, day, week, month, year.",
      "tag.status": "Si el anuncio sigue disponible.",
      "tag.status.value": "active o sold.",
      "status.active": "Todavía disponible.",
      "status.sold": "Ya no está disponible.",
      "tag.t": "Una categoría o palabra clave. Repítela para varias.",
      "tag.t.value": "La palabra clave.",
      "tag.image": "Una imagen del artículo. Repítela para formar una galería.",
      "tag.image.url": "URL de la imagen.",
      "tag.image.dim": 'Tamaño opcional en píxeles, p. ej. "800x600".',
      "tag.g": "Geohash para una ubicación más precisa.",
      "tag.g.value": "Cadena geohash; más caracteres = más precisión.",
      "tag.e": "Un evento relacionado.",
      "tag.e.id": "El id del evento.",
      "tag.relay": "Pista de relay.",
      "tag.a": "Un evento direccionable relacionado.",
      "tag.a.address": "kind:pubkey:d-tag.",
      "example.camera.label": "Vender una cámara",
      "example.camera.explain":
        "Carol anuncia una cámara restaurada por 180 EUR con fotos y un geohash.",
      "example.room.label": "Alquilar una habitación",
      "example.room.explain": "Frank alquila un estudio por meses y enlaza su ensayo.",
      "example.draft.label": "Un anuncio en borrador",
      "example.draft.explain":
        "Dave guarda un anuncio sin terminar como kind 30403, con precio en sats.",
    },
  },
};
