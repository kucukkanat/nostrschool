// Owner: translation agents. Must structurally match ../../en/nips/r3.ts (enforced by the type).
import type { r3 as en } from "../../en/nips/r3.ts";

export const r3: typeof en = {
  n40: {
    title: "Marca de tiempo de expiración",
    summary:
      "Añade un tag expiration para que un evento pueda indicar cuándo deja de ser relevante. Los relays compatibles dejan de servirlo a partir de ese momento y los clientes lo ocultan, algo ideal para avisos temporales y ofertas por tiempo limitado.",
    text: {
      "event.label": "Evento con expiración",
      "event.explain":
        "Cualquier kind de evento puede llevar un tag expiration. Nada más cambia en el evento: el mismo content, las mismas reglas de firma.",
      content:
        "Lo que el kind del evento contenga normalmente. NIP-40 solo añade el tag; el content no se ve afectado.",
      "tag.expiration":
        "Marca el momento a partir del cual relays y clientes deben tratar el evento como expirado. Solo uno por evento.",
      "tag.expiration.timestamp":
        "Tiempo Unix en segundos, escrito como string, en el mismo formato que created_at. Pasado este momento, los relays deberían dejar de servir el evento.",
      "example.announcement": "Aviso de mantenimiento que expira mañana",
      "example.announcement.explain":
        "Dave anuncia una parada de su relay. Una vez pasada la ventana, el aviso ya no sirve, así que expira un día después de publicarse.",
      "example.offer": "Oferta de una semana",
      "example.offer.explain":
        "Carol vende rollos de película durante una semana. Otros tags (aquí un hashtag) van junto a expiration como siempre.",
      "how.add-tag.title": "Añade el tag expiration",
      "how.add-tag.body":
        'El autor elige una marca de tiempo Unix futura y añade ["expiration", "<timestamp>"] antes de firmar. El tag queda cubierto por la firma, así que nadie puede cambiar la fecha después.',
      "how.check-relay.title": "Envíalo solo a relays que lo entiendan",
      "how.check-relay.body":
        "Los clientes deberían leer el documento NIP-11 de un relay y enviar eventos con expiración solo a relays que incluyan 40 en supported_nips. Otros relays guardarían el evento para siempre.",
      "how.relay-behaviour.title": "Los relays dejan de servirlo",
      "how.relay-behaviour.body":
        "Pasada la marca de tiempo, un relay compatible no debería devolver el evento en los resultados de consultas y debería rechazarlo si alguien lo vuelve a publicar. Puede borrarlo enseguida o más tarde; el borrado no está garantizado.",
      "how.client-behaviour.title": "Los clientes ignoran los eventos expirados",
      "how.client-behaviour.body":
        "Un cliente que recibe un evento cuya expiración ya pasó (por ejemplo, de un relay que no soporta NIP-40) debería ocultarlo.",
      "how.not-private.title": "La expiración no es una función de privacidad",
      "how.not-private.body":
        "El evento es público hasta que expira, y cualquiera puede haber guardado una copia. Nunca confíes en la expiración para hacer desaparecer un mensaje para siempre.",
      "related.01": "Añade un tag opcional al formato básico de evento.",
      "related.11":
        "Los clientes revisan supported_nips en el documento de información del relay antes de usar eventos con expiración.",
      "related.09":
        "Las solicitudes de borrado eliminan un evento bajo demanda; la expiración programa su eliminación por adelantado.",
    },
  },
  n42: {
    title: "Autenticación de clientes ante relays",
    summary:
      'Permite que un relay pregunte "¿quién eres?" antes de servir o aceptar eventos. El relay envía un desafío, el cliente firma un evento kind 22242 de corta vida que lo repite, y así el relay sabe qué pubkey está al otro lado de la conexión.',
    text: {
      "msg.challenge.label": "Desafío AUTH (relay → cliente)",
      "msg.challenge.explain":
        "El relay ofrece un string de desafío. Sigue siendo válido durante toda la conexión, o hasta que el relay envíe uno nuevo.",
      "msg.challenge.challenge":
        "Un string aleatorio elegido por el relay. El cliente lo copia en el tag challenge de su evento de autenticación, lo que demuestra que la firma se hizo para esta conexión.",
      "msg.auth.label": "Evento AUTH (cliente → relay)",
      "msg.auth.explain":
        "El cliente responde con un evento kind 22242 firmado. Puede enviar varios, uno por cada pubkey que quiera autenticar.",
      "msg.auth.event":
        "El evento de autenticación firmado. Los relays nunca lo difunden ni lo guardan como un evento normal.",
      "msg.ok.label": "OK (relay → cliente)",
      "msg.ok.explain":
        "El relay responde a cada evento AUTH con OK, igual que hace con EVENT. NIP-42 añade dos prefijos legibles por máquinas al mensaje.",
      "msg.ok.event-id":
        "Id del evento que se confirma (el evento de autenticación, o una nota que el cliente intentó publicar).",
      "msg.ok.accepted":
        "true cuando el relay aceptó el evento o la autenticación, false cuando la rechazó.",
      "msg.ok.message":
        'Motivo legible por personas. "auth-required: " significa que primero debes autenticarte; "restricted: " significa que sí te autenticaste, pero esta pubkey sigue sin tener permiso.',
      "msg.closed.label": "CLOSED (relay → cliente)",
      "msg.closed.explain":
        "Cuando una suscripción necesita autenticación, el relay la termina con CLOSED y un prefijo auth-required o restricted.",
      "msg.closed.subscription-id": "El id del REQ que fue rechazado.",
      "msg.closed.message":
        'Empieza por "auth-required: " (aún sin autenticar) o "restricted: " (autenticado, pero sin permiso).',
      "example.challenge": "El relay envía un desafío",
      "example.auth-message": "La respuesta firmada de Alice",
      "example.auth-message.explain":
        "El evento kind 22242 envuelto en un mensaje AUTH. Sus tags relay y challenge coinciden con lo que envió el relay.",
      "example.ok-accepted": "El relay acepta la autenticación",
      "example.ok-auth-required": "Escritura rechazada hasta que el cliente se autentique",
      "example.ok-auth-required.explain":
        "Alice intentó publicar una nota en un relay solo para miembros antes de autenticarse. Después de AUTH puede volver a enviar el mismo EVENT.",
      "example.ok-restricted": "Autenticado, pero sin permiso",
      "example.closed": "Consulta de DMs rechazada",
      "example.closed.explain":
        "Un relay que solo sirve mensajes directos a sus participantes cierra el REQ hasta que el cliente demuestre quién es.",
      "event.label": "Evento de autenticación (kind 22242)",
      "event.explain":
        "Un evento efímero que nunca se publica ni se consulta. Solo existe para firmarse y enviarse dentro de un mensaje AUTH.",
      "event.content": "Vacío. Todo lo que el relay necesita está en los tags.",
      "tag.relay":
        "El relay para el que es esta autenticación. Evita que un evento firmado se reutilice en otro relay.",
      "tag.relay.url":
        "La URL del relay. Los relays pueden normalizarla; normalmente basta con comprobar el nombre de dominio.",
      "tag.challenge": "El string de desafío exactamente como lo envió el relay.",
      "tag.challenge.value": "Copiado del mensaje AUTH del relay.",
      "example.event": "Alice se autentica en un relay de pago",
      "example.event.explain":
        "Fírmalo para ver el evento completo. Su created_at debe estar cerca de la hora actual (unos diez minutos como máximo) o el relay lo rechaza.",
      "flow.read.label": "Leer DMs de un relay que exige autenticación",
      "flow.read.explain": "La secuencia habitual cuando una consulta necesita autenticación.",
      "flow.read.challenge":
        "El relay envía su desafío, al conectar o justo antes de rechazar algo.",
      "flow.read.closed": "El REQ de DMs del cliente se cierra con auth-required.",
      "flow.read.sign": "El cliente firma un evento kind 22242 con la URL del relay y el desafío.",
      "flow.read.send": "Envía ese evento en un mensaje AUTH.",
      "flow.read.ok":
        "El relay responde OK true; el cliente vuelve a enviar el REQ y ahora recibe eventos.",
      "how.challenge.title": "El relay emite un desafío",
      "how.challenge.body":
        'En cualquier momento, normalmente justo después de conectar, el relay envía ["AUTH", "<challenge>"]. El cliente lo guarda para esa conexión.',
      "how.refusal.title": "Se rechaza una solicitud",
      "how.refusal.body":
        'Cuando un REQ o un EVENT necesita una identidad conocida, el relay responde CLOSED u OK false con el prefijo "auth-required: ". Esa es la señal para que el cliente se autentique.',
      "how.sign.title": "El cliente firma un evento kind 22242",
      "how.sign.body":
        "El evento lleva un tag relay y un tag challenge y se firma con la clave del usuario. Como ambos valores están dentro de la firma, el evento solo sirve para este relay y esta conexión.",
      "how.send.title": "El cliente lo envía en un mensaje AUTH",
      "how.send.body":
        '["AUTH", <evento firmado>]. Un cliente puede autenticar varias pubkeys en una misma conexión enviando varios mensajes AUTH.',
      "how.verify.title": "El relay verifica y responde OK",
      "how.verify.body":
        "El relay comprueba el kind, que created_at sea reciente, que el desafío coincida y que la URL del relay sea la suya. Luego responde OK true y trata la conexión como esa pubkey hasta que se cierre.",
      "related.01":
        "Añade un nuevo mensaje AUTH al protocolo básico cliente–relay y reutiliza OK y CLOSED.",
      "related.11":
        "Los relays pueden anunciar sus requisitos de autenticación en su documento de información.",
      "related.17": "Los relays que guardan DMs privados suelen exigir AUTH antes de servirlos.",
      "related.59":
        "Los relays pueden exigir AUTH antes de aceptar o servir gift wraps, para combatir el spam y proteger a los destinatarios.",
      "related.67":
        'La pista "auth" en EOSE le dice al cliente que hay más resultados disponibles tras autenticarse.',
    },
  },
  n43: {
    title: "Metadatos y solicitudes de acceso a relays",
    summary:
      "Da a los relays de membresía un vocabulario común: el relay publica quiénes son sus miembros y qué roles existen, los usuarios piden unirse con un código de invitación o piden salir, y el relay anuncia cada cambio como un evento firmado.",
    text: {
      "tag.protected":
        'El tag protegido ["-"] de NIP-70. Solo el autor puede publicar el evento en un relay, así que nadie puede copiar los datos de membresía a otro sitio.',
      "tag.p": "El miembro que se añade o se elimina.",
      "tag.p.pubkey": "La clave pública del miembro, en hex.",
      "tag.claim": "El código de invitación que el usuario está canjeando.",
      "tag.claim.code":
        "Un código opaco entregado por el relay (por ejemplo, mediante el método createclaim de NIP-86 o una invitación kind 28935).",
      "content.empty": "Vacío. Todo se expresa en los tags.",
      "members.label": "Lista de miembros (kind 13534)",
      "members.explain":
        "Una lista reemplazable de pubkeys con acceso al relay, firmada por la clave del campo self del documento NIP-11 del relay. Es una pista, no la última palabra: los clientes también deberían revisar el propio evento kind 10010 del miembro.",
      "tag.member": "Un miembro del relay. Repite el tag por cada miembro.",
      "tag.member.pubkey": "La clave pública del miembro, en hex.",
      "tag.member.role":
        "Ids de rol opcionales (el tag d de un rol kind 33534) asignados a este miembro.",
      "example.members": "Miembros de relay.delta.example",
      "example.members.explain":
        "La clave de Dave hace de clave self del relay. Bob es un miembro normal; Erin además tiene el rol 28b7e50f.",
      "role.label": "Definición de rol (kind 33534)",
      "role.explain":
        "Define un rol que el relay puede asignar a sus miembros. Cómo trata el relay cada rol depende de él; este evento solo lo describe.",
      "tag.d": "Identifica el rol. Los tags member hacen referencia a este valor.",
      "tag.d.value": "Un id corto y único, como un string hex aleatorio.",
      "tag.label": "Nombre visible del rol.",
      "tag.label.value": 'Por ejemplo "moderador" o "colaborador".',
      "tag.description": "Qué significa el rol.",
      "tag.description.value": "Texto libre que se muestra a los usuarios.",
      "tag.color": "Un color para la insignia del rol.",
      "tag.color.hue": "Un tono de 0 a 360.",
      "tag.order": "Posición de orden, solo para mostrar.",
      "tag.order.value": "Un entero; los números más bajos se muestran primero.",
      "example.role": "Un rol de moderador",
      "example.role.explain":
        "El id de rol 28b7e50f es el mismo que la lista de miembros asigna a Erin.",
      "add.label": "Miembro añadido (kind 8000)",
      "add.explain": "Anuncio opcional que el relay publica cuando añade a un miembro.",
      "example.add": "Grace pasa a ser miembro",
      "remove.label": "Miembro eliminado (kind 8001)",
      "remove.explain": "Anuncio opcional que el relay publica cuando elimina a un miembro.",
      "example.remove": "Se revoca el acceso de Bob",
      "join.label": "Solicitud de ingreso (kind 28934)",
      "join.explain":
        "La envía un usuario al relay para canjear un código de invitación. created_at debe estar a pocos minutos de la hora actual. El relay responde con un mensaje OK.",
      "example.join": "Grace canjea una invitación",
      "example.join.explain":
        'El relay responde OK true (quizá con "info: welcome") u OK false con un motivo "restricted: ", como un código caducado.',
      "invite.label": "Invitación (kind 28935)",
      "invite.explain":
        "Estructura inferida: el texto actual de NIP-43 solo dice que los clientes pueden pedir eventos kind 28935 a relays que incluyen NIP-43 en supported_nips, sin definir el evento. Borradores anteriores lo describían como un evento efímero generado por el relay con un código de canje nuevo, que es lo que muestra este ejemplo.",
      "example.invite": "El relay entrega un código de canje",
      "leave.label": "Solicitud de salida (kind 28936)",
      "leave.explain":
        "La envía un miembro que quiere que se le revoque el acceso. created_at debe estar a pocos minutos de la hora actual.",
      "example.leave": "Bob abandona el relay",
      "flow.join.label": "Unirse a un relay de membresía",
      "flow.join.explain": "Del código de invitación a aparecer en la lista de miembros.",
      "flow.join.invite":
        "El usuario obtiene un código de canje, por ejemplo de una invitación kind 28935.",
      "flow.join.request":
        "El cliente del usuario envía una solicitud de ingreso kind 28934 con ese código.",
      "flow.join.add": "El relay la acepta y puede anunciar al nuevo miembro con kind 8000.",
      "flow.join.list": "El relay actualiza su lista de miembros kind 13534.",
      "how.self.title": "El relay tiene su propia clave",
      "how.self.body":
        "Cada evento del lado del relay se firma con la pubkey del campo self del documento NIP-11 del relay, así los clientes pueden comprobar que realmente viene del relay.",
      "how.list.title": "El relay publica sus miembros",
      "how.list.body":
        "Una lista kind 13534 nombra a cada miembro con un tag member, seguido opcionalmente de ids de rol. Los roles en sí son eventos kind 33534.",
      "how.both.title": "La membresía tiene dos lados",
      "how.both.body":
        "La lista kind 13534 del relay es solo una pista. Para decidir si alguien es miembro, un cliente debe consultar esa lista y también el evento kind 10010 que publica el propio miembro.",
      "how.claim.title": "Un usuario pide unirse",
      "how.claim.body":
        "Con un código de invitación en la mano, el usuario envía un evento kind 28934 con un tag claim. Su marca de tiempo debe ser reciente, para que no se pueda reutilizar una solicitud antigua.",
      "how.answer.title": "El relay responde y actualiza la lista",
      "how.answer.body":
        'El relay responde OK true u OK false con "restricted: <motivo>", actualiza la lista de miembros y puede publicar un anuncio kind 8000.',
      "how.leave.title": "Salir funciona igual",
      "how.leave.body":
        "Un miembro envía kind 28936. El relay lo elimina, actualiza la lista y puede publicar kind 8001.",
      "related.11":
        "Los eventos del relay se firman con la pubkey self del documento de información del relay, y el soporte se anuncia en supported_nips.",
      "related.70": 'Todos los eventos aquí llevan el tag protegido "-".',
      "related.42": 'Los canjes fallidos reutilizan el prefijo "restricted: " de NIP-42.',
      "related.86":
        "El método createclaim de la API de gestión de relays entrega códigos de invitación.",
    },
  },
  n44: {
    title: "Payloads cifrados (versionados)",
    summary:
      "El formato de cifrado que Nostr usa hoy: dos claves acuerdan un secreto compartido, el texto se rellena para ocultar su longitud, se cifra con ChaCha20, se autentica con HMAC-SHA256 y se empaqueta en un único string base64 con un byte de versión. No define ningún kind de evento; otros NIPs ponen el resultado en el content de un evento.",
    text: {
      "encoding.label": "Payload NIP-44 v2",
      "encoding.explain":
        "Convierte un texto plano en el string base64 que va en el content de un evento. Solo el emisor y el destinatario pueden descifrarlo. En este editor, la clave secreta del emisor es la clave de demostración de un personaje.",
      "input.sender":
        "Quién cifra. Su clave secreta (aquí una clave de demostración) se combina con la clave pública del destinatario.",
      "input.recipient":
        "Quién puede descifrar. Cifrar para tu propia pubkey también funciona y es como se guardan los elementos privados de las listas.",
      "input.plaintext":
        "El texto a cifrar: de 1 a 65.535 bytes de UTF-8. Es habitual usar JSON (rumors de DMs, solicitudes RPC, elementos de listas).",
      "input.nonce":
        "32 bytes aleatorios, nuevos para cada mensaje. Déjalo vacío para obtener uno aleatorio; un nonce fijo solo sirve para ejemplos reproducibles y nunca debe reutilizarse en la vida real.",
      output:
        "base64( versión 0x02 | nonce 32 bytes | texto cifrado | mac 32 bytes ). Por el relleno, el texto cifrado tiene al menos 34 bytes, así que un payload tiene al menos 132 caracteres base64.",
      "example.party": "Alice le escribe a Bob",
      "example.party.explain":
        "Cifra un mensaje corto. Ejecútalo dos veces: el nonce aleatorio hace que cada payload sea distinto.",
      "example.fixed-nonce": "Bob responde, con un nonce fijo",
      "example.fixed-nonce.explain":
        "Con el nonce fijado, la salida es reproducible, útil para comparar implementaciones. Los clientes reales siempre usan un nonce aleatorio.",
      "example.self": "Cifrar para ti mismo",
      "example.self.explain":
        "Emisor y destinatario son ambos Alice. Así es como las listas de NIP-51 guardan elementos privados en el campo content.",
      "how.conversation-key.title": "Acordar una clave de conversación",
      "how.conversation-key.body":
        'El ECDH entre la clave secreta del emisor y la clave pública del destinatario da una coordenada x compartida; HKDF-extract con la sal "nip44-v2" la convierte en la clave de conversación. Es la misma en ambas direcciones, así que cualquiera de los dos puede descifrar.',
      "how.message-keys.title": "Derivar claves por mensaje",
      "how.message-keys.body":
        "Un nonce nuevo de 32 bytes pasa por HKDF-expand con la clave de conversación y produce 76 bytes: una clave ChaCha20, un nonce ChaCha20 y una clave HMAC. Un nonce nuevo significa claves nuevas para cada mensaje.",
      "how.padding.title": "Rellenar el texto plano",
      "how.padding.body":
        "El texto recibe un prefijo de longitud de 2 bytes y se rellena con ceros hasta el siguiente tamaño de un esquema de potencias de dos (al menos 32 bytes). Así, mensajes de longitud parecida tienen exactamente el mismo tamaño.",
      "how.encrypt-mac.title": "Cifrar y luego autenticar",
      "how.encrypt-mac.body":
        "ChaCha20 cifra los bytes rellenados. HMAC-SHA256 sobre nonce + texto cifrado produce el MAC, que el destinatario comprueba en tiempo constante antes de descifrar nada.",
      "how.encode.title": "Empaquetarlo en base64",
      "how.encode.body":
        "El byte de versión 0x02, el nonce, el texto cifrado y el MAC se concatenan y se codifican en base64. El resultado va en el content de un evento, y la firma del evento lo cubre.",
      "how.limits.title": "Saber qué no protege",
      "how.limits.body":
        "Sin secreto hacia adelante (forward secrecy), sin negabilidad y sin ocultar quién habla con quién: la pubkey, los tags y el created_at del evento siguen siendo públicos. Los gift wraps de NIP-59 añaden protección de metadatos encima.",
      "related.04":
        "Sustituye al antiguo cifrado de NIP-04 (AES-CBC, sin MAC, sin relleno), pero no es un reemplazo directo de su kind de DM.",
      "related.01":
        "Un payload siempre debe viajar dentro de un evento firmado, cuya firma lo autentica.",
      "related.17": "Los mensajes directos privados cifran sus seals y gift wraps con NIP-44.",
      "related.46": "Las solicitudes y respuestas de firma remota son payloads NIP-44.",
      "related.51":
        "Los elementos privados de las listas son un payload NIP-44 que el autor cifra para sí mismo.",
      "related.59": "Los seals y gift wraps llevan payloads NIP-44.",
    },
  },
  n45: {
    title: "Conteo de resultados",
    summary:
      'Añade un verbo COUNT para que un cliente pueda preguntar a un relay "¿cuántos eventos coinciden?" en lugar de descargarlos todos. Los relays pueden devolver un número aproximado y un sketch HyperLogLog que los clientes pueden combinar entre relays.',
    text: {
      "msg.query-id":
        "Un id que el cliente elige para esta consulta; el relay lo repite en su respuesta.",
      "msg.request.label": "Solicitud COUNT (cliente → relay)",
      "msg.request.explain":
        "La misma forma que un REQ: un id de consulta más uno o más filtros de NIP-01. Las coincidencias de todos los filtros se suman en un único número.",
      "msg.request.filter": "Un filtro REQ normal. Varios filtros se combinan con OR.",
      "msg.response.label": "Respuesta COUNT (relay → cliente)",
      "msg.response.explain":
        "La respuesta del relay, enviada una sola vez. A diferencia de REQ, no hay flujo de eventos ni EOSE.",
      "msg.response.result": "Un objeto con count y, opcionalmente, approximate y hll.",
      "msg.response.count": "Cuántos eventos coinciden.",
      "msg.response.approximate":
        "true cuando el relay usó un conteo probabilístico para ahorrar trabajo.",
      "msg.response.hll":
        "Sketch HyperLogLog opcional: 256 registros de un byte como 512 caracteres hex. Los clientes pueden combinar sketches de varios relays.",
      "msg.closed.label": "CLOSED (relay → cliente)",
      "msg.closed.explain":
        "Un relay que no va a responder a un COUNT debe contestar con CLOSED y un motivo.",
      "msg.closed.message":
        'Por qué se rechazó el conteo, con un prefijo legible por máquinas como "auth-required: ".',
      "example.notes": "Contar las notas y reacciones de Alice",
      "example.followers": "Contar los seguidores de Alice",
      "example.followers.explain":
        "Un número de seguidores es la cantidad de listas de seguidos kind 3 que la etiquetan con p. Una de las consultas canónicas que los relays pueden precalcular.",
      "example.reactions": "Contar las reacciones a la nota del avestruz de Erin",
      "example.exact": "Respuesta exacta",
      "example.approximate": "Respuesta aproximada",
      "example.hll": "Respuesta con un sketch HyperLogLog",
      "example.hll.explain":
        "El valor hll permite al cliente combinar la respuesta de este relay con otras sin contar dos veces.",
      "example.refused": "El relay se niega a contar DMs",
      "flow.followers.label": "Mostrar un número de seguidores",
      "flow.followers.explain":
        "Un solo ida y vuelta en lugar de descargar miles de listas de seguidos.",
      "flow.followers.ask":
        "El cliente envía COUNT con un filtro kind 3 que etiqueta el perfil con p.",
      "flow.followers.answer": "El relay responde con el conteo, posiblemente con un sketch hll.",
      "how.ask.title": "Pregunta con un filtro",
      "how.ask.body":
        '["COUNT", <id de consulta>, <filtros>...] usa exactamente los mismos filtros que REQ. Contar las listas de seguidos que etiquetan una pubkey da el número de seguidores sin descargarlas.',
      "how.answer.title": "Recibe un único número",
      "how.answer.body":
        'El relay responde ["COUNT", <id de consulta>, {"count": n}] y puede añadir "approximate": true si estimó el resultado.',
      "how.refuse.title": "O un rechazo",
      "how.refuse.body":
        "Si el relay no va a contar, por ejemplo DMs privados de otra persona, responde CLOSED con un motivo.",
      "how.hll.title": "HyperLogLog para combinar",
      "how.hll.body":
        "Para filtros con un solo valor de tag, el relay también puede devolver 256 registros. La pubkey de cada evento contado elige un registro (el byte en un desplazamiento determinista derivado del filtro) y guarda la racha más larga de bits cero iniciales vista.",
      "how.merge.title": "Combinar relays sin contar dos veces",
      "how.merge.body":
        "El cliente toma el valor más alto de cada registro entre los relays, añade los eventos que descargó él mismo y estima el total a partir del sketch combinado. El mismo seguidor visto en tres relays se cuenta una sola vez.",
      "related.01": "Añade COUNT junto a REQ y reutiliza los filtros y CLOSED de NIP-01.",
      "related.11": "Los relays incluyen 45 en supported_nips cuando responden a COUNT.",
      "related.42": "Los relays pueden exigir autenticación antes de contar eventos restringidos.",
    },
  },
  n46: {
    title: "Firma remota de Nostr",
    summary:
      'Mantiene tu clave secreta en un único lugar, un "bunker", y permite que las apps le pidan firmar. La app y el bunker se comunican mediante eventos kind 24133 cifrados en relays, con solicitudes al estilo JSON-RPC como sign_event, get_public_key y nip44_encrypt.',
    text: {
      "request.label": "Solicitud (kind 24133, cliente → firmante remoto)",
      "request.explain":
        "Firmada con el par de claves desechable del cliente y etiquetada con p al firmante remoto. Los relays solo ven dos pubkeys desconocidas intercambiando texto cifrado.",
      "request.content":
        "Un payload NIP-44 cifrado desde la clave del cliente hacia la clave del firmante remoto.",
      "request.plaintext":
        "Un objeto al estilo JSON-RPC: id, method y una lista de parámetros string.",
      "request.id":
        "Un string aleatorio. La respuesta lleva el mismo id para que el cliente pueda emparejarla.",
      "request.method": "El comando para el firmante remoto.",
      "request.params":
        "Parámetros string posicionales. Los objetos, como una plantilla de evento, se pasan serializados como JSON.",
      "method.connect":
        'Abre la sesión. Parámetros: pubkey del firmante remoto, secret opcional, permisos solicitados opcionales ("nip44_encrypt,sign_event:1"), JSON opcional con metadatos del cliente. Resultado: "ack" o el secret.',
      "method.sign_event":
        "Parámetros: una plantilla serializada como JSON {kind, content, tags, created_at}. Resultado: el evento firmado, serializado como JSON.",
      "method.ping": 'Sin parámetros. Resultado: "pong". Comprueba que el firmante está activo.',
      "method.get_public_key":
        "Sin parámetros. Resultado: la pubkey del usuario, que puede ser distinta de la pubkey del firmante remoto. Llámalo después de connect.",
      "method.nip04_encrypt":
        "Parámetros: pubkey de un tercero, texto plano. Resultado: un texto cifrado NIP-04 heredado.",
      "method.nip04_decrypt":
        "Parámetros: pubkey de un tercero, texto cifrado NIP-04. Resultado: el texto plano.",
      "method.nip44_encrypt":
        "Parámetros: pubkey de un tercero, texto plano. Resultado: un texto cifrado NIP-44.",
      "method.nip44_decrypt":
        "Parámetros: pubkey de un tercero, texto cifrado NIP-44. Resultado: el texto plano.",
      "method.switch_relays":
        "Sin parámetros. Resultado: la lista actual de relays del firmante, o null si no cambia nada.",
      "method.logout":
        'Sin parámetros. Resultado: "ack". El firmante olvida la sesión de este cliente.',
      "request.tag.p": "Dirige la solicitud al firmante remoto.",
      "request.tag.p.pubkey":
        "La pubkey del firmante remoto, tomada de la URL bunker:// o del autor de la respuesta a connect.",
      "response.label": "Respuesta (kind 24133, firmante remoto → cliente)",
      "response.explain":
        "Firmada con la clave del firmante remoto y etiquetada con p a la clave del cliente.",
      "response.content":
        "Un payload NIP-44 cifrado desde la clave del firmante remoto hacia la clave del cliente.",
      "response.plaintext":
        "La respuesta: el id de la solicitud, un string result y, si algo falla, un string error.",
      "response.id": "Copiado de la solicitud.",
      "response.result":
        "El resultado como string (serializado como JSON cuando es un objeto, como un evento firmado).",
      "response.error":
        'Solo aparece cuando algo salió mal. Con result "auth_url" contiene una URL que el usuario debe abrir.',
      "response.tag.p": "Devuelve la respuesta al cliente.",
      "response.tag.p.pubkey": "La pubkey del cliente que envió la solicitud.",
      "example.sign-request": "El cliente pide firmar una nota",
      "example.sign-request.explain":
        "Descifra el content para ver la solicitud sign_event. La clave de demostración de Carol hace de clave desechable del cliente; responde el bunker de Alice.",
      "example.connect": "El cliente se conecta con un secret",
      "example.connect.explain":
        "La solicitud connect a partir de un token bunker://: pubkey del firmante, el secret de un solo uso y los permisos que quiere la app.",
      "example.signed": "El firmante devuelve el evento firmado",
      "example.signed.explain":
        "El resultado es el evento kind 1 firmado completo como string JSON. El cliente puede publicarlo tal cual.",
      "example.ack": "El firmante acepta la conexión",
      "example.auth-url": "El firmante necesita que el usuario apruebe en un navegador",
      "example.auth-url.explain":
        'result "auth_url" con la URL en error. El cliente la abre y sigue escuchando; la respuesta real llega con el mismo id cuando el usuario aprueba.',
      "discovery.label": "Descubrimiento del firmante (nostr.json)",
      "discovery.explain":
        'Un firmante remoto puede publicar la pubkey de su app, sus relays y una plantilla de URL de conexión mediante NIP-05 con el nombre "_".',
      "discovery.names": "Mapa names estándar de NIP-05.",
      "discovery.names._":
        "La pubkey de la app del firmante remoto. Los clientes la usan para verificar el anuncio NIP-89 del firmante.",
      "discovery.nip46": "Pistas de conexión para NIP-46.",
      "discovery.relays":
        "Relays en los que escucha el firmante; úsalos al construir un string nostrconnect://.",
      "discovery.nostrconnect-url":
        "Una URL con un marcador <nostrconnect>. Sustitúyelo por un string nostrconnect:// para enviar al usuario a la página de aprobación del firmante.",
      "example.discovery": "Archivo de descubrimiento de un bunker",
      "flow.sign.label": "Firmar una nota con un firmante remoto",
      "flow.sign.explain": "Desde encontrar al firmante hasta recibir un evento firmado.",
      "flow.sign.discover":
        "Opcional: el cliente encuentra los relays del firmante mediante nostr.json.",
      "flow.sign.request": "El cliente envía una solicitud sign_event cifrada.",
      "flow.sign.response":
        "El firmante responde con el evento firmado, cifrado de vuelta para el cliente.",
      "how.keys.title": "Tres claves, tres roles",
      "how.keys.body":
        "El cliente crea un par de claves desechable. El firmante remoto tiene su propia clave para comunicarse y guarda la clave del usuario, que es la que realmente firma. La clave del firmante y la del usuario pueden ser la misma, pero los clientes no deben darlo por hecho.",
      "how.connect.title": "Conectar",
      "how.connect.body":
        "O bien el firmante entrega bunker://<pubkey-del-firmante>?relay=…&secret=… y el cliente envía una solicitud connect; o bien el cliente muestra nostrconnect://<pubkey-del-cliente>?relay=…&secret=… y el firmante responde con el secret. Después el cliente llama a get_public_key.",
      "how.request.title": "Enviar una solicitud cifrada",
      "how.request.body":
        "Cada llamada es un evento kind 24133 de la clave del cliente, etiquetado con p al firmante, con un objeto {id, method, params} cifrado con NIP-44 en el content.",
      "how.response.title": "Recibir una respuesta cifrada",
      "how.response.body":
        "El firmante responde con kind 24133, etiquetado con p al cliente, con {id, result} o {id, result, error}. Los métodos desconocidos deben recibir un error.",
      "how.auth-challenge.title": "A veces el usuario debe aprobar en otro lugar",
      "how.auth-challenge.body":
        'Una respuesta con result "auth_url" le indica al cliente que abra la URL de error. Cuando el usuario aprueba allí, el firmante envía la respuesta real con el mismo id.',
      "how.relays-logout.title": "Relays y cierre de sesión",
      "how.relays-logout.body":
        "El firmante sigue a cargo de los relays: los clientes llaman a switch_relays tras conectar y se mudan cuando se les indica. Al cerrar sesión el cliente puede enviar logout, y en cualquier caso debe borrar su par de claves de cliente.",
      "related.44": "Todas las solicitudes y respuestas se cifran con NIP-44.",
      "related.05": "Los firmantes pueden anunciar relays y una URL de conexión en nostr.json.",
      "related.89": "Los firmantes pueden anunciarse como apps kind 31990 que manejan kind 24133.",
      "related.07":
        "Las extensiones de navegador son la alternativa dentro del navegador a un firmante remoto.",
      "related.55": "Las apps firmantes de Android son la alternativa en el dispositivo.",
    },
  },
  n47: {
    title: "Nostr Wallet Connect",
    summary:
      "Permite que una app pague y cree facturas Lightning a través de tu wallet sin custodiar tus fondos. La wallet le da a la app una URI de conexión; luego la app envía solicitudes cifradas como pay_invoice por relays y recibe resultados cifrados.",
    text: {
      "info.label": "Información de la wallet (kind 13194)",
      "info.explain":
        "Un evento reemplazable que el servicio de wallet publica en sus relays, con lo que puede hacer esta conexión. Los clientes lo leen primero.",
      "info.content":
        'Los métodos soportados, separados por espacios, por ejemplo "pay_invoice get_balance".',
      "info.tag.encryption":
        "Esquemas de cifrado que acepta la wallet. Sin este tag, los clientes deben asumir que solo admite el NIP-04 heredado.",
      "info.tag.encryption.schemes":
        'Separados por espacios: "nip44_v2" (preferido) y/o "nip04" (obsoleto).',
      "info.tag.extensions":
        "Especificaciones de extensiones NWC opcionales que soporta la wallet.",
      "info.tag.extensions.ids":
        'Ids de extensión separados por espacios, del repositorio de NWC, como "02 03 04".',
      "example.info": "El servicio de wallet de Dave se anuncia",
      "example.info.explain":
        "La clave de demostración de Dave hace de clave del servicio de wallet de la URI de conexión.",
      "request.label": "Solicitud (kind 23194, cliente → wallet)",
      "request.explain":
        "Firmada con el secret de la URI de conexión (no con la clave de identidad del usuario), etiquetada con p al servicio de wallet.",
      "request.content":
        "Un payload NIP-44 (o NIP-04 heredado, si eso dice el tag encryption) que contiene el comando.",
      "request.plaintext": '{"method": ..., "params": {...}}.',
      "request.method": "El comando a ejecutar.",
      "request.params":
        "Parámetros propios de cada comando. Los importes siempre van en milisatoshis.",
      "method.pay_invoice":
        "Paga una factura BOLT11. Parámetros: invoice, amount y metadata opcionales. Resultado: preimage y fees_paid.",
      "method.make_invoice":
        "Crea una factura. Parámetros: amount, y opcionalmente description, description_hash, expiry, metadata.",
      "method.lookup_invoice": "Busca una factura o pago por payment_hash o invoice.",
      "method.get_balance": "Sin parámetros. Resultado: saldo en milisatoshis.",
      "method.get_info":
        "Sin parámetros. Resultado: alias del nodo, pubkey, red, altura de bloque, métodos y extensiones soportados.",
      "param.invoice": "Un string de factura BOLT11 (lnbc...).",
      "param.amount": "Importe en milisatoshis.",
      "param.description": "Descripción de texto que se incluye en una nueva factura.",
      "param.description-hash":
        "Hash de una descripción, usado en lugar de la descripción misma (los zaps usan esto).",
      "param.expiry": "Segundos hasta que expira una nueva factura.",
      "param.payment-hash": "Hash que identifica la factura a buscar.",
      "param.metadata": "Datos extra libres, como detalles de un zap o un boostagram.",
      "request.tag.p": "Dirige la solicitud al servicio de wallet.",
      "request.tag.p.pubkey": "La pubkey del servicio de wallet, de la URI de conexión.",
      "request.tag.encryption":
        "Qué esquema cifró esta solicitud. Debe ser uno de los que listó la wallet. Si falta, significa NIP-04.",
      "request.tag.encryption.scheme": "El cifrado usado en el content de esta solicitud.",
      "scheme.nip44": "NIP-44 v2. Obligatorio para implementaciones nuevas.",
      "scheme.nip04": "NIP-04 heredado, solo se mantiene por compatibilidad.",
      "request.tag.expiration":
        "Plazo opcional: una wallet que recibe la solicitud después de este momento la ignora.",
      "request.tag.expiration.timestamp": "Segundos Unix.",
      "example.pay": "Pagar una factura",
      "example.pay.explain":
        "Descifra el content para leer el comando pay_invoice. La clave de demostración de Bob hace de secret de conexión.",
      "example.balance": "Consultar el saldo, válido durante un minuto",
      "response.label": "Respuesta (kind 23195, wallet → cliente)",
      "response.explain":
        "Firmada por el servicio de wallet, etiquetada con p a la clave del cliente y con e a la solicitud que responde.",
      "response.content": "Cifrada con el esquema que usó la solicitud.",
      "response.plaintext": '{"result_type": ..., "error": ..., "result": ...}.',
      "response.result-type": "El método al que responde.",
      "response.error": "null si todo va bien; si no, un objeto con code y message.",
      "response.error.code": "Código de error legible por máquinas.",
      "response.error.message": "Explicación legible por personas.",
      "error.RATE_LIMITED": "Demasiadas solicitudes; reintenta en unos segundos.",
      "error.NOT_IMPLEMENTED": "La wallet no conoce o no soporta este método.",
      "error.INSUFFICIENT_BALANCE":
        "No hay fondos suficientes para el importe más la reserva para comisiones.",
      "error.QUOTA_EXCEEDED": "Se agotó el presupuesto de gasto de la conexión.",
      "error.RESTRICTED": "Esta clave no puede realizar esta operación.",
      "error.UNAUTHORIZED": "No hay ninguna wallet conectada a esta clave.",
      "error.INTERNAL": "Algo falló dentro del servicio de wallet.",
      "error.UNSUPPORTED_ENCRYPTION":
        "La solicitud usó un esquema de cifrado que la wallet no soporta.",
      "error.OTHER": "Cualquier otro error.",
      "error.PAYMENT_FAILED":
        "Solo pay_invoice: el pago falló (sin ruta, tiempo agotado, capacidad).",
      "error.NOT_FOUND": "Solo lookup_invoice: no hay ninguna factura que coincida.",
      "response.result": "null si hay error; si no, el objeto de resultado del método.",
      "result.preimage": "Prueba de que la factura se pagó (pay_invoice).",
      "result.fees-paid": "Comisiones de enrutamiento pagadas, en milisatoshis.",
      "result.balance": "Saldo de la wallet en milisatoshis (get_balance).",
      "response.tag.p": "Dirige la respuesta al cliente.",
      "response.tag.p.pubkey": "La pubkey del cliente, derivada del secret de conexión.",
      "response.tag.e": "La solicitud a la que responde esta respuesta.",
      "response.tag.e.id": "Id del evento de la solicitud kind 23194.",
      "example.paid": "Pago realizado",
      "example.paid.explain":
        "El tag e apunta a la solicitud de pago anterior (tal como la firmó Bob en la hora de demostración).",
      "example.error": "Pago rechazado: saldo insuficiente",
      "example.error.explain": "error está relleno y result es null.",
      "flow.pay.label": "Pagar una factura mediante NWC",
      "flow.pay.explain":
        "Lo que ocurre después de que el usuario pegó una URI nostr+walletconnect:// en la app.",
      "flow.pay.info":
        "La app lee el evento de información de la wallet para conocer sus métodos y su cifrado.",
      "flow.pay.request": "Envía una solicitud pay_invoice cifrada.",
      "flow.pay.response": "La wallet paga y responde con la preimage, o con un error.",
      "how.uri.title": "Vincular con una URI de conexión",
      "how.uri.body":
        "La wallet muestra nostr+walletconnect://<pubkey-de-la-wallet>?relay=…&secret=…&lud16=…. El secret es una clave nueva solo para esta app, así que los pagos no quedan vinculados a la identidad Nostr del usuario y cada conexión se puede revocar o tener un presupuesto.",
      "how.info.title": "Leer lo que soporta la wallet",
      "how.info.body":
        "La app obtiene el evento de información kind 13194 de los relays de la URI: el content lista los métodos y el tag encryption, los esquemas.",
      "how.request.title": "Enviar un comando cifrado",
      "how.request.body":
        "Un evento kind 23194 firmado con el secret de conexión, etiquetado con p a la wallet, con el comando cifrado con NIP-44 en el content. Los relays solo ven texto cifrado.",
      "how.response.title": "Recibir el resultado",
      "how.response.body":
        "La wallet responde con kind 23195, etiquetando con p a la app y con e a la solicitud. result_type nombra el método; se rellena error o result.",
      "how.encryption.title": "Negociar el cifrado",
      "how.encryption.body":
        "Los clientes eligen nip44_v2 siempre que el evento de información lo liste, y lo indican en el tag encryption de cada solicitud. Si el evento de información no tiene tag encryption, solo se soporta NIP-04.",
      "related.44": "Las solicitudes y respuestas se cifran con NIP-44.",
      "related.04":
        "El cifrado original, obsoleto, que todavía se puede negociar con wallets antiguas.",
      "related.40": "Las solicitudes pueden llevar un tag expiration.",
      "related.57": "Las apps suelen usar NWC para pagar las facturas de los zaps.",
    },
  },
  n48: {
    title: "Eventos puenteados",
    summary:
      "Marca los eventos que un puente (bridge) copió a Nostr desde ActivityPub, Bluesky, RSS o la web. Un tag proxy apunta al objeto original, para que los clientes puedan enlazarlo y no mostrar la misma publicación dos veces.",
    text: {
      "event.label": "Evento puenteado",
      "event.explain":
        "Cualquier kind puede llevar un tag proxy. Su presencia indica que el evento no se originó en Nostr sino en otro lugar de la web.",
      content:
        "El contenido de la publicación puenteada, convertido al formato normal del kind del evento.",
      "tag.proxy": "Vincula el evento con su objeto de origen en otro protocolo.",
      "tag.proxy.id":
        "El id del objeto de origen, en el formato de ese protocolo: una URL para ActivityPub y la web, una URI at:// para AT Protocol, una URL de feed más #guid para RSS. Debe ser único a nivel global.",
      "tag.proxy.protocol": "Nombre del protocolo de origen.",
      "protocol.activitypub": "Mastodon y el resto del fediverso. Id: la URL del objeto.",
      "protocol.atproto": "El AT Protocol de Bluesky. Id: una URI at://.",
      "protocol.rss":
        "Feeds RSS o Atom. Id: la URL del feed con el guid del elemento como fragmento codificado para URL.",
      "protocol.web": "Cualquier página web. Id: su URL.",
      "example.activitypub": "Una nota puenteada desde el fediverso",
      "example.activitypub.explain":
        'La clave de demostración de Frank hace de clave del puente para este usuario del fediverso. Los clientes pueden mostrar un enlace "ver original".',
      "example.atproto": "Una publicación de Bluesky",
      "example.rss": "Una entrada de blog de un feed RSS",
      "example.rss.explain": "El fragmento tras # es el guid del elemento, codificado para URL.",
      "how.bridge.title": "Un puente copia una publicación",
      "how.bridge.body":
        "Puentes como Mostr observan otra red y vuelven a publicar sus publicaciones como eventos Nostr, normalmente con una clave que el puente controla para cada cuenta remota.",
      "how.tag.title": "Registra de dónde vino la publicación",
      "how.tag.body":
        'El puente añade ["proxy", <id de origen>, <protocolo>]. El id es lo que identifique de forma única al objeto en su red de origen.',
      "how.protocol.title": "El nombre del protocolo dice cómo leer el id",
      "how.protocol.body":
        "Por ahora están definidos activitypub, atproto, rss y web; la lista puede crecer. Los clientes que no conocen un protocolo pueden mostrar igualmente el id como texto plano.",
      "how.dedupe.title": "Los clientes eliminan duplicados y enlazan al original",
      "how.dedupe.body":
        "Si dos puentes importan el mismo objeto, el id de origen idéntico permite a los clientes mostrarlo una sola vez. El id también puede convertirse en un enlace al original.",
      "related.01": "Añade un tag opcional a cualquier evento; nada más cambia.",
    },
  },
  n49: {
    title: "Cifrado de clave privada (ncryptsec)",
    summary:
      "Define ncryptsec, una forma de clave secreta protegida con contraseña. La contraseña se refuerza con scrypt, la clave se cifra con XChaCha20-Poly1305 y el resultado es un string bech32 que empieza por ncryptsec1, seguro para copias de seguridad pero no para publicarlo.",
    text: {
      "encoding.label": "ncryptsec (clave secreta cifrada con contraseña)",
      "encoding.explain":
        "Cifra una clave secreta de 32 bytes con una contraseña. Para descifrarla hace falta la misma contraseña; los parámetros de coste viajan dentro del string.",
      "input.secret-key":
        "La clave secreta como 64 caracteres hex. Este ejemplo usa la clave de prueba publicada en el NIP. Nunca escribas una clave real en un sitio web.",
      "input.password":
        "Primero se normaliza a Unicode NFKC, así la misma contraseña escrita en otro dispositivo produce la misma clave.",
      "input.log-n":
        "Coste de scrypt como potencia de dos. 16 necesita 64 MiB y unos 0,1 s; 20 necesita 1 GiB y unos 2 s. Más alto es más lento de romper y más lento de desbloquear.",
      "input.key-security":
        "Un byte que registra con qué cuidado se ha manejado esta clave. Está autenticado pero no es secreto.",
      "security.0":
        "0x00: se sabe que la clave se manejó de forma insegura (guardada o pegada sin cifrar).",
      "security.1": "0x01: no se sabe que la clave se haya manejado de forma insegura.",
      "security.2": "0x02: el cliente no lleva registro de esto.",
      output:
        'bech32 "ncryptsec" sobre 91 bytes: versión 0x02, log_n (1), sal (16), nonce (24), byte de seguridad de la clave (1), texto cifrado + tag (48).',
      "example.test-vector": "Los parámetros del vector de prueba del NIP",
      "example.test-vector.explain":
        'Contraseña "nostr", log_n 16. El ncryptsec publicado en el NIP se descifra a esta clave; cifrar de nuevo da un string distinto porque la sal y el nonce son aleatorios.',
      "example.stronger": "Una configuración más fuerte",
      "example.stronger.explain":
        "log_n 20 requiere alrededor de un gigabyte de memoria y un par de segundos, lo que encarece muchísimo adivinar contraseñas.",
      "example.unicode": "Contraseña Unicode",
      "example.unicode.explain":
        '"ÅΩẛ̣" se normaliza a NFKC (U+00C5 U+03A9 U+1E69) antes de scrypt, así que una entrada compuesta de otra forma igualmente desbloquea la clave.',
      "how.password.title": "Normalizar la contraseña",
      "how.password.body":
        "La contraseña se convierte a Unicode NFKC para que sea idéntica byte a byte en cualquier dispositivo y teclado.",
      "how.scrypt.title": "Reforzarla con scrypt",
      "how.scrypt.body":
        "scrypt(contraseña, sal = 16 bytes aleatorios, N = 2^log_n, r = 8, p = 1) produce una clave simétrica de 32 bytes. Este paso lento y exigente en memoria es lo que protege las contraseñas débiles. La clave se usa una vez y se descarta.",
      "how.encrypt.title": "Cifrar la clave secreta",
      "how.encrypt.body":
        "XChaCha20-Poly1305 cifra los 32 bytes de la clave con un nonce aleatorio de 24 bytes. El byte de seguridad de la clave son los datos asociados: no está oculto, pero manipularlo rompe el descifrado.",
      "how.encode.title": "Empaquetar y codificar en bech32",
      "how.encode.body":
        "La versión 0x02, log_n, la sal, el nonce, el byte de seguridad de la clave y el texto cifrado se concatenan (91 bytes) y se codifican en bech32 con el prefijo ncryptsec.",
      "how.keep-private.title": "Guárdalo como respaldo, no lo publiques",
      "how.keep-private.body":
        "Un ncryptsec es mucho más seguro que un nsec sin proteger, pero publicar muchos ayudaría a los atacantes a romper contraseñas débiles en masa. Guárdalo en copias de seguridad o gestores de contraseñas.",
      "related.19": "Usa bech32 como las entidades de NIP-19, con su propio prefijo ncryptsec.",
      "related.06": "Otra forma de respaldar una clave: una frase mnemónica.",
      "related.46": "Los firmantes remotos evitan por completo mover la clave de un sitio a otro.",
    },
  },
  n50: {
    title: "Capacidad de búsqueda",
    summary:
      'Añade un campo search a los filtros REQ para que los clientes puedan pedir a los relays resultados de búsqueda de texto completo, como "mejores apps de nostr". Los relays ordenan los resultados por relevancia en lugar de por fecha y pueden soportar opciones clave:valor extra como language:en.',
    text: {
      "msg.req.label": "REQ con un filtro de búsqueda",
      "msg.req.explain":
        "Una suscripción normal cuyo filtro tiene un string search. Los demás campos del filtro (kinds, authors, limit…) acotan los resultados como siempre.",
      "msg.req.subscription-id": "Cualquier id que el cliente elija para esta suscripción.",
      "msg.req.filter":
        "Un filtro de NIP-01 más search: una consulta legible por personas. Se pueden enviar varios filtros; cada uno puede tener su propio search.",
      "example.plain": "Búsqueda de texto simple",
      "example.plain.explain":
        'Las 20 notas más relevantes para "best nostr apps". limit se aplica después de ordenar por relevancia, no por fecha.',
      "example.extensions": "Búsqueda con extensiones",
      "example.extensions.explain":
        "language:en deja solo resultados en inglés y nsfw:false oculta eventos NSFW. Los relays ignoran las extensiones que no soportan.",
      "example.several": "Dos búsquedas a la vez",
      "example.several.explain":
        "Los filtros se combinan con OR: cualquier cosa sobre relays, más artículos largos sobre protocolos de usuarios con un NIP-05 en beta.example.",
      "how.field.title": "Pon la consulta en search",
      "how.field.body":
        "El campo search contiene texto libre. Los relays lo comparan con el content y, cuando tiene sentido para el kind, también con otros campos.",
      "how.ranking.title": "Los resultados llegan por relevancia",
      "how.ranking.body":
        "Los relays deberían devolver los eventos ordenados por calidad de coincidencia, no por created_at, y aplicar limit después de ordenarlos.",
      "how.extensions.title": "Extensiones clave:valor opcionales",
      "how.extensions.body":
        "include:spam desactiva el filtrado de spam, domain:<dominio> deja autores con un NIP-05 válido en ese dominio, y language:<código ISO 639-1>, sentiment:<negative|neutral|positive> y nsfw:<true|false> filtran aún más. Las extensiones desconocidas se ignoran.",
      "how.support.title": "Pregunta a relays que lo soporten",
      "how.support.body":
        "Los clientes buscan 50 en supported_nips, o envían la consulta igualmente y descartan los resultados que no coinciden. Consultar varios relays de búsqueda compensa las diferencias entre implementaciones.",
      "related.01": "Añade un campo al filtro REQ.",
      "related.11": "Los relays anuncian el soporte de búsqueda en supported_nips.",
      "related.51":
        "Los usuarios listan sus relays de búsqueda preferidos en una lista kind 10007.",
      "related.05": "La extensión domain: se basa en identificadores NIP-05.",
    },
  },
  n51: {
    title: "Listas",
    summary:
      "Una familia de eventos de lista: listas estándar, una por usuario (silenciados, fijados, marcadores, relays de búsqueda…), y conjuntos con nombre de los que puedes tener muchos (conjuntos de seguidos, de curación, de relays…). Los elementos van en los tags cuando son públicos, o en el content cifrado cuando son privados.",
    text: {
      "field.relay-hint": "Relay opcional donde se puede encontrar el elemento referenciado.",
      "field.pubkey": "Una clave pública, en hex.",
      "field.petname": "Apodo local opcional para esta persona.",
      "field.event-id": "Id del evento referenciado.",
      "field.address":
        "Coordenada kind:pubkey:d-tag de un evento direccionable, como un artículo u otro conjunto.",
      "field.hashtag": "Un tema, sin el #.",
      "field.relay-url": "Una URL de relay (ws:// o wss://).",
      "field.shortcode": "El :shortcode: usado en el texto (letras, dígitos, guion bajo).",
      "field.emoji-url": "URL de la imagen del emoji.",
      "field.word": "Una palabra o frase en minúsculas a ocultar.",
      "field.d": "Identificador de este conjunto. Cada conjunto del mismo kind necesita el suyo.",
      "field.title": "Nombre visible del conjunto.",
      "field.image": "URL de la imagen de portada.",
      "field.description": "De qué trata el conjunto.",
      "field.group-id": "El id del grupo NIP-29 en su relay.",
      "field.group-relay": "El relay que aloja el grupo.",
      "field.group-name": "Nombre visible opcional del grupo.",
      "field.server": "Una URL de servidor de medios Blossom.",
      "field.feed-url": "Una URL de feed de podcast RSS/XML.",
      "tag.p": "Una persona de la lista.",
      "tag.e": "Un evento de la lista (una nota, un canal, un video…).",
      "tag.a": "Un evento direccionable de la lista (un artículo, una comunidad, otro conjunto…).",
      "tag.t": "Un hashtag de la lista.",
      "tag.relay": "Un relay de la lista.",
      "tag.emoji": "Un emoji personalizado (NIP-30).",
      "tag.word": "Una palabra a silenciar.",
      "tag.group": "Un grupo NIP-29 al que pertenece el usuario.",
      "tag.r": "Un relay usado para grupos.",
      "tag.server": "Un servidor de medios (Blossom, kind 10063).",
      "tag.url": "Una URL de feed de podcast (kind 10054).",
      "tag.d":
        "Da nombre a este conjunto. Los conjuntos son direccionables: mismo autor, kind y d se reemplazan entre sí.",
      "tag.title": "Título opcional que se muestra en selectores y menús.",
      "tag.image": "Imagen opcional para el conjunto.",
      "tag.description": "Descripción opcional del conjunto.",
      "content.private":
        'Elementos privados: un payload NIP-44 que el autor cifró para su propia clave. Solo él puede leerlo. (Las listas antiguas usaban NIP-04; un texto cifrado que contiene "?iv=" es NIP-04.)',
      "content.private.plaintext":
        "Se descifra a un array JSON con exactamente la misma forma que el array de tags.",
      "content.private.items":
        'Elementos privados, por ejemplo [["word", "spoiler"], ["t", "politics"]].',
      "content.private.relays": 'Entradas de relay privadas: [["relay", "wss://…"]].',
      "content.optional-private":
        "Normalmente vacío. Puede contener elementos privados cifrados con NIP-44 para la propia clave del autor, con la forma del array de tags.",
      "mute.label": "Lista de silenciados (kind 10000)",
      "mute.explain":
        "Personas, hashtags, palabras e hilos que el usuario no quiere ver. Una por usuario.",
      "example.mute": "La lista de silenciados de Alice, pública y privada",
      "example.mute.explain":
        'Silenciar a Frank y la palabra "giveaway" es público. Descifrar el content (clave de demostración de Alice) revela dos silenciados privados: la palabra "spoiler" y el hashtag politics.',
      "pinned.label": "Notas fijadas (kind 10001)",
      "pinned.explain": "Notas que el usuario quiere destacar en su perfil.",
      "example.pinned": "Alice fija su hilo sobre relays",
      "bookmarks.label": "Marcadores (kind 10003)",
      "bookmarks.explain": "Una lista global de notas (e) y artículos (a) guardados.",
      "example.bookmarks": "Carol guarda una nota y un artículo",
      "relays.label": "Listas de relays (kinds 10006, 10007, 10012, 10102)",
      "relays.explain":
        "10006 relays bloqueados (nunca conectar), 10007 relays de búsqueda, 10012 relays favoritos para explorar (también pueden apuntar a conjuntos de relays), 10102 relays con buenos artículos wiki.",
      "example.search-relays": "Los relays de búsqueda de Alice",
      "example.search-relays.explain":
        "Los clientes envían las consultas de búsqueda NIP-50 a estos relays.",
      "example.blocked-relays": "Bob bloquea un relay con spam",
      "private-relays.label": "Relays privados (kind 10013)",
      "private-relays.explain":
        "Relays para contenido privado como borradores (NIP-37). Siempre totalmente cifrada; sin tags públicos.",
      "example.private-relays": "El relay de borradores de Alice",
      "example.private-relays.explain":
        "Descifra con la clave de demostración de Alice para ver el relay.",
      "people.label": "Listas de personas (kinds 10017, 10020, 10101)",
      "people.explain":
        "10020 seguidos de multimedia (clientes de fotos y videos), 10017 autores de git, 10101 autores de wiki de confianza.",
      "example.media-follows": "Alice sigue las fotos de Carol",
      "example.media-follows.explain":
        "El mismo formato que una lista de seguidos: pubkey, pista de relay opcional, apodo opcional.",
      "other.label": "Otras listas estándar",
      "other.explain":
        "10004 comunidades (a a kind 34550), 10005 chats públicos (e a kind 40), 10009 grupos (group + r), 10015 intereses (t, a a conjuntos de intereses), 10018 repositorios git (a a 30617), 10021 conjuntos de seguidos favoritos, 10030 emojis (emoji, a a conjuntos de emojis), 10054 podcasts favoritos (p, url), 10063 servidores Blossom (server), 10064 podcasts propios (p).",
      "example.interests": "Los intereses de Erin",
      "example.interests.explain":
        "Hashtags más una referencia a uno de sus conjuntos de intereses.",
      "example.groups": "Los grupos de Carol",
      "example.emojis": "La lista de emojis de Erin",
      "sets.label": "Conjuntos (kinds 30000–30267, 39089, 39092)",
      "sets.explain":
        "Listas con nombre y direccionables: un usuario puede tener muchas, cada una con su propio tag d. 30000 conjuntos de seguidos, 30002 conjuntos de relays, 30003 conjuntos de marcadores, 30004–30006 conjuntos de curación (artículos, videos, imágenes), 30007 conjuntos de kinds silenciados (d = el kind), 30008 conjuntos de insignias, 30015 conjuntos de intereses, 30030 conjuntos de emojis, 30063 artefactos de versión, 30267 curación de apps, 39089/39092 paquetes de inicio (starter packs).",
      "example.follow-set": 'El conjunto de seguidos "Operadores de relays" de Alice',
      "example.follow-set.explain":
        "Un cliente puede ofrecerlo como feed o como starter pack para seguir a todos de una vez.",
      "example.curation-set": "Una lista de lectura de artículos y una nota",
      "example.relay-set": "El conjunto de relays de Bob para publicar rápido",
      "legacy.label": "Obsoleto: listas kind 30001",
      "legacy.explain":
        'Los clientes antiguos guardaban fijados, marcadores y comunidades como kind 30001 con un tag d fijo (y los silenciados como kind 30000 con d "mute"). Usa las listas estándar en su lugar.',
      "legacy.tag.d":
        "El antiguo nombre fijo de la lista. Obsoleto: migra al kind de lista estándar.",
      "legacy.pin": "Usa en su lugar las notas fijadas kind 10001.",
      "legacy.bookmark": "Usa en su lugar los marcadores kind 10003.",
      "legacy.communities": "Usa en su lugar las comunidades kind 10004.",
      "example.legacy": "Los marcadores al estilo antiguo de Bob",
      "example.legacy.explain":
        "El editor señala la forma obsoleta. Los clientes deberían mover estos elementos a kind 10003.",
      "how.public.title": "Los elementos públicos viven en los tags",
      "how.public.body":
        'Cada elemento es un tag: ["p", pubkey], ["e", id], ["a", coordenada], ["t", hashtag], ["relay", url]… Cualquiera puede leerlos.',
      "how.private.title": "Los elementos privados se esconden en el content",
      "how.private.body":
        "El autor toma un array de elementos privados con forma de tags, lo codifica en JSON, lo cifra con NIP-44 para su propia clave y lo guarda en content. Una misma lista puede combinar ambos.",
      "how.standard-lists.title": "Listas estándar: una por usuario",
      "how.standard-lists.body":
        "Los kinds 10000–19999 son reemplazables, así que cada usuario tiene exactamente una lista de silenciados, una de marcadores y así sucesivamente. Publicar una versión nueva reemplaza la anterior.",
      "how.sets.title": "Conjuntos: tantos como quieras",
      "how.sets.body":
        "Los kinds 30000+ son direccionables, identificados por kind, autor y tag d. Los conjuntos pueden añadir tags title, image y description para menús más bonitos.",
      "how.append.title": "Añade los elementos nuevos al final",
      "how.append.body":
        "Los clientes añaden los elementos nuevos al final para que la lista se mantenga en orden cronológico, y deben volver a publicar la lista completa con cada cambio.",
      "how.legacy.title": "Migra las listas antiguas",
      "how.legacy.body":
        "Las listas kind 30001 con d pin, bookmark o communities, y kind 30000 con d mute, son formas obsoletas de las listas estándar.",
      "related.01": "Las listas son eventos reemplazables (10000s) o direccionables (30000s).",
      "related.44": "Los elementos privados se cifran con NIP-44 para la propia clave del autor.",
      "related.04":
        'Las listas antiguas cifraban los elementos privados con NIP-04; los clientes pueden detectar "?iv=" y descifrar en consecuencia.',
      "related.02": "La lista de seguidos (kind 3) es la lista original.",
      "related.65":
        "La lista de relays de lectura/escritura (kind 10002) también es una lista estándar.",
      "related.58":
        "Las insignias de perfil (10008) y los conjuntos de insignias (30008) son listas NIP-51.",
      "related.29": "La lista de grupos (10009) apunta a grupos NIP-29.",
      "related.30": "Las listas y conjuntos de emojis usan tags emoji de NIP-30.",
    },
  },
  n52: {
    title: "Eventos de calendario",
    summary:
      "Entradas de calendario como eventos Nostr: eventos de día completo por fecha, eventos con hora y zona horaria, calendarios que los agrupan y RSVPs en los que la gente responde accepted, declined o tentative. Los eventos recurrentes se dejan fuera a propósito.",
    text: {
      "tag.d":
        "Identifica este evento, calendario o RSVP entre los demás del autor del mismo kind.",
      "field.d": "Un string corto y único elegido por el cliente.",
      "tag.title": "El título. Obligatorio.",
      "field.title": "Título visible.",
      "tag.summary": "Una descripción corta para listas y vistas previas.",
      "field.summary": "Una línea de texto.",
      "tag.image": "Una imagen para el evento.",
      "field.image": "URL de la imagen.",
      "tag.location": "Dónde ocurre. Repítelo para varias ubicaciones.",
      "field.location":
        "Una dirección, coordenadas GPS, el nombre de una sala o un enlace de videollamada.",
      "tag.g": "Un geohash, para que los clientes puedan buscar eventos cerca de un lugar.",
      "field.geohash":
        "Caracteres geohash (0–9 y b–z sin a, i, l, o). Cuanto más largo, más preciso.",
      "tag.p": "Un participante. Etiquetar a alguien puede interpretarse como invitarlo.",
      "field.pubkey": "La clave pública del participante.",
      "field.relay": "Pista de relay opcional.",
      "field.role": "Rol opcional, como ponente o anfitrión.",
      "tag.t": "Un hashtag para categorizar el evento.",
      "field.hashtag": "El tema, sin #.",
      "tag.r": "Un enlace: página web, documento, videollamada o grabación.",
      "field.reference": "La URL.",
      "tag.a.calendar":
        "Pide ser incluido en un calendario (kind 31924). Decide el dueño del calendario.",
      "field.calendar": "Coordenada 31924:<pubkey del dueño>:<d del calendario>.",
      "tag.name": "Antiguo nombre del tag title. Obsoleto: usa title.",
      "content.description": "Una descripción del evento de calendario. Puede estar vacía.",
      "content.calendar": "Una descripción del calendario. Obligatoria, pero puede estar vacía.",
      "content.rsvp": "Una nota libre opcional para el organizador.",
      "time.label": "Evento con hora (kind 31923)",
      "time.explain":
        "Va de una hora de inicio a una hora de fin, como una reunión o una charla. Es direccionable, así que el organizador puede actualizarlo.",
      "time.tag.start": "Cuándo empieza. Obligatorio.",
      "time.field.start": "Inicio inclusivo, segundos Unix. Debe ser anterior a end.",
      "time.tag.end": "Cuándo termina. Si se omite, termina al instante.",
      "time.field.end": "Fin exclusivo, segundos Unix.",
      "time.tag.D": "Índice de día para consultas. Añade uno por cada día que toca el evento.",
      "time.field.D":
        'floor(unix_seconds / 86400): días desde 1970-01-01. Permite a los clientes pedir "todo lo de este día" con un filtro #D.',
      "time.tag.start-tzid": "Zona horaria en la que mostrar el inicio.",
      "time.tag.end-tzid": "Zona horaria del fin; por defecto, start_tzid.",
      "time.field.tzid": "Un nombre de zona horaria IANA como Europe/Madrid o America/Costa_Rica.",
      "example.meetup": "La quedada de Nostr de Alice",
      "example.meetup.explain":
        "18:00–20:00 UTC del 2025-01-18, mostrado en hora de Madrid. D 20106 es el índice de ese día. Bob está invitado como ponente y el evento pide unirse al calendario de Alice.",
      "date.label": "Evento por fecha (kind 31922)",
      "date.explain":
        "Eventos de uno o varios días completos en los que la hora y la zona no importan: festivos, viajes, aniversarios.",
      "date.tag.start": "Primer día. Obligatorio.",
      "date.field.start": "Fecha de inicio inclusiva, YYYY-MM-DD.",
      "date.tag.end": "Día siguiente al último día. Si se omite, un solo día.",
      "date.field.end": "Fecha de fin exclusiva, YYYY-MM-DD.",
      "example.vacation": "El viaje fotográfico de Carol",
      "example.vacation.explain":
        "Del 10 de febrero hasta el 14 de febrero (sin incluirlo): cuatro días.",
      "calendar.label": "Calendario (kind 31924)",
      "calendar.explain":
        "Una colección con nombre de eventos de calendario, como trabajo, viajes o quedadas. Un usuario puede tener varios.",
      "tag.a.event": "Un evento de calendario de esta colección, o aquel al que responde un RSVP.",
      "field.calendar-event": "Coordenada 31922 o 31923:<pubkey del autor>:<d>.",
      "example.calendar": "El calendario de Alice",
      "rsvp.label": "RSVP (kind 31925)",
      "rsvp.explain":
        "La respuesta de cualquiera a un evento de calendario, esté invitado o no. Es direccionable, así que cambiar de opinión la reemplaza.",
      "rsvp.tag.e": "Opcionalmente fija la respuesta a una revisión del evento de calendario.",
      "rsvp.field.e": "Id de esa revisión.",
      "rsvp.tag.status": "La respuesta. Obligatoria.",
      "rsvp.field.status": "accepted, declined o tentative.",
      "rsvp.status.accepted": "Asistirá.",
      "rsvp.status.declined": "No asistirá.",
      "rsvp.status.tentative": "Quizá asista.",
      "rsvp.tag.fb": "Si el usuario está libre u ocupado durante el evento. Omítelo al rechazar.",
      "rsvp.field.fb": "free o busy.",
      "rsvp.fb.free": "El usuario sigue disponible para otras cosas.",
      "rsvp.fb.busy": "El tiempo queda bloqueado.",
      "rsvp.tag.p":
        "El organizador, para que pueda encontrar fácilmente todos los RSVPs de sus eventos.",
      "rsvp.field.p": "La pubkey del autor del evento de calendario.",
      "example.rsvp": "Bob acepta",
      "example.rsvp.explain":
        "El tag a nombra la quedada de Alice; el tag p permite a Alice consultar todos los RSVPs dirigidos a ella.",
      "example.rsvp-declined": "Dave rechaza",
      "flow.rsvp.label": "De la invitación al RSVP",
      "flow.rsvp.explain":
        "Un organizador crea un evento, lo archiva en un calendario y la gente responde.",
      "flow.rsvp.create": "Alice publica un evento con hora y etiqueta con p a sus ponentes.",
      "flow.rsvp.calendar": "Su calendario referencia el evento con un tag a.",
      "flow.rsvp.answer": "Bob responde con un RSVP que apunta a la coordenada del evento.",
      "how.two-types.title": "Dos kinds de evento de calendario",
      "how.two-types.body":
        "Kind 31922 para días completos (fechas, sin zona horaria) y kind 31923 para eventos con hora (marcas de tiempo Unix). Ambos son direccionables: mismo autor, kind y tag d significa el mismo evento, actualizado.",
      "how.time.title": "Que se pueda encontrar por día",
      "how.time.body":
        'Los eventos con hora llevan tags D con el índice de día, así un cliente puede pedir a los relays {"kinds":[31923], "#D":["20106"]} para llenar un día de la vista de calendario.',
      "how.invite.title": "Invita a personas con tags p",
      "how.invite.body":
        "Cada tag p nombra a un participante con un relay y un rol opcionales. Los clientes pueden pedir a esos usuarios que respondan con un RSVP.",
      "how.calendar.title": "Agrupa eventos en calendarios",
      "how.calendar.body":
        "Un calendario kind 31924 lista eventos con tags a. Otros pueden pedir ser añadidos poniendo la coordenada del calendario en su propio evento; el dueño acepta añadiéndolo.",
      "how.rsvp.title": "Responde con un RSVP",
      "how.rsvp.body":
        "Kind 31925 apunta al evento con un tag a (y opcionalmente a una revisión con e), dice accepted, declined o tentative y puede añadir free o busy.",
      "related.01": "Los cuatro kinds son eventos direccionables.",
      "related.09": "Los eventos de calendario se pueden borrar con solicitudes de borrado.",
      "related.51": "Los calendarios funcionan como conjuntos NIP-51 de eventos de calendario.",
      "related.19": "Enlaza a un evento de calendario con un naddr.",
    },
  },
  n53: {
    title: "Transmisiones en vivo y espacios",
    summary:
      "Describe transmisiones en vivo y salas de audio/video como eventos que se actualizan mientras ocurren: quién presenta, dónde verlo, cuánta gente hay dentro. Los espectadores chatean con mensajes kind 1311, y los oyentes de una sala indican su presencia y si levantan la mano.",
    text: {
      "tag.d":
        "Identifica esta actividad entre las demás del autor. Usa un d nuevo para cada actividad.",
      "field.d": "Un string único.",
      "tag.title": "Nombre de la transmisión o reunión.",
      "tag.summary": "Una descripción corta.",
      "tag.image": "Imagen de vista previa.",
      "field.text": "Texto libre.",
      "field.url": "Una URL.",
      "tag.t": "Un hashtag.",
      "field.hashtag": "El tema, sin #.",
      "tag.starts": "Hora de inicio. Actualízala cuando el estado cambie a live.",
      "tag.ends": "Hora de fin. Actualízala cuando el estado deje de ser live.",
      "field.timestamp": "Segundos Unix.",
      "tag.status": "En qué punto de su ciclo de vida está la actividad.",
      "field.status": "Uno de los valores de estado permitidos.",
      "status.planned": "Anunciada, aún no ha empezado.",
      "status.live":
        "Ocurriendo ahora. Los clientes pueden darla por terminada tras una hora sin actualizaciones.",
      "status.ended": "Terminada. El evento ahora puede apuntar a una grabación.",
      "tag.current": "Cuántas personas hay dentro ahora mismo.",
      "tag.total": "Cuántas personas se unieron en total.",
      "field.count": "Un número entero.",
      "tag.p": "Un participante y su rol. Mantén la lista corta (menos de unas 1000).",
      "field.pubkey": "La clave pública del participante.",
      "field.relay": "Pista de relay opcional; puede estar vacía.",
      "field.role": "Un rol para mostrar, como Host, Speaker, Moderator o Participant.",
      "field.proof":
        'Prueba opcional de que la persona aceptó participar: su firma sobre el SHA-256 de la coordenada a de la actividad (kind:pubkey:d), en hex. Sin ella, los clientes pueden mostrarla como "invitada".',
      "tag.relays": "Relays donde viven el chat y los eventos relacionados de la actividad.",
      "field.relay-url": "Una URL de relay. Repítelo para varios.",
      "tag.a": "La actividad a la que pertenece este evento.",
      "field.activity": "Coordenada kind:pubkey:d de la transmisión, espacio o reunión.",
      "field.marker": 'Marcador opcional; los ejemplos usan "root".',
      "content.empty": "Vacío. Todo está en los tags.",
      "content.usually-empty": "Normalmente vacío; puede contener metadatos extra.",
      "live.label": "Transmisión en vivo (kind 30311)",
      "live.explain":
        "Un evento direccionable que el anfitrión va actualizando durante la transmisión: estado, participantes, conteos. Enlázalo con un naddr más el tag a.",
      "live.tag.streaming": "Dónde verla en vivo.",
      "live.field.streaming":
        "URL de la transmisión, por ejemplo una lista de reproducción HLS .m3u8.",
      "live.tag.recording": "Dónde verla después.",
      "live.tag.pinned": "Un mensaje del chat que fijó el anfitrión. Repítelo para varios.",
      "live.field.pinned": "Id de un mensaje kind 1311.",
      "example.live": "Alice está en vivo",
      "example.live.explain":
        "Alice presenta, Bob habla y 42 personas están mirando. Cada actualización reemplaza la versión anterior de este evento.",
      "example.ended": "La misma transmisión, terminada",
      "example.ended.explain":
        "Mismo tag d, así que reemplaza la versión en vivo: estado ended, una hora de fin y un enlace a la grabación.",
      "chat.label": "Mensaje de chat en vivo (kind 1311)",
      "chat.explain": "Un mensaje de chat en el canal de una actividad en vivo.",
      "chat.content": "El texto del mensaje.",
      "chat.tag.e": "El mensaje al que responde este.",
      "chat.field.e": "Id del mensaje de chat padre.",
      "chat.tag.q": "Cita un evento mencionado en el content con un enlace nostr:.",
      "chat.field.q": "Un id de evento o una dirección de evento.",
      "chat.field.q-pubkey": "La pubkey del autor citado, al citar un evento normal.",
      "example.chat": "Carol hace una pregunta",
      "space.label": "Espacio de reuniones (kind 30312)",
      "space.explain":
        "Una sala virtual que puede acoger muchas reuniones: su nombre, cómo entrar y quién la gestiona. Debe tener al menos un Host.",
      "space.tag.room": "Nombre visible de la sala. Obligatorio.",
      "space.tag.status": "Si la gente puede entrar. Obligatorio.",
      "space.status.open": "Cualquiera puede unirse.",
      "space.status.private": "Restringida, por ejemplo solo con invitación o de pago.",
      "space.status.closed": "Fuera de servicio.",
      "space.tag.service": "URL para unirse a la sala. Obligatorio.",
      "space.tag.endpoint": "Endpoint de API para el estado o la información de la sala.",
      "example.space": "La Delta Hall de Dave",
      "example.space.explain":
        "Dave es el anfitrión y Bob modera. Las reuniones en esta sala apuntan a ella.",
      "meeting.label": "Reunión (kind 30313)",
      "meeting.explain":
        "Una reunión programada o en curso dentro de un espacio. Debe referenciar el espacio y tener un estado y una hora de inicio.",
      "example.meeting": "Una llamada planificada en Delta Hall",
      "presence.label": "Presencia en la sala (kind 10312)",
      "presence.explain":
        "Indica que el usuario está escuchando en una sala. Es reemplazable, así que un usuario está presente en una sola sala a la vez; refréscalo con regularidad, porque los clientes ignoran la presencia desactualizada.",
      "presence.tag.hand": "Indicador de mano levantada.",
      "presence.field.hand": '"1" para levantada, "0" (o sin tag) para bajada.',
      "presence.hand.1": "Mano levantada: quiere hablar.",
      "presence.hand.0": "Mano bajada.",
      "example.presence": "Grace levanta la mano",
      "example.presence.explain": "Grace está en Delta Hall y quiere preguntar algo.",
      "flow.stream.label": "Una transmisión en vivo",
      "flow.stream.explain": "Anunciar, actualizar, chatear.",
      "flow.stream.announce": "El anfitrión publica y va actualizando el evento kind 30311.",
      "flow.stream.chat":
        "Los espectadores envían mensajes kind 1311 que etiquetan con a la transmisión.",
      "flow.room.label": "Una sala de reuniones",
      "flow.room.explain": "Espacio, reunión, presencia.",
      "flow.room.space": "El anfitrión define la sala una vez (kind 30312).",
      "flow.room.meeting": "Cada reunión es un evento kind 30313 que referencia la sala.",
      "flow.room.presence":
        "Los oyentes publican su presencia con kind 10312 y levantan la mano cuando quieren hablar.",
      "how.announce.title": "Anuncia la transmisión",
      "how.announce.body":
        "El anfitrión publica kind 30311 con un tag d, un título y una URL de streaming. Es direccionable, así que cada actualización reemplaza la versión anterior.",
      "how.update.title": "Mantenla al día",
      "how.update.body":
        "Mientras está en vivo, el anfitrión actualiza status, starts y los conteos de participantes. Un evento en vivo sin actualizaciones durante una hora puede darse por terminado; cuando termina, status pasa a ended y se puede añadir una grabación.",
      "how.participants.title": "Lista los participantes con sus roles",
      "how.participants.body":
        "Los tags p llevan un rol como Host o Speaker y, opcionalmente, una firma de prueba, que impide que un anfitrión afirme que personas conocidas participan sin su consentimiento.",
      "how.chat.title": "Chatea en la transmisión",
      "how.chat.body":
        "Los mensajes kind 1311 deben etiquetar con a la actividad; un tag e los convierte en respuesta. Los anfitriones fijan mensajes añadiendo tags pinned al evento en vivo.",
      "how.spaces.title": "Salas y reuniones",
      "how.spaces.body":
        "Un espacio kind 30312 es una sala persistente; cada reunión kind 30313 lo referencia con un tag a y tiene su propio estado y horarios.",
      "how.presence.title": "Muestra quién está escuchando",
      "how.presence.body":
        "Los oyentes publican kind 10312 con el tag a de la sala y un tag hand opcional, y lo refrescan periódicamente.",
      "related.01": "Las actividades son eventos direccionables y reemplazables.",
      "related.19": "Las actividades deben enlazarse con un naddr.",
      "related.21": "Los mensajes de chat citan eventos con enlaces nostr: más tags q.",
      "related.57": "Los espectadores suelen enviar zaps a las transmisiones en vivo.",
    },
  },
  n54: {
    title: "Wiki",
    summary:
      "Una enciclopedia abierta donde cualquiera puede escribir un artículo sobre cualquier tema. Los artículos son eventos direccionables kind 30818 en Djot, muchos autores pueden cubrir el mismo tema y los lectores eligen versiones mediante reacciones, seguidos y relays de confianza. Los forks, las solicitudes de fusión y las redirecciones también son eventos.",
    text: {
      "tag.d":
        "El tema, normalizado. Todos los artículos sobre el mismo asunto usan el mismo tag d.",
      "field.d":
        'En minúsculas, los espacios pasan a "-", sin signos de puntuación, se recortan los guiones repetidos o de los extremos; las letras no latinas se quedan como están. "What\'s Up?" → "whats-up".',
      "field.title": "El título a mostrar cuando difiere del tag d (mayúsculas, puntuación).",
      "field.summary": "Una línea para listas.",
      "field.article": "Coordenada 30818:<pubkey del autor>:<tema>.",
      "field.version": "Id de una versión concreta de un artículo.",
      "field.relay": "Pista de relay opcional.",
      "field.marker": "fork o defer.",
      "marker.fork": "Este artículo empezó como copia del referenciado.",
      "marker.defer":
        "El autor considera que la versión referenciada es mejor que la suya: un respaldo fuerte, casi un autoborrado.",
      "article.label": "Artículo wiki (kind 30818)",
      "article.explain":
        "Un artículo direccionable sobre un tema. Muchas personas pueden publicar su propio artículo para el mismo tag d.",
      "article.content":
        "Marcado Djot. Los enlaces pueden ser URIs nostr:; un enlace de referencia sin definición, como [cryptocurrency][], se convierte en un wikienlace al artículo de ese tema.",
      "article.tag.title": "Título visible.",
      "article.tag.summary": "Resumen corto para listas.",
      "article.tag.a": "El artículo del que se hizo fork o al que se remite.",
      "article.tag.e": "La versión exacta de la que se hizo fork o a la que se remite.",
      "example.article": "El artículo de Alice sobre relays",
      "example.article.explain":
        '[events][] y [outbox model][] no tienen definiciones de referencia, así que enlazan a los artículos "events" y "outbox-model". El enlace a Alice es una URI nostr:.',
      "example.fork": "Bob hace fork del artículo de Alice",
      "example.fork.explain":
        "Tanto a como e llevan el marcador fork, para que los lectores vean exactamente de qué versión partió Bob.",
      "merge.label": "Solicitud de fusión (kind 818)",
      "merge.explain":
        "Pide al autor de un artículo que incorpore los cambios de una versión fork.",
      "merge.content": "Explicación opcional de qué cambió y por qué.",
      "merge.tag.a": "El artículo a actualizar (el destino de la fusión).",
      "merge.field.a": "Coordenada del artículo destino.",
      "merge.tag.e-base": "La versión sobre la que se hicieron los cambios (opcional).",
      "merge.field.e-base": "Id de la versión base.",
      "merge.tag.e-source": 'La versión a fusionar, marcada como "source".',
      "merge.field.e-source": "Id de un evento kind 30818 con los cambios propuestos.",
      "merge.field.marker": 'Siempre "source".',
      "merge.tag.p": "El autor al que se pide la fusión.",
      "merge.field.p": "Su pubkey.",
      "example.merge": "Bob pide a Alice que fusione su aporte",
      "example.merge.explain": "Alice acepta con una reacción + a este evento, o rechaza con -.",
      "redirect.label": "Redirección (kind 30819)",
      "redirect.explain":
        'Hace que un nombre de tema apunte a otro artículo, para alias ("btc" → "bitcoin") y páginas de desambiguación.',
      "redirect.content": "Vacío.",
      "redirect.tag.d": "El tema que se redirige.",
      "redirect.tag.a": "El artículo que se muestra en su lugar.",
      "example.redirect": '"relays" redirige a "relay"',
      "flow.merge.label": "Fork y fusión",
      "flow.merge.explain": "Mejorar el artículo de otra persona.",
      "flow.merge.fork": "Bob publica su propia versión con marcadores fork.",
      "flow.merge.request":
        "Envía a Alice una solicitud de fusión kind 818 que apunta a su versión.",
      "how.topic.title": "Un tema, un nombre normalizado",
      "how.topic.body":
        'El tag d es el tema en una forma normal fija, así que el artículo de cualquiera sobre "Wiki Article" acaba bajo "wiki-article" y se pueden encontrar juntos.',
      "how.djot.title": "Escribe en Djot",
      "how.djot.body":
        "Djot tiene una única especificación clara y soporta notas al pie, tablas y fórmulas matemáticas. Los enlaces de referencia sin definir se convierten en wikienlaces, así que enlazar a otro tema es solo [tema][].",
      "how.many-versions.title": "Muchas versiones, deciden los lectores",
      "how.many-versions.body":
        "No hay un único artículo oficial. Los clientes ordenan las versiones con reacciones +, los seguidos del lector y listas NIP-51 específicas de wiki con autores (10101) y relays (10102).",
      "how.fork.title": "Fork y defer",
      "how.fork.body":
        "¿Copias un artículo para mejorarlo? Añade tags a y e con el marcador fork. Si tus cambios se adoptaron en el original, publica tags defer para enviar a tus lectores a esa versión.",
      "how.merge.title": "Pide una fusión",
      "how.merge.body":
        'Un evento kind 818 apunta al artículo (a), nombra la base (e), la versión propuesta (e con "source") y al autor (p).',
      "how.redirect.title": "Redirige los alias",
      "how.redirect.body":
        'Un kind 30819 con d "btc" y un tag a al artículo de bitcoin hace que los clientes salten allí.',
      "related.23":
        "Los artículos largos son parecidos pero pertenecen a un solo autor; los artículos wiki son temas compartidos.",
      "related.21": "El contenido de los artículos enlaza a perfiles y eventos con URIs nostr:.",
      "related.25": "Las reacciones aceptan solicitudes de fusión y recomiendan artículos.",
      "related.51":
        "Las listas de buenos autores (10101) y relays (10102) de wiki ayudan a elegir versiones.",
    },
  },
  n55: {
    title: "Aplicación firmante para Android",
    summary:
      "Permite que las apps de Android (y las páginas web abiertas en Android) pidan a una app firmante separada que firme eventos y cifre o descifre mensajes, para que solo el firmante tenga la clave secreta. Las solicitudes pasan por intents, un content resolver en segundo plano o enlaces nostrsigner:.",
    text: {
      "actor.user": "Usuario",
      "actor.client": "App de Nostr",
      "actor.signer": "App firmante",
      "step.get-public-key.label": "get_public_key",
      "step.get-public-key.explain":
        "La app abre un intent nostrsigner: con type get_public_key. Puede listar permisos para preautorizar, como firmar kind 22242 o nip44_decrypt.",
      "step.approve-login.label": "Aprobar el inicio de sesión",
      "step.approve-login.explain":
        "Se abre el firmante y el usuario elige qué cuenta compartir y qué permisos recordar.",
      "step.pubkey-result.label": "Pubkey + nombre de paquete",
      "step.pubkey-result.explain":
        "El firmante devuelve la pubkey del usuario en result y su nombre de paquete en package. La app guarda ambos y dirige todas las solicitudes posteriores a ese paquete.",
      "step.sign-intent.label": "Intent sign_event",
      "step.sign-intent.explain":
        "El JSON del evento va en la URI nostrsigner:; type, un id opcional y current_user van como extras del intent.",
      "step.approve-sign.label": "Aprobar o rechazar",
      "step.approve-sign.explain":
        "El usuario aprueba o rechaza. Un rechazo vuelve como RESULT_OK con rejected = true; cualquier otro código de resultado significa que el firmante falló.",
      "step.sign-result.label": "Firma",
      "step.sign-result.explain":
        "Extras: result (la firma), id (repetido) y event (el JSON del evento firmado).",
      "step.content-resolver.label": "Consulta en segundo plano",
      "step.content-resolver.explain":
        "Para permisos recordados, la app consulta content://<package>.SIGN_EVENT con selectionArgs [payload, pubkey, current_user] y el firmante nunca se abre.",
      "step.resolver-result.label": "Fila de resultado",
      "step.resolver-result.explain":
        'Un cursor con result (y event para sign_event). null o una columna rejected significa "no recordado" o "rechazar siempre"; no recurras a un intent después de un rechazo.',
      "step.web.label": "Web: enlace nostrsigner:",
      "step.web.explain":
        'Las páginas web no pueden recibir resultados de intents, así que el firmante añade el resultado a callbackUrl o lo copia al portapapeles. compressionType gzip devuelve "Signer1" + base64(gzip(event)).',
      "how.setup.title": "Encuentra el firmante",
      "how.setup.body":
        "Una app de Android declara el esquema nostrsigner en las queries de su manifest y comprueba que alguna app maneja intents nostrsigner:.",
      "how.login.title": "Inicia sesión una vez",
      "how.login.body":
        "get_public_key devuelve la pubkey del usuario y el nombre de paquete del firmante. Las apps los guardan y no deberían volver a llamar a get_public_key mientras la sesión siga iniciada.",
      "how.intents.title": "Intents: el usuario aprueba cada vez",
      "how.intents.body":
        "Para sign_event, cifrar y descifrar con nip04/nip44, y decrypt_zap_event, la app lanza un intent; el firmante muestra un aviso y devuelve el resultado. Se pueden agrupar varias solicitudes con flags SINGLE_TOP.",
      "how.resolver.title": "Content resolver: silencioso cuando se recuerda",
      "how.resolver.body":
        'Si el usuario marcó "recordar mi elección", los mismos métodos funcionan en segundo plano mediante el content resolver, sin abrir el firmante.',
      "how.web.title": "Las páginas web usan URLs nostrsigner:",
      "how.web.body":
        "El payload es la ruta de la URL, los parámetros van en el query string y el resultado vuelve vía callbackUrl o el portapapeles. Para apps web se recomienda NIP-46 en su lugar.",
      "how.methods.title": "Métodos",
      "how.methods.body":
        "get_public_key, sign_event, nip04_encrypt, nip04_decrypt, nip44_encrypt, nip44_decrypt y decrypt_zap_event. Los métodos de cifrado reciben la pubkey de la otra parte; todos los métodos posteriores al inicio de sesión reciben current_user.",
      "related.46": "Firma remota a través de relays; recomendada para clientes web.",
      "related.07": "El equivalente en extensión de navegador para escritorio.",
      "related.44": "nip44_encrypt y nip44_decrypt producen y leen payloads NIP-44.",
      "related.42": "Las apps suelen preautorizar la firma de eventos de autenticación kind 22242.",
    },
  },
  n56: {
    title: "Reportes",
    summary:
      "Un reporte kind 1984 señala un perfil, una nota o un archivo multimedia como inapropiado, con un tipo como spam, suplantación o malware. Cualquiera puede leer los reportes; clientes y relays deciden por su cuenta si actuar, normalmente confiando en reportes de la gente a la que sigues.",
    text: {
      "event.label": "Reporte (kind 1984)",
      "event.explain":
        "Señala que un usuario, un evento o un blob es inapropiado. Qué cuenta como inapropiado lo decide quien lee el reporte.",
      content: "Información adicional opcional de quien reporta.",
      "tag.p": "El usuario reportado. Siempre obligatorio, incluso al reportar una nota.",
      "field.pubkey": "Su clave pública.",
      "tag.e": "La nota reportada, si la hay.",
      "field.event-id": "Id del evento reportado.",
      "tag.x":
        "Un archivo multimedia (blob) reportado, por su hash. Requiere un tag e para el evento que lo contiene.",
      "field.blob-hash": "SHA-256 del archivo.",
      "tag.server": "Un servidor de medios donde puede encontrarse el archivo reportado.",
      "field.server": "URL del servidor o del archivo.",
      "field.report-type":
        "Por qué se reporta. Va en la tercera posición del tag que nombra lo reportado.",
      "type.nudity": "Desnudos o pornografía.",
      "type.malware": "Virus, troyanos, spyware, ransomware y similares.",
      "type.profanity": "Lenguaje obsceno o de odio.",
      "type.illegal": "Algo que puede ser ilegal en alguna jurisdicción.",
      "type.spam": "Spam.",
      "type.impersonation": "Alguien que se hace pasar por otra persona (solo reportes de perfil).",
      "type.other": "Cualquier otra cosa.",
      "tag.L": "Un espacio de nombres de etiquetas NIP-32 para una clasificación más fina.",
      "tag.l": "Una etiqueta NIP-32 dentro de ese espacio de nombres.",
      "field.namespace": "El espacio de nombres de la etiqueta, como social.nos.ontology.",
      "field.label": "El valor de la etiqueta.",
      "example.note": "Grace reporta una nota de spam",
      "example.note.explain":
        "El tipo de reporte va en el tag e porque lo reportado es la nota; el tag p nombra a su autor.",
      "example.impersonation": "Erin reporta a un suplantador",
      "example.impersonation.explain":
        "El content nombra el perfil real con un enlace nostr:; las etiquetas NIP-32 añaden una categoría legible por máquinas.",
      "example.blob": "Dave reporta un archivo con malware",
      "example.blob.explain":
        "x nombra el archivo por su hash, e el evento que lo compartió y server dónde está alojado.",
      "how.target.title": "Di qué estás reportando",
      "how.target.body":
        "Etiqueta siempre al usuario con p. Añade un tag e para una nota concreta, o un tag x (más e) para un archivo multimedia.",
      "how.type.title": "Di por qué",
      "how.type.body":
        'Pon el tipo de reporte en la tercera posición del tag del elemento reportado: ["e", id, "spam"], ["p", pubkey, "impersonation"]. Añade etiquetas NIP-32 para dar detalle.',
      "how.blobs.title": "Reportar archivos multimedia",
      "how.blobs.body":
        "Para un archivo, el tag x contiene su hash; los tags server ayudan a los moderadores a encontrar la copia en servidores de medios.",
      "how.clients.title": "Los clientes usan reportes de gente de confianza",
      "how.clients.body":
        "Por ejemplo, si tres o más personas a las que sigues reportan un perfil por desnudos, un cliente podría difuminar sus imágenes. Los reportes de desconocidos tienen poco peso.",
      "how.relays.title": "Los relays no deberían moderar automáticamente",
      "how.relays.body":
        "Es fácil falsificar reportes en masa, así que se desaconsejan las retiradas automáticas. Los administradores de relays pueden actuar según reportes de moderadores de confianza.",
      "related.32": "Las etiquetas (tags L y l) añaden categorías estructuradas a los reportes.",
      "related.51":
        "Las listas de silenciados son la contraparte personal de los reportes públicos.",
      "related.B7": "Los servidores Blossom alojan los blobs que identifican los tags x.",
    },
  },
  n57: {
    title: "Zaps de Lightning",
    summary:
      "Los zaps son propinas Lightning registradas en Nostr. El emisor firma una solicitud de zap y se la entrega a la wallet Lightning del destinatario en lugar de publicarla; una vez pagada la factura, la wallet publica un recibo de zap para que todos vean quién hizo zap a qué.",
    text: {
      "field.recipient": "La pubkey de la persona que recibe el zap.",
      "field.event-id": "El id del evento que recibe el zap.",
      "field.address":
        "Coordenada kind:pubkey:d de un evento direccionable que recibe el zap, como un artículo.",
      "field.kind": "El kind del evento que recibe el zap, como string.",
      "request.label": "Solicitud de zap (kind 9734)",
      "request.explain":
        "Firmada por el emisor pero nunca publicada en relays. Viaja al servidor LNURL del destinatario dentro de una petición HTTP y acaba en la descripción de la factura.",
      "request.content": "Un mensaje opcional que acompaña al pago.",
      "request.tag.relays":
        "Dónde debe publicar la wallet el recibo de zap. Lista los relays directamente, sin anidar.",
      "request.field.relay": "Una URL de relay. Añade tantas como hagan falta.",
      "request.tag.amount": "El importe que el emisor pretende pagar. Recomendado.",
      "request.field.amount": 'Milisatoshis, como string (21 sats = "21000").',
      "request.tag.lnurl":
        "La URL de pago LNURL del destinatario, codificada en bech32. Recomendado.",
      "request.field.lnurl": "Un string bech32 con el prefijo lnurl.",
      "request.tag.p": "Quién recibe el zap. Exactamente uno.",
      "request.tag.e":
        "La nota que recibe el zap. Inclúyela cuando hagas zap a un evento en lugar de a una persona.",
      "request.tag.a": "El evento direccionable que recibe el zap.",
      "request.tag.k": "El kind del evento que recibe el zap.",
      "example.note-zap": "Alice hace zap a la nota del avestruz de Erin",
      "example.note-zap.explain":
        "2.100 sats (2.100.000 msats) con un comentario. El recibo irá a Alpha y Gamma.",
      "example.article-zap": "Bob hace zap al artículo de Frank",
      "example.article-zap.explain":
        "Un tag a apunta al artículo como evento direccionable, así el zap lo sigue a través de sus ediciones.",
      "receipt.label": "Recibo de zap (kind 9735)",
      "receipt.explain":
        "Lo publica la wallet del destinatario después de pagarse la factura, en los relays de la solicitud. Es lo que afirma la wallet, no una prueba de pago: confías en la wallet.",
      "receipt.content": "Vacío.",
      "receipt.tag.p": "El destinatario, copiado de la solicitud de zap.",
      "receipt.tag.P": "El emisor: la pubkey de la solicitud de zap.",
      "receipt.field.sender": "Pubkey de quien firmó la solicitud de zap.",
      "receipt.tag.e": "El evento que recibió el zap, copiado de la solicitud.",
      "receipt.tag.a": "El evento direccionable que recibió el zap, copiado de la solicitud.",
      "receipt.tag.k": "El kind del evento que recibió el zap, copiado de la solicitud.",
      "receipt.tag.bolt11":
        "La factura pagada. Su importe debe coincidir con el tag amount de la solicitud.",
      "receipt.field.bolt11":
        "Una factura BOLT11 cuyo hash de descripción se compromete con la solicitud de zap.",
      "receipt.tag.description":
        "La solicitud de zap completa, codificada en JSON. El SHA-256 de este string debería ser igual al hash de descripción de la factura.",
      "receipt.field.description": "El evento kind 9734 firmado como string JSON.",
      "receipt.tag.preimage":
        "Preimage del pago opcional. No es una prueba real: la wallet podría inventársela.",
      "receipt.field.preimage": "32 bytes, en hex.",
      "example.receipt": "La wallet de Erin confirma el zap de Alice",
      "example.receipt.explain":
        "En la vida real lo firma la nostrPubkey de la wallet; aquí la clave de demostración de Dave hace sus veces. El tag description contiene la solicitud firmada de Alice byte a byte.",
      "split.label": "Reparto de zaps (tags zap en cualquier evento)",
      "split.explain":
        "Un autor puede indicar quién debe recibir los zaps de un evento, y en qué proporción, en lugar de la dirección Lightning de su perfil.",
      "split.content": "El content normal del evento.",
      "split.tag.zap": "Un receptor de zaps para este evento. Repítelo para cada receptor.",
      "split.field.pubkey":
        "La pubkey del receptor; los clientes buscan su dirección Lightning en su perfil.",
      "split.field.relay": "Dónde encontrar el perfil kind 0 del receptor.",
      "split.field.weight":
        "Parte opcional. Los clientes suman todos los pesos y pagan a cada receptor peso/total. Sin pesos: reparto a partes iguales. Si faltan algunos pesos: los receptores sin peso no reciben nada.",
      "example.split": "Frank reparte los zaps con sus coautores",
      "example.split.explain":
        "Los pesos 2, 1, 1 significan que Frank recibe el 50 %, y Alice y Bob el 25 % cada uno.",
      "lnurlp.label": "Endpoint de pago LNURL",
      "lnurlp.explain":
        "La wallet del destinatario se describe aquí (LUD-06), resuelta a partir de su dirección lud16. allowsNostr y nostrPubkey indican que admite zaps.",
      "lnurlp.tag": 'Siempre "payRequest".',
      "lnurlp.callback": "Adónde enviar la solicitud de zap para obtener una factura.",
      "lnurlp.min": "Importe mínimo en milisatoshis.",
      "lnurlp.max": "Importe máximo en milisatoshis.",
      "lnurlp.metadata": "Metadatos LNURL, un array codificado en JSON.",
      "lnurlp.allows-nostr": "true cuando el servidor acepta solicitudes de zap.",
      "lnurlp.nostr-pubkey":
        "La clave con la que el servidor firma los recibos de zap. Los clientes rechazan los recibos firmados con cualquier otra clave.",
      "example.lnurlp": "El endpoint de la wallet de Erin",
      "example.lnurlp.explain":
        "Obtenido de https://wallet.alpha.example/.well-known/lnurlp/erin, derivado de erin@wallet.alpha.example.",
      "callback.label": "Solicitud de factura (callback)",
      "callback.explain":
        "El cliente envía la solicitud de zap firmada al callback con una petición GET y recibe una factura.",
      "callback.200": "JSON con la factura a pagar.",
      "callback.pr":
        "La factura BOLT11. Su hash de descripción se compromete con la solicitud de zap.",
      "callback.routes": "Campo LNURL heredado, normalmente vacío.",
      "callback.400":
        "La solicitud de zap no era válida (firma incorrecta, varios tags p, importe que no coincide…).",
      "example.callback": "Alice pide una factura a la wallet de Erin",
      "example.callback.explain":
        "nostr es la solicitud de zap firmada, codificada en JSON y luego para URI; amount debe ser igual a su tag amount.",
      "flow.zap.label": "Un zap de principio a fin",
      "flow.zap.explain":
        "Cuatro mensajes entre el cliente del emisor, la wallet del destinatario y los relays.",
      "flow.zap.lnurlp":
        "Resuelve la dirección Lightning del destinatario y comprueba allowsNostr y nostrPubkey.",
      "flow.zap.request": "Firma una solicitud de zap (no la publiques).",
      "flow.zap.callback": "Envíala al callback y recibe una factura; págala.",
      "flow.zap.receipt": "La wallet publica el recibo de zap en los relays solicitados.",
      "how.discover.title": "Encuentra una wallet que admita zaps",
      "how.discover.body":
        "A partir del lud16 del destinatario (o de un tag zap), el cliente obtiene el endpoint de pago LNURL. Si allowsNostr es true y nostrPubkey es una clave válida, se admiten zaps; recuerda la clave.",
      "how.request.title": "Firma una solicitud de zap",
      "how.request.body":
        "Kind 9734 con relays, amount, lnurl, p y opcionalmente e, a o k. La firma el emisor pero no se publica.",
      "how.invoice.title": "Obtén una factura para ella",
      "how.invoice.body":
        "El cliente llama al callback con amount, nostr (la solicitud) y lnurl. El servidor valida la solicitud (un p, como mucho un e, importe coincidente) y devuelve una factura cuya descripción es exactamente esa solicitud.",
      "how.receipt.title": "La wallet publica el recibo",
      "how.receipt.body":
        "Cuando se paga la factura, la wallet firma un kind 9735 con el bolt11, la solicitud en description y copias de p, P, e, a y k, y lo publica en los relays solicitados.",
      "how.validate.title": "Los clientes verifican los recibos",
      "how.validate.body":
        "Un recibo solo cuenta si está firmado por la nostrPubkey del destinatario y el importe de la factura coincide con el tag amount de la solicitud. Luego los clientes muestran el emisor y el comentario a partir de la solicitud incluida.",
      "how.split.title": "Reparte zaps entre personas",
      "how.split.body":
        "Los tags zap de un evento redirigen sus zaps a una o más pubkeys con pesos opcionales.",
      "related.01": "Las solicitudes y los recibos son eventos firmados normales.",
      "related.47": "Los clientes suelen pagar las facturas de zaps mediante Nostr Wallet Connect.",
      "related.53": "Las transmisiones en vivo reciben zaps.",
      "related.75": "Las metas de zaps reúnen zaps hacia un importe objetivo.",
    },
  },
  n58: {
    title: "Insignias",
    summary:
      "Cualquiera puede diseñar una insignia y otorgarla a otras personas. Las concesiones son permanentes y no se pueden transferir, pero cada destinatario elige qué insignias mostrar en su perfil y en qué orden, y puede agruparlas en conjuntos.",
    text: {
      "content.empty": "Vacío. Todo está en los tags.",
      "field.badge":
        "Coordenada 30009:<pubkey del emisor>:<d de la insignia> de una definición de insignia.",
      "field.badge-or-set":
        "Una definición de insignia (30009) o un conjunto de insignias (30008).",
      "field.award": "Id del evento de concesión kind 8.",
      "field.relay": "Pista de relay opcional.",
      "field.dimensions": "Tamaño opcional como <ancho>x<alto> en píxeles, por ejemplo 1024x1024.",
      "list.tag.a": "La insignia que se muestra. Debe ir seguida de su tag e correspondiente.",
      "list.tag.e":
        "La concesión que dio esta insignia al usuario. Forma pareja con el tag a justo anterior.",
      "definition.label": "Definición de insignia (kind 30009)",
      "definition.explain":
        "La crea el emisor. Es direccionable, así que el emisor puede actualizar la imagen o la descripción más adelante.",
      "definition.tag.d": "Nombre único de la insignia para este emisor.",
      "definition.field.d": 'Como "bravery" o "first-relay".',
      "definition.tag.name": "Nombre corto para mostrar.",
      "definition.field.name": 'Como "Medalla al valor".',
      "definition.tag.description": "Qué significa la insignia o por qué se otorga.",
      "definition.field.description": "Texto libre.",
      "definition.tag.image": "La imagen a tamaño completo (se recomienda 1024x1024, cuadrada).",
      "definition.field.image": "URL de la imagen.",
      "definition.tag.thumb":
        "Versiones más pequeñas de la imagen. Tamaños recomendados: 512, 256, 64, 32 y 16 píxeles, cuadradas.",
      "definition.field.thumb": "URL de la miniatura.",
      "example.definition": 'Alice crea la insignia "Primer relay"',
      "example.definition.explain":
        "Dos miniaturas permiten a los clientes elegir el tamaño adecuado al mostrar muchas insignias.",
      "award.label": "Concesión de insignia (kind 8)",
      "award.explain":
        "Otorga una insignia a una o más personas. Las concesiones son inmutables e intransferibles.",
      "award.tag.a": "Qué insignia se otorga. Exactamente una.",
      "award.tag.p": "Un destinatario. Un tag por persona.",
      "award.field.p": "La pubkey del destinatario.",
      "example.award": "Alice otorga la insignia a Bob y a Grace",
      "example.award.explain":
        "Fírmalo para obtener el id de concesión al que apuntan las insignias de perfil de Bob.",
      "profile.label": "Insignias de perfil (kind 10008)",
      "profile.explain":
        "La selección propia del destinatario de insignias a mostrar, en orden. Una lista estándar de NIP-51; las insignias que no estén aquí no se muestran.",
      "example.profile": "Bob muestra su insignia",
      "example.profile.explain":
        "Una pareja a/e: la definición de la insignia y luego la concesión que nombra a Bob. Los clientes ignoran una a sin su e y viceversa.",
      "set.label": "Conjunto de insignias (kind 30008)",
      "set.explain":
        'Un conjunto NIP-51 que agrupa insignias aceptadas bajo una etiqueta, como "Conferencias" o "Comunidad".',
      "set.tag.d": "Identificador del conjunto.",
      "set.field.d": "Un nombre para este grupo de insignias.",
      "legacy.label": "Obsoleto: insignias de perfil como kind 30008",
      "legacy.explain":
        'Una versión anterior guardaba las insignias de perfil como un conjunto kind 30008 con d "profile_badges". Los clientes lo tratan como kind 10008 y lo migran.',
      "set.tag.d-legacy":
        "El antiguo identificador fijo. Obsoleto: publica en su lugar un evento de insignias de perfil kind 10008.",
      "set.field.d-legacy": 'Siempre "profile_badges".',
      "set.tag.title": "Título visible del conjunto.",
      "set.field.title": "Texto libre.",
      "example.set": "Las insignias de comunidad de Bob",
      "example.legacy": "Insignias de perfil al estilo antiguo",
      "example.legacy.explain":
        "El editor señala el tag d obsoleto. Los clientes deberían leerlo como kind 10008 y volver a publicarlo en el formato nuevo.",
      "flow.badge.label": "Del diseño a la exhibición",
      "flow.badge.explain": "El emisor define y otorga; el destinatario decide si la muestra.",
      "flow.badge.define": "El emisor publica una definición de insignia.",
      "flow.badge.award": "El emisor la otorga a una o más pubkeys.",
      "flow.badge.accept": "Un destinatario añade la pareja a/e a sus insignias de perfil.",
      "how.define.title": "Define la insignia",
      "how.define.body":
        "El emisor publica kind 30009 con un tag d y, opcionalmente, nombre, descripción, imagen y miniaturas.",
      "how.award.title": "Otórgala",
      "how.award.body":
        "Un evento kind 8 nombra la insignia con un tag a y a cada destinatario con un tag p. No se puede revocar ni transferir.",
      "how.accept.title": "Los destinatarios eligen qué mostrar",
      "how.accept.body":
        "Recibir una insignia no es lo mismo que mostrarla. El usuario lista las insignias aceptadas como parejas a/e ordenadas en sus insignias de perfil kind 10008.",
      "how.sets.title": "Agrupa insignias en conjuntos",
      "how.sets.body":
        "Los conjuntos de insignias kind 30008 agrupan parejas bajo un título; las insignias de perfil también pueden apuntar a conjuntos enteros con un tag a.",
      "how.display.title": "Muéstralas con cuidado",
      "how.display.body":
        "Los clientes pueden mantener una lista blanca de emisores de confianza, mostrar menos insignias de las listadas, elegir miniaturas que encajen en el espacio y cargar la imagen completa al tocar o pasar el ratón.",
      "related.51": "Las insignias de perfil y los conjuntos de insignias son listas NIP-51.",
      "related.01":
        "Las definiciones y los conjuntos son direccionables; las concesiones son eventos normales.",
    },
  },
  n59: {
    title: "Gift Wrap",
    summary:
      "Oculta quién habla con quién anidando un evento en dos sobres cifrados. Un rumor sin firmar va dentro de un seal firmado por el autor real, y el seal va dentro de un gift wrap firmado por una clave desechable, así los relays solo ven un emisor aleatorio y al destinatario.",
    text: {
      "rumor.label": "Rumor (cualquier kind, sin firmar)",
      "rumor.explain":
        "El evento real, con pubkey e id pero sin firma. Si llegara a filtrarse no se podría verificar, lo que da al autor cierta negabilidad.",
      "rumor.content":
        "Lo que contenga el kind del evento interno: un mensaje de chat, una reacción, lo que sea.",
      "example.rumor": "El mensaje de Alice para Bob",
      "example.rumor.explain":
        "Calcular el id está permitido (y se espera); firmar no. Esta es la única capa con la marca de tiempo real.",
      "seal.label": "Seal (kind 13)",
      "seal.explain":
        "Envuelve el rumor, cifrado para el destinatario y firmado por el autor real. Información pública: solo quién lo firmó. Sin destinatario y sin tags, salvo un expiration opcional.",
      "seal.content": "Payload NIP-44 desde la clave del autor hacia la clave del destinatario.",
      "seal.tag.expiration":
        "Expiración NIP-40 opcional. NIP-59 dice que los tags del seal deben estar vacíos, pero NIP-17 dice que los mensajes efímeros DEBERÍAN repetir en el seal la expiración del gift wrap por si el seal se filtra. Usa una hora aleatoria distinta de la del wrap para que no se puedan relacionar las dos capas.",
      "seal.field.expiration": "Hora Unix a partir de la cual el seal debería borrarse.",
      "seal.plaintext": "El rumor como JSON.",
      "seal.plaintext.rumor":
        "Un evento sin firmar. Un seal nunca debe contener un evento firmado.",
      "example.seal": "Alice sella su rumor para Bob",
      "example.seal.explain":
        "La clave de demostración de Bob descifra el content y obtiene el rumor de Alice. Su created_at es una hora anterior al del rumor para difuminar los tiempos.",
      "wrap.label": "Gift wrap (kind 1059 o 21059)",
      "wrap.explain":
        "Envuelve el seal, cifrado para el destinatario y firmado por una clave aleatoria de un solo uso. Solo el tag p dice adónde va. 21059 es la variante efímera que los relays no guardan.",
      "wrap.content": "Payload NIP-44 desde la clave de un solo uso hacia el destinatario.",
      "wrap.plaintext": "El seal firmado como JSON.",
      "wrap.plaintext.seal": "Un seal kind 13 firmado.",
      "wrap.tag.p":
        "El destinatario, para que los relays puedan encaminar el wrap. El único vínculo visible con alguien.",
      "wrap.field.p": "Pubkey del destinatario.",
      "wrap.field.relay": "Pista de relay opcional.",
      "wrap.tag.expiration":
        "Expiración NIP-40 opcional, con su propia marca de tiempo aleatoria en cada capa.",
      "wrap.field.expiration": "Segundos Unix.",
      "wrap.tag.nonce": "Prueba de trabajo NIP-13 opcional, para mostrar que el wrap no es spam.",
      "wrap.field.nonce": "El nonce minado.",
      "wrap.field.target": "Dificultad objetivo en bits cero iniciales.",
      "example.wrap": "El wrap entregado a Bob",
      "example.wrap.explain":
        "La clave de demostración de Grace hace de clave aleatoria de un solo uso que los clientes reales generan para cada wrap. Descífralo como Bob para encontrar el seal de Alice.",
      "example.ephemeral": "Wrap efímero (kind 21059)",
      "example.ephemeral.explain":
        "La misma estructura, para usos en tiempo real como chat en vivo o juegos, donde nadie necesita el mensaje después.",
      "flow.wrap.label": "Envolver un mensaje",
      "flow.wrap.explain": "Tres capas, construidas de dentro hacia fuera.",
      "flow.wrap.rumor": "Escribe el evento y quítale la firma: un rumor.",
      "flow.wrap.seal": "Cífralo para el destinatario y fírmalo tú: un seal.",
      "flow.wrap.wrap":
        "Cifra el seal con una clave aleatoria nueva, etiqueta al destinatario y firma con esa clave: un gift wrap.",
      "how.rumor.title": "Empieza con un rumor",
      "how.rumor.body":
        "Crea el evento real pero no lo firmes. Su created_at es la hora canónica del mensaje.",
      "how.seal.title": "Séllalo",
      "how.seal.body":
        "Codifica el rumor en JSON, cífralo con NIP-44 desde tu clave hacia la del destinatario y ponlo en un kind 13 con tags vacíos, firmado por ti. El seal demuestra la autoría solo ante el destinatario.",
      "how.wrap.title": "Envuélvelo",
      "how.wrap.body":
        "Genera una clave de un solo uso, cifra con ella el seal para el destinatario con NIP-44 y publica un kind 1059 con un tag p para el destinatario, firmado por la clave de un solo uso. Los observadores no pueden saber quién lo envió.",
      "how.timestamps.title": "Difumina las marcas de tiempo",
      "how.timestamps.body":
        "Las marcas de tiempo del seal y del wrap deberían aleatorizarse hacia el pasado (hasta dos días), de forma independiente, para que no se puedan asociar al momento del envío.",
      "how.deliver.title": "Entrega selectiva",
      "how.deliver.body":
        "Envía el wrap solo a los relays de lectura del destinatario, idealmente a los que exigen AUTH de NIP-42 y sirven kind 1059 solo al destinatario etiquetado. Para varios destinatarios, envuelve por separado para cada uno, incluida una copia para ti.",
      "how.unwrap.title": "Desenvuelve",
      "how.unwrap.body":
        "El destinatario descifra el wrap para obtener el seal, comprueba la firma del seal, lo descifra para obtener el rumor y comprueba que la pubkey del rumor coincide con la del seal.",
      "related.44": "Ambas capas usan cifrado NIP-44.",
      "related.17": "Los mensajes directos privados son rumors kind 14 envueltos en gift wraps.",
      "related.42": "Los relays pueden exigir AUTH antes de aceptar o servir gift wraps.",
      "related.13": "La prueba de trabajo puede encarecer el spam de wraps anónimos.",
      "related.40": "Cada capa puede llevar su propia expiración.",
      "related.62":
        "Las solicitudes de desaparición hacen que los relays borren los wraps dirigidos a quien lo solicita.",
    },
  },
};
