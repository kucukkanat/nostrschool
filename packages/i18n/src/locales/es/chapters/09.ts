// Owner: translation agents. Must structurally match ../../en/chapters/09.ts.
import type { ch09 as en } from "../../en/chapters/09.ts";

export const ch09: typeof en = {
  title: "Zaps",
  summary: "Los pagos Lightning se encuentran con los eventos de Nostr.",
  flow: {
    title: "Sigue un zap desde el toque hasta el recibo",
    description:
      "Cuatro participantes, diez pasos. Recorre cómo viaja una propina desde la app de quien envía, pasando por el servidor de la wallet de quien recibe y la red Lightning, hasta volver a los relays de Nostr como un recibo.",
    pickLabel: "Elige un zap para seguir",
    pickOption: "{sender} → {recipient} · {sats}",
    fixtureNote:
      "Solo datos de demostración: wallets falsas, facturas falsas, no se mueve dinero real.",
    sats: "{amount} sats",
    lanes: {
      client: "App de quien envía",
      server: "Servidor de la wallet (LNURL)",
      lightning: "Red Lightning",
      relays: "Relays",
    },
    steps: {
      profile: {
        label: "kind 0 con lud16",
        title: "1. Encontrar la dirección Lightning",
        body: "La app lee el perfil de {recipient} (kind 0). Su campo lud16 guarda una dirección Lightning que parece un correo: {lud16}.",
      },
      lnurlp: {
        label: "GET lnurlp",
        title: "2. Tocar la puerta de la wallet",
        body: "La dirección se convierte en una URL web normal. La app le pregunta a ese servidor de wallet: “¿cómo le pago a {recipient}?”",
      },
      params: {
        label: "allowsNostr ✓",
        title: "3. La wallet dice “hablo Nostr”",
        body: "La respuesta incluye allowsNostr: true y un nostrPubkey: la clave que esta wallet usará para firmar los recibos. ¡Recuérdala, la revisaremos más adelante!",
      },
      sign: {
        label: "firmar kind 9734",
        title: "4. Escribir y firmar una solicitud de zap",
        body: "La app de {sender} escribe una notita firmada: a quién se le paga, cuánto, qué publicación, un comentario y qué relays deben enterarse.",
      },
      callback: {
        label: "enviar al callback",
        title: "5. Entregar la solicitud a la wallet",
        body: "La solicitud de zap NO se publica en los relays. Viaja dentro de una petición web directo a la URL de callback del servidor de la wallet.",
      },
      invoice: {
        label: "factura bolt11",
        title: "6. Recibir una factura Lightning",
        body: "El servidor revisa la solicitud y devuelve una factura por {sats}. La solicitud de zap va incrustada en la descripción de la factura, así que ambas quedan unidas.",
      },
      pay: {
        label: "pagar factura",
        title: "7. ¡A pagar!",
        body: "La wallet de {sender} paga la factura por la red Lightning. El dinero se mueve en segundos, sin tocar ningún relay.",
      },
      settle: {
        label: "pagado (preimagen)",
        title: "8. El pago se liquida",
        body: "El servidor de la wallet ve su factura pagada. La preimagen secreta que se revela es el sello de “pagado” de Lightning.",
      },
      receipt: {
        label: "publicar kind 9735",
        title: "9. La wallet publica un recibo de zap",
        body: "El servidor de la wallet firma un recibo de zap con su nostrPubkey y lo envía a los relays indicados en la solicitud.",
      },
      tally: {
        label: "⚡ aparece en la publicación",
        title: "10. Todos ven el zap",
        body: "Las apps cargan los recibos desde los relays, los verifican y los suman. La publicación de {recipient} ahora muestra ⚡ {sats}.",
      },
    },
    payloadTitle: "Qué viaja en este paso",
    zapCounter: "Zaps en esta publicación",
    zapCounterValue: "⚡ {sats}",
    receiptToast: "¡Recibo publicado! ⚡",
    noZaps: "No hay zaps de demostración disponibles.",
  },
  lookup: {
    title: "Dirección Lightning → URL de la wallet",
    description:
      "Una dirección Lightning lud16 es solo una forma corta de escribir una URL web. Escribe una para ver la URL que consultaría una app.",
    inputLabel: "Dirección Lightning (lud16)",
    placeholder: "nombre@dominio.com",
    urlLabel: "La app consulta",
    examplesLabel: "Prueba con un personaje de demostración",
    errors: {
      empty: "Escribe una dirección Lightning como nombre@dominio.com.",
      format: "Eso no parece nombre@dominio: necesita exactamente una @.",
      name: "La parte del nombre solo puede usar a–z, 0–9 y - _ .",
      domain: "El dominio necesita al menos un punto, como wallet.example.",
    },
  },
  checker: {
    title: "¿Puedes confiar en este recibo?",
    description:
      "Cualquiera puede publicar un evento kind 9735. Elige un escenario y mira las comprobaciones que hace una app antes de contar un zap.",
    scenarioLabel: "Escenario",
    scenarios: {
      honest: {
        label: "Wallet honesta",
        body: "El servidor de wallet real firmó un recibo para una factura pagada.",
      },
      tampered: {
        label: "Manipulado",
        body: "Alguien editó la factura dentro de un recibo real para reclamar más sats, sin volver a firmarlo.",
      },
      impostor: {
        label: "Impostor",
        body: "Una clave cualquiera firma un recibo que parece perfecto y reclama 10 veces el monto.",
      },
      liar: {
        label: "Wallet mentirosa",
        body: "El servidor de wallet REAL publica un recibo aunque la factura nunca se pagó.",
      },
    },
    checksTitle: "Comprobaciones",
    checks: {
      signature: "La firma del recibo es válida",
      signer: "Firmado con el nostrPubkey de la wallet",
      embedded: "La solicitud de zap incluida es un kind 9734 con firma válida",
      recipient: "El recibo y la solicitud nombran a la misma persona destinataria",
      amount: "El monto de la factura coincide con el monto solicitado",
    },
    passed: "superada",
    failed: "fallida",
    verdictValid: "Cuenta como zap ✓",
    verdictInvalid: "Rechazado ✗",
    verdictValidNote:
      "Todas las comprobaciones pasan, pero fíjate: estás confiando en la palabra del servidor de la wallet.",
    verdictInvalidNote: "Una app honesta ignora este recibo.",
    liarNote:
      "Todas las comprobaciones pasaron y, sin embargo, no se movió dinero. Un recibo demuestra que un servidor de wallet DICE que se pagó, no que se haya pagado.",
    receiptLabel: "El recibo que se está revisando",
    narration: "{scenario}: {passed} de {total} comprobaciones superadas. {verdict}",
  },
};
