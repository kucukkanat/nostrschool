// Owner: translation agents. Must structurally match ../../en/chapters/12.ts.
import type { ch12 as en } from "../../en/chapters/12.ts";

export const ch12: typeof en = {
  title: "Ventajas y desventajas",
  summary: "Spam, descubrimiento, economía de los relays y pérdida de claves: una mirada honesta.",
  platforms: {
    nostr: "Nostr",
    x: "X",
    mastodon: "Mastodon",
    bluesky: "Bluesky",
  },
  ratings: {
    good: "Fuerte",
    mixed: "Regular",
    poor: "Débil",
  },
  matrix: {
    title: "La comparativa sin maquillaje",
    intro:
      "Marca lo que te importa y mira cómo cambia el ranking. Toca cualquier celda para leer por qué recibió esa nota.",
    tableCaption: "Cómo se comparan Nostr, X, Mastodon y Bluesky, criterio por criterio",
    criterionHeader: "Lo que te importa",
    prioritiesLabel: "¿Qué te importa?",
    prioritiesHint: "Los criterios marcados cuentan cuatro veces más.",
    presetsLabel: "O prueba un perfil",
    presets: {
      balanced: "Equilibrado",
      dissident: "Periodista bajo presión",
      casual: "Solo charlar con amigos",
      builder: "Desarrollador de apps",
    },
    rankingTitle: "Tu ranking",
    scoreLabel: "{platform}: {score} de 100",
    noWinner:
      "¿Ves cómo cambia el ganador según tus prioridades? Esa es la respuesta honesta: no existe la mejor red, solo ventajas y desventajas.",
    nostrLeads: "Con tus prioridades, Nostr queda en primer lugar.",
    otherLeads:
      "Con tus prioridades, {platform} queda en primer lugar. Nostr no es para todo el mundo, ¡y está bien!",
    cellLabel: "{criterion} en {platform}: {rating}. Ver por qué.",
    detailEmpty: "Elige una celda de la tabla para ver el razonamiento.",
    detailTitle: "{criterion} · {platform}",
    criteria: {
      identity: "Tu identidad es tuya",
      censorship: "Difícil de silenciar",
      portability: "Llévate a tus seguidores a donde quieras",
      spam: "Defensa contra el spam",
      discovery: "Encontrar personas y publicaciones",
      moderation: "Tú eliges tu moderación",
      availability: "Tus publicaciones siguen en línea",
      recovery: "Recuperar la cuenta",
      openness: "Cualquiera puede crear una app",
    },
    notes: {
      identity: {
        nostr:
          "Tu identidad es un par de claves que generaste tú. Ninguna empresa ni servidor te la puede quitar.",
        x: "La cuenta es de X. Tu nombre de usuario y tus seguidores solo existen dentro de la base de datos de X.",
        mastodon:
          "Tu identidad es nombre@instancia. Está atada al dominio del servidor, así que en última instancia la controla el administrador.",
        bluesky:
          "Las cuentas son DIDs y el nombre de usuario puede ser tu propio dominio, pero la mayoría de los DIDs son did:plc, un directorio que gestiona Bluesky.",
      },
      censorship: {
        nostr:
          "Nadie controla todos los relays. Si un relay te bloquea, simplemente publicas en otro.",
        x: "Una sola empresa decide quién puede hablar, en todo el mundo, con un solo interruptor.",
        mastodon:
          "Cada instancia modera a sus propios usuarios y puede bloquear otras instancias por completo.",
        bluesky:
          "El protocolo es abierto, pero hoy casi todo el mundo usa la app view, el relay y la moderación de Bluesky.",
      },
      portability: {
        nostr:
          "Tus seguidores siguen tu clave, no un servidor. Cambias de relays y te siguen encontrando.",
        x: "Puedes descargar un archivo con tus datos, pero tus seguidores no pueden irse contigo.",
        mastodon:
          "Al mudar la cuenta se redirige a tus seguidores, pero tus publicaciones antiguas se quedan atrás y el servidor anterior tiene que colaborar.",
        bluesky:
          "Las cuentas pueden mudarse entre servidores de alojamiento (PDS) con seguidores y publicaciones, usando las claves de rotación de tu DID.",
      },
      spam: {
        nostr:
          "No hay un equipo central contra el spam. La defensa depende de relays y clientes: proof-of-work, relays de pago, filtros de red de confianza.",
        x: "Un gran equipo central de confianza y seguridad, más algoritmos, pero los bots siguen siendo un problema conocido.",
        mastodon:
          "Moderan administradores voluntarios. Las instancias pequeñas pueden verse desbordadas por oleadas de spam.",
        bluesky:
          "Moderación central más etiquetadores (labelers) de terceros que puedes sumar a tu gusto.",
      },
      discovery: {
        nostr:
          "No hay un índice global. Los relays de búsqueda y los feeds personalizados ayudan, pero encontrar gente sigue siendo más difícil que en las grandes plataformas.",
        x: "Un potente algoritmo de recomendación te muestra contenido (te gusten o no sus elecciones).",
        mastodon:
          "Mayormente cronológico; la búsqueda y el descubrimiento dependen de lo que conozca tu instancia.",
        bluesky: "Un índice central más miles de feeds personalizados que cualquiera puede crear.",
      },
      moderation: {
        nostr:
          "La moderación la eligen el cliente y los relays: listas de silenciados, reportes, filtros que tú escoges.",
        x: "Una sola política para todos, fijada por la empresa. No puedes cambiarla.",
        mastodon:
          "Eliges una instancia cuyas reglas te gusten; las decisiones del administrador se aplican a ti.",
        bluesky: "Bluesky modera, y tú puedes añadir encima más etiquetadores y listas de bloqueo.",
      },
      availability: {
        nostr:
          "Las publicaciones viven mientras algún relay las guarde. Los relays gratuitos pueden borrar datos antiguos; nadie garantiza que sea para siempre.",
        x: "Muy fiable mientras la empresa exista y mantenga tu cuenta activa.",
        mastodon: "Tus datos viven en un solo servidor. Si cierra sin avisar, se pierden.",
        bluesky: "Alojamiento fiable hoy; además, tu repositorio se puede exportar y mudar.",
      },
      recovery: {
        nostr:
          "Si pierdes tu clave privada, la cuenta desaparece. No existe el botón de '¿olvidaste tu contraseña?'.",
        x: "Restableces por correo o teléfono. La empresa siempre puede devolverte el acceso.",
        mastodon: "El administrador de tu instancia puede restablecer tu contraseña por correo.",
        bluesky:
          "Restableces la contraseña por correo; tu proveedor de alojamiento gestiona las claves de firma por ti.",
      },
      openness: {
        nostr: "Protocolo abierto, sin pedir permiso: cientos de clientes y relays independientes.",
        x: "Una API cerrada y de pago que la empresa puede cambiar o revocar cuando quiera.",
        mastodon:
          "Protocolo abierto ActivityPub; cualquiera puede montar un servidor o crear una app.",
        bluesky:
          "Protocolo abierto AT Protocol; cualquiera puede crear apps, feeds y etiquetadores.",
      },
    },
  },
  scenarios: {
    title: "¿Qué podría salir mal?",
    intro:
      "Activa algunos días malos y mira cómo responde cada red. Después activa las precauciones de Nostr y observa qué cambia.",
    whatIfLabel: "¿Y si…",
    prepLabel: "Precauciones en Nostr",
    prepHint:
      "Solo cambian la columna de Nostr: las otras redes resuelven estos problemas por ti (o no).",
    allClear: "Todavía no ha salido nada mal. ¡Activa un interruptor de '¿y si…'!",
    overall: "En general: {severity}",
    narration: "Nostr: {nostr}. X: {x}. Mastodon: {mastodon}. Bluesky: {bluesky}.",
    severities: {
      fine: "Nada grave",
      bumpy: "Molesto",
      ouch: "Doloroso",
      disaster: "Desastre",
    },
    items: {
      lostKey: {
        label: "Pierdo mi contraseña o mi clave privada",
        description: "Tu computadora portátil se muere y nunca anotaste nada.",
      },
      keyLeak: {
        label: "Alguien me roba la clave o la contraseña",
        description: "Pegaste tu secreto en una web de dudosa reputación.",
      },
      relayBan: {
        label: "Mi relay o servidor me bloquea",
        description: "Quien lo opera decide que no te quiere allí.",
      },
      serverGone: {
        label: "Mi relay o servidor cierra",
        description: "El voluntario que lo mantenía se va, o se acaba el dinero.",
      },
      spamFlood: {
        label: "El spam inunda mis respuestas",
        description: "Un ejército de bots descubre tus publicaciones.",
      },
    },
    preps: {
      backup: {
        label: "Hice una copia de seguridad de mi clave",
        description: "Anotada en un lugar seguro, o guardada cifrada como ncryptsec (NIP-49).",
      },
      multiRelay: {
        label: "Publico en varios relays",
        description: "Mi lista de relays (NIP-65) le dice a todo el mundo dónde encontrarme.",
      },
      wot: {
        label: "Mi cliente filtra por red de confianza",
        description:
          "Solo la gente a la que siguen mis seguidos puede llegar a mis notificaciones.",
      },
    },
    outcomes: {
      nostr: {
        lostKey:
          "Tu identidad se perdió para siempre. Crea una clave nueva y pide a todos que la sigan.",
        lostKeyBackup: "Restauras desde tu copia de seguridad y sigues como si nada. ¡Uf!",
        keyLeak:
          "El ladrón puede publicar como tú para siempre. No hay una forma estándar de rotar una clave: tienes que empezar de cero y avisar a tus seguidores.",
        relayBan:
          "Tus notas desaparecen de ese relay. Los seguidores que solo leían ahí te pierden la pista.",
        relayBanMulti:
          "Ni te inmutas. Tus otros relays siguen llevando tus notas y tu lista de relays apunta a la gente hacia ellos.",
        serverGone:
          "Las notas guardadas solo en ese relay se pierden, pero tu identidad y tus seguidos sobreviven.",
        serverGoneMulti: "Tus notas ya viven en otros relays. Apenas se nota.",
        spamFlood:
          "Ningún equipo central contra el spam vendrá a salvarte. Tu cliente y tus relays tienen que filtrarlo.",
        spamFloodWot:
          "Los desconocidos fuera de tu red de confianza quedan filtrados. Vuelve la calma.",
      },
      x: {
        lostKey: "Restableces por correo o teléfono. La empresa te devuelve el acceso.",
        keyLeak:
          "Cambias la contraseña, cierras las demás sesiones y recuperas la cuenta a través de soporte.",
        relayBan:
          "Suspendido. Tus publicaciones, seguidores y nombre de usuario desaparecen, y solo hay una empresa ante la que apelar.",
        serverGone: "Si X desaparece o te deja fuera, todo tu grafo social se va con él.",
        spamFlood: "Los filtros centrales atrapan mucho spam, aunque no puedes ajustarlos.",
      },
      mastodon: {
        lostKey: "El administrador de tu instancia restablece tu contraseña por correo.",
        keyLeak:
          "Cambias la contraseña; el administrador puede bloquear la cuenta y ayudarte a recuperarla.",
        relayBan:
          "Suspendido en tu instancia. Mudar a tus seguidores normalmente requiere la colaboración de la cuenta anterior.",
        serverGone:
          "Si la instancia cierra antes de que te mudes, tu cuenta y tus publicaciones se pierden.",
        spamFlood:
          "Tu administrador modera, pero las instancias pequeñas llevadas por voluntarios pueden verse desbordadas.",
      },
      bluesky: {
        lostKey:
          "Restableces la contraseña por correo; tu servidor de alojamiento gestiona las claves.",
        keyLeak:
          "Restableces la contraseña; tu proveedor y tus claves de recuperación te permiten recuperar el control.",
        relayBan:
          "Puedes mudarte a otro proveedor con tu DID, pero una retirada por parte de la moderación de Bluesky te sigue ocultando en la app principal.",
        serverGone:
          "Mudarte a otro proveedor es posible con tu clave de recuperación y una copia de tus datos.",
        spamFlood:
          "La moderación central más los etiquetadores a los que te suscribes mantienen alejado casi todo.",
      },
    },
    mascot: {
      calm: "¡Por ahora, todo bien!",
      worried: "Mmm, esa duele…",
      panic: "¡Ay! ¡Nostr no tiene botón de deshacer para eso!",
      prepared: "¡Un nostrich precavido sobrevive a casi todo!",
    },
  },
  pow: {
    title: "Mina una nota, frena a un spammer",
    intro:
      "El proof-of-work hace que cada nota cueste un poco de esfuerzo de cómputo. Elige una dificultad y deja que tu navegador busque un id que empiece con suficientes bits en cero.",
    contentLabel: "Texto de la nota",
    defaultContent: "¡Hola desde Nostr School!",
    difficultyLabel: "Dificultad (bits iniciales en cero)",
    difficultyValue: "{bits} bits ≈ {attempts} intentos de media",
    mine: "Empezar a minar",
    stop: "Detener",
    reset: "Reiniciar",
    attempts: "Intentos",
    bestBits: "Mejor hasta ahora",
    rate: "Hashes por segundo",
    nonce: "Nonce",
    currentId: "Id actual",
    bestId: "Mejor id hasta ahora",
    bitsValue: "{bits} bits",
    idle: "Listo. Pulsa “Empezar a minar” para comenzar.",
    mining: "Minando… {attempts} intentos, el mejor tiene {bits} bits en cero.",
    found:
      "¡Encontrado tras {attempts} intentos! El nonce {nonce} da {bits} bits iniciales en cero.",
    stopped: "Detenido tras {attempts} intentos.",
    zeroBitsHint: "Los bits en cero aparecen resaltados. Cada 0 hexadecimal vale 4 bits.",
    signedTitle: "Tu nota minada y firmada",
    spamTitle: "¿Cuánto pagaría un spammer?",
    spamBody:
      "A {rate} hashes por segundo, una nota te cuesta unos {one}. Un spammer que publique {count} notas necesitaría unos {total}.",
    units: {
      ms: "{value} ms",
      s: "{value} segundos",
      min: "{value} minutos",
      h: "{value} horas",
      d: "{value} días",
      y: "{value} años",
    },
    caveat:
      "La trampa: los teléfonos pagan el mismo precio que las granjas de spam con computadoras rápidas, así que los relays rara vez exigen dificultades muy altas.",
  },
  complete: {
    title: "¡Te graduaste en Nostr School!",
    body: "Doce capítulos, desde “¿por qué?” hasta “¿dónde está la trampa?”. Ahora sabes más de Nostr que la mayoría de quienes lo usan.",
    progress: "Has marcado {done} de {total} capítulos como completados.",
    celebrate: "¡A celebrar!",
    celebrated: "Confeti lanzado. Bien merecido.",
    mascotSay: "¡Felicidades, colega nostrich! Terminaste el curso.",
    nextTitle: "¿Y ahora qué?",
    toolsTitle: "Sigue practicando",
    resourcesTitle: "Profundiza",
    tools: {
      keys: "Herramienta de claves",
      inspector: "Inspector de eventos",
      filters: "Laboratorio de filtros",
      kinds: "Tabla de kinds",
      glossary: "Glosario",
    },
    resources: {
      nips: {
        label: "El repositorio de NIPs",
        hint: "Las especificaciones del protocolo, directamente de la fuente.",
      },
      nostrTools: {
        label: "nostr-tools",
        hint: "La biblioteca de JavaScript que usa este curso.",
      },
      nostrCom: {
        label: "nostr.com",
        hint: "Una introducción amigable con enlaces a clientes.",
      },
      nostrHow: { label: "nostr.how", hint: "Guías paso a paso para empezar." },
      awesome: {
        label: "awesome-nostr",
        hint: "Una enorme lista de proyectos hecha por la comunidad.",
      },
    },
    externalHint: "(se abre en una pestaña nueva)",
  },
  quiz: {
    q1: {
      question: "¿Qué mide realmente el proof-of-work de NIP-13?",
      options: {
        a: {
          label: "Cuántos seguidores tiene el autor",
          explanation: "No: el PoW no sabe nada de seguidores.",
        },
        b: {
          label: "La cantidad de bits iniciales en cero del id del evento",
          explanation:
            "¡Correcto! Quien mina ajusta una etiqueta nonce hasta que el hash del id empiece con suficientes bits en cero.",
        },
        c: {
          label: "Cuánto tardó el relay en guardar la nota",
          explanation:
            "No exactamente. El trabajo lo hace quien crea el evento, antes de enviarlo.",
        },
      },
    },
    q2: {
      question: "Tu único relay te bloquea. ¿Qué le pasa a tu identidad en Nostr?",
      options: {
        a: {
          label: "Nada: tu clave sigue funcionando, solo publicas en otros relays",
          explanation: "Exacto. Los relays guardan notas; no son dueños de tu identidad.",
        },
        b: {
          label: "Se borra de toda la red",
          explanation: "Ningún relay por sí solo puede borrarte de toda la red.",
        },
        c: {
          label: "Tienes que pedirle al relay que te devuelva la contraseña",
          explanation: "No hay contraseña: tu identidad es tu par de claves, y solo tú las tienes.",
        },
      },
    },
    q3: {
      question: "Alguien te roba la nsec. ¿Cuál es la respuesta honesta?",
      options: {
        a: {
          label: "Pulsar “restablecer contraseña”",
          explanation:
            "Nostr no tiene restablecimiento de contraseña: no hay ningún servidor que pueda hacerlo.",
        },
        b: {
          label: "Los relays bloquearán al ladrón automáticamente",
          explanation:
            "Los relays no pueden distinguirte del ladrón: ambos generan firmas válidas.",
        },
        c: {
          label:
            "Todavía no hay una rotación de claves estándar: creas una clave nueva y avisas a tus seguidores",
          explanation:
            "Correcto, y es uno de los mayores problemas abiertos de Nostr. Protege tu clave, idealmente dentro de un firmante.",
        },
      },
    },
  },
};
