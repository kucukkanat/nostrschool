// Owner: translation agents. Must structurally match ../en/common.ts (enforced by the type).
// Neutral Latin-American/European Spanish, informal "tú". "Nostr School" stays as the brand name.
import type { common as en } from "../en/common.ts";

export const common: typeof en = {
  site: {
    name: "Nostr School",
    tagline: "Aprende Nostr experimentando con lo de verdad.",
    description:
      "Un curso interactivo sobre el protocolo Nostr: claves, eventos, relays, filtros, zaps y más, funcionando en vivo en tu navegador.",
  },
  nav: {
    home: "Inicio",
    learn: "Aprender",
    tools: "Herramientas",
    glossary: "Glosario",
    skipToContent: "Saltar al contenido",
    primary: "Navegación principal",
    language: "Idioma",
    menu: "Menú",
    close: "Cerrar",
  },
  theme: {
    label: "Tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  },
  live: {
    label: "Modo en vivo",
    on: "EN VIVO",
    off: "Ejemplos",
    description: "Lee eventos reales de relays públicos. Nunca publicamos nada.",
    enabled: "Modo en vivo activado: leyendo de relays públicos.",
    disabled: "Modo en vivo desactivado: usando datos de ejemplo integrados.",
  },
  chapter: {
    chapter: "Capítulo {n}",
    minutes: "{n} min",
    nips: "NIPs",
    takeaways: "Lo esencial",
    previous: "Anterior",
    next: "Siguiente",
    complete: "Marcar capítulo como completado",
    completed: "Completado",
    progress: "Progreso del curso",
    notTranslated: "Este capítulo aún no está traducido, así que se muestra en inglés.",
  },
  learn: {
    title: "Curso",
    intro: "Doce capítulos cortos. Cada uno tiene un interactivo práctico.",
    start: "Empezar a aprender",
    continue: "Continuar",
  },
  tools: {
    title: "Herramientas",
    intro: "Versiones independientes de los interactivos del curso.",
    keys: "Herramienta de claves",
    eventInspector: "Inspector de eventos",
    filterPlayground: "Laboratorio de filtros",
    kinds: "Tabla de kinds",
  },
  glossary: {
    title: "Glosario",
    intro: "Todos los términos de Nostr que usamos en este sitio.",
    search: "Buscar términos",
    seeAlso: "Ver también",
    noResults: "Ningún término coincide.",
    filterByChapter: "Filtrar por capítulo",
    jumpTo: "Ir a la letra",
    taughtIn: "Se enseña en",
  },
  notFound: {
    title: "Página no encontrada",
    body: "Esta página se fue de paseo. Quizá estaba en un relay que se desconectó.",
    home: "Volver al inicio",
  },
  safety: {
    demoKeys:
      "Solo claves de demostración. Nunca pegues tu nsec real en ningún sitio web, tampoco en este.",
  },
  footer: {
    source: "Código fuente",
    license: "Licencia",
    builtWith: "Hecho con Astro y Svelte",
  },
  home: {
    eyebrow: "Un curso de Nostr divertido y práctico",
    title: "Aprende Nostr experimentando con lo de verdad",
    lead: "Genera claves, firma eventos y mira cómo vuelan los paquetes entre relays. Criptografía real, funcionando aquí mismo en tu navegador.",
    ctaTools: "Explorar las herramientas",
    ctaContinue: "Continuar: {title}",
    mascotHello: "¡Hola, soy Nos! Aprendamos Nostr juntos.",
    networkTitle: "Una red Nostr",
    networkDescription:
      "Cinco personas se conectan cada una a varios relays independientes. Los mensajes saltan de las personas a los relays y de vuelta, y ningún servidor manda sobre los demás.",
    pause: "Pausar animación",
    play: "Reproducir animación",
    featuresTitle: "Cómo funciona Nostr School",
    features: [
      {
        title: "Criptografía real, en vivo",
        body: "Cada clave, hash y firma se calcula en tu navegador con el mismo código que usan los clientes reales.",
      },
      {
        title: "Primero, palabras sencillas",
        body: "Cada idea empieza en lenguaje sencillo. Abre un cajón «Bajo el capó» cuando quieras ver el JSON y los NIPs.",
      },
      {
        title: "Datos de ejemplo o relays en vivo",
        body: "Las lecciones usan datos de ejemplo amigables. Activa el modo en vivo para leer eventos reales de relays públicos.",
      },
    ],
    mapTitle: "Tu mapa del curso",
    mapIntro:
      "Doce paradas, desde por qué existe Nostr hasta sus compromisos honestos. Empieza donde quieras; recordamos los capítulos que terminas.",
    toolsTitle: "Herramientas para experimentar",
    toolsIntro:
      "Los interactivos del curso también funcionan por separado. Útil cuando solo necesitas revisar un evento.",
  },
  progress: {
    completedCount: "{done} de {total} capítulos completados",
    done: "Hecho",
    current: "A continuación",
    upcoming: "Sin empezar",
    markIncomplete: "Marcar como no hecho",
    celebrate: "¡Capítulo completado! Buen trabajo.",
    allDone: "¡Terminaste todo el curso!",
    reading: "Progreso de lectura",
    showChapters: "Mostrar capítulos",
    hideChapters: "Ocultar capítulos",
  },
  toolCards: {
    keys: "Genera pares de claves de demostración y convierte entre hex, npub, nsec y compañía.",
    eventInspector:
      "Pega el JSON de cualquier evento: comprobamos su id y su firma y explicamos cada campo.",
    filterPlayground:
      "Construye un filtro REQ y mira qué eventos coinciden, con ejemplos o con relays en vivo.",
    kinds: "Una tabla periódica con buscador de los kinds de eventos y los NIPs que los definen.",
    glossary: "Todos los términos de Nostr de este sitio, en palabras sencillas.",
    open: "Abrir",
  },
  shell: {
    readOnly: "El modo en vivo es de solo lectura: nunca publicamos nada en los relays.",
    footerNav: "Pie de página",
    ogImageAlt: "Nostr School: aprende Nostr experimentando con lo de verdad",
  },
};
