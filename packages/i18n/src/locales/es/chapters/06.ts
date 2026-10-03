// Owner: translation agents. Must structurally match ../../en/chapters/06.ts.
import type { ch06 as en } from "../../en/chapters/06.ts";

// "Kind" stays untranslated: it's how the Spanish-speaking Nostr community refers to event kinds.
export const ch06: typeof en = {
  title: "Kinds y NIPs",
  summary: "Una tabla periódica de los kinds de eventos y las especificaciones que los definen.",
  table: {
    title: "La tabla periódica de los kinds",
    description:
      "Cada casilla es un kind de evento. Filtra por categoría de almacenamiento o busca, y elige una casilla para ver un evento de ejemplo real.",
    gridLabel: "Kinds de eventos",
    search: "Buscar kinds",
    searchPlaceholder: "Número, nombre o NIP…",
    filtersLabel: "Mostrar categorías",
    all: "Todas",
    results: {
      zero: "Ningún kind coincide.",
      one: "{count} kind mostrado",
      other: "{count} kinds mostrados",
    },
    empty: "No hay nada aquí. Prueba otra búsqueda o vuelve a activar alguna categoría.",
    tileLabel: "Kind {kind}: {name} ({category})",
    explored: "Exploraste {count} de {total} categorías",
    allExplored: "¡Visitaste las cuatro categorías! ¡Eres un maestro de la tabla periódica!",
  },
  detail: {
    placeholder: "Elige una casilla para inspeccionar un kind.",
    kind: "Kind {kind}",
    category: "Categoría de almacenamiento",
    range: "Rango: {range}",
    rule: "Qué hacen los relays",
    definedIn: "Definido en",
    openNip: "Leer {nip} en GitHub",
    example: "Evento de ejemplo",
    sourceFixture: "Un evento firmado real de nuestro conjunto de ejemplos.",
    sourceSigned: "Firmado ahora mismo en tu navegador con la clave de demostración de Alice.",
    sourceRumor: "Un rumor sin firmar: solo viaja dentro de un gift wrap.",
    filter: "Pedirle este kind a un relay",
    selected: "Kind {kind} seleccionado: {name}. {category}.",
    unrecommended: "No recomendado",
    unrecommendedHint:
      "El índice de NIPs marca este kind como no recomendado: las apps nuevas no deberían usarlo.",
    close: "Volver a la tabla",
  },
  classifier: {
    title: "Clasificador de números de kind",
    label: "Escribe cualquier número de kind (0–65535)",
    placeholder: "p. ej. 30023",
    result: "Kind {kind}: categoría {category}.",
    known: "Este lo conocemos: {name} ({nip}).",
    unknown:
      "No está en nuestra tabla, pero el número por sí solo les dice a los relays cómo guardarlo.",
    outside:
      "Este número queda fuera de todos los rangos de NIP-01, así que cada relay decide cómo guardarlo (la mayoría lo trata como regular).",
    errors: {
      empty: "Escribe un número para clasificarlo.",
      "not-an-integer": "Los kinds son números enteros, como 1 o 30023.",
      "out-of-range": "Los kinds van de 0 a 65535.",
    },
  },
  storage: {
    title: "Simulador de almacenamiento del relay",
    description:
      "Publica varias versiones de un evento y observa qué guarda el relay en su estante.",
    categoryLabel: "Categoría a simular",
    publish: "Publicar versión {n}",
    publishStale: "Reenviar una copia antigua",
    reset: "Reiniciar",
    article: "Artículo",
    articleA: "Artículo “a”",
    articleB: "Artículo “b”",
    shelf: "Estante del relay",
    shelfEmpty: "El estante está vacío.",
    subscriber: "Suscriptores en vivo",
    subscriberEmpty: "Nadie ha recibido nada todavía.",
    stored: { one: "{count} evento guardado", other: "{count} eventos guardados" },
    version: "v{n} · kind {kind}",
    outcomes: {
      stored: "Guardado. Los eventos regulares se acumulan: v{n} se suma al estante.",
      replaced: "Reemplazado. El relay descartó la versión anterior y se quedó con v{n}.",
      "ignored-older":
        "Ignorado. El relay ya tiene una versión más nueva, así que descarta esta copia antigua.",
      forwarded: "Reenviado a los suscriptores en vivo y luego olvidado. No se guarda nada.",
      duplicate: "Duplicado. El relay ya tiene un evento con este mismo id.",
    },
    demo: {
      regular: "Nota de kind 1",
      replaceable: "Perfil de kind 0",
      ephemeral: "Mensaje de firmante de kind 24133",
      addressable: "Artículo de kind 30023",
    },
  },
  tool: {
    intro:
      "Busca entre todos los kinds que documentamos, filtra por categoría de almacenamiento y abre cualquier fila para ver un ejemplo en vivo.",
    columns: {
      kind: "Kind",
      name: "Nombre",
      category: "Categoría",
      nip: "NIP",
      details: "Detalles",
    },
    show: "Ver",
    caption: "Kinds de eventos y los NIPs que los definen",
  },
};
