/**
 * Clasificación de tipos de título de vehículos para exportación a Guatemala.
 *
 * ROJO   = No exportable (no se puede importar a Guatemala)
 * AMARILLO = Exportable pero con trámite extra (~$200-$500 adicionales)
 * VERDE  = Título limpio, sin problemas
 */

export type TitleRisk = "red" | "yellow" | "green";

// Títulos que NO se pueden exportar
const NON_EXPORTABLE_KEYWORDS = [
  "BILL OF SALE",
  "SCRAP",
  "PARTS ONLY",
  "DESTRUCTION",
  "VR-112",
  "MV907A",
  "LIEN PAPERS",
  "DLR ONLY",
  "DEALER ONLY",
  "JUNKING CERTIFICATE",
  "NON-REPAIRABLE",
  "DISMANTLED",
];

// Títulos exportables pero con trámite extra
const PROBLEMATIC_KEYWORDS = [
  "JUNK",
  "SALVAGE",
  "REBUILT",
  "FLOOD",
  "WATER",
  "HAIL",
  "FIRE",
  "THEFT",
  "LEMON",
  "INSURANCE",
  "ODOMETER",
  "BONDED",
  "CERTIFICATE OF TITLE BRAND",
];

export function classifyTitle(titleType: string | null | undefined): TitleRisk {
  if (!titleType) return "green";
  const upper = titleType.toUpperCase();

  for (const kw of NON_EXPORTABLE_KEYWORDS) {
    if (upper.includes(kw)) return "red";
  }
  for (const kw of PROBLEMATIC_KEYWORDS) {
    if (upper.includes(kw)) return "yellow";
  }
  return "green";
}

export function getTitleBadgeProps(titleType: string | null | undefined): {
  risk: TitleRisk;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  tooltip: string;
} {
  const risk = classifyTitle(titleType);
  const display = titleType ?? "Clean Title";

  if (risk === "red") {
    return {
      risk,
      label: display,
      bgClass: "bg-red-500/15",
      textClass: "text-red-400",
      borderClass: "border-red-500/30",
      tooltip: "⚠️ Este título NO es exportable a Guatemala",
    };
  }
  if (risk === "yellow") {
    return {
      risk,
      label: display,
      bgClass: "bg-yellow-500/15",
      textClass: "text-yellow-400",
      borderClass: "border-yellow-500/30",
      tooltip: "⚠️ Título con trámite extra (~$200-$500 adicionales)",
    };
  }
  return {
    risk,
    label: display,
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    tooltip: "✅ Título limpio, apto para exportar",
  };
}
