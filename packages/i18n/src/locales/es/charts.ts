// Owner: translation agents. Must structurally match ../en/charts.ts (enforced by the type).
import type { charts as en } from "../en/charts.ts";

export const charts: typeof en = {
  showTable: "Mostrar tabla de datos",
  hideTable: "Ocultar tabla de datos",
  label: "Etiqueta",
  value: "Valor",
  total: "Total",
  other: "Otros",
  noData: "Sin datos",
  series: "Serie",
  share: "Proporción",
  increase: "Sube {value}",
  decrease: "Baja {value}",
  unchanged: "Sin cambios",
  keyboardHint: "Usa las flechas para moverte entre los datos.",
};
