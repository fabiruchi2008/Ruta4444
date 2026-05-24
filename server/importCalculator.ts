/**
 * Calculadora de Costos de Importación - Ruta Cars GT
 * Calcula el costo total de importar un vehículo de USA a Guatemala
 *
 * LÓGICA DE PRECIOS:
 * - El cliente ve: costos reales + $500 "Servicio Ruta Cars GT"
 * - La ganancia real de Ruta Cars (mín Q10,000, calculada por IA según el vehículo)
 *   se reparte de forma invisible dentro del precio final que se le muestra al cliente
 * - El cliente NUNCA ve la ganancia real, solo los $500 de servicio
 */

export type VehicleSize = "small" | "medium" | "large" | "special";
export type AuctionPlatform = "copart" | "iaai";

export interface VehicleSizeInfo {
  size: VehicleSize;
  label: string;
  needsManualQuote: boolean;
}

// ─── Detección automática de tamaño del vehículo ─────────────────────────────
export function detectVehicleSize(bodyType: string | null | undefined): VehicleSizeInfo {
  if (!bodyType) return { size: "medium", label: "Mediano", needsManualQuote: false };
  const bt = bodyType.toLowerCase();

  if (
    bt.includes("van") || bt.includes("bus") || bt.includes("motorhome") ||
    bt.includes("rv") || bt.includes("trailer") || bt.includes("heavy") ||
    bt.includes("commercial") || bt.includes("cab chassis")
  ) {
    return { size: "special", label: "Especial (cotización manual)", needsManualQuote: true };
  }
  if (
    bt.includes("suv") || bt.includes("pickup") || bt.includes("4x4") ||
    bt.includes("crew") || bt.includes("extended") || bt.includes("truck")
  ) {
    return { size: "large", label: "Grande (SUV/Pickup)", needsManualQuote: false };
  }
  if (
    bt.includes("sedan") || bt.includes("hatchback") || bt.includes("coupe") ||
    bt.includes("convertible") || bt.includes("compact")
  ) {
    return { size: "small", label: "Pequeño (Sedán/Hatchback)", needsManualQuote: false };
  }
  if (bt.includes("wagon") || bt.includes("crossover") || bt.includes("minivan")) {
    return { size: "medium", label: "Mediano (Crossover/Wagon)", needsManualQuote: false };
  }
  return { size: "medium", label: "Mediano", needsManualQuote: false };
}

// ─── Tarifas de Transporte Interno USA (RoyalShipping) ────────────────────────
interface TransportRate {
  stateCode: string;
  stateName: string;
  small: number;
  medium: number;
  large: number;
  special: number;
}

export const USA_TRANSPORT_RATES: TransportRate[] = [
  { stateCode: "FL", stateName: "Florida", small: 250, medium: 300, large: 400, special: 0 },
  { stateCode: "GA", stateName: "Georgia", small: 350, medium: 425, large: 550, special: 0 },
  { stateCode: "SC", stateName: "South Carolina", small: 400, medium: 475, large: 600, special: 0 },
  { stateCode: "NC", stateName: "North Carolina", small: 450, medium: 525, large: 650, special: 0 },
  { stateCode: "VA", stateName: "Virginia", small: 500, medium: 575, large: 700, special: 0 },
  { stateCode: "MD", stateName: "Maryland", small: 525, medium: 600, large: 725, special: 0 },
  { stateCode: "DE", stateName: "Delaware", small: 550, medium: 625, large: 750, special: 0 },
  { stateCode: "NJ", stateName: "New Jersey", small: 575, medium: 650, large: 775, special: 0 },
  { stateCode: "NY", stateName: "New York", small: 600, medium: 675, large: 800, special: 0 },
  { stateCode: "CT", stateName: "Connecticut", small: 625, medium: 700, large: 825, special: 0 },
  { stateCode: "RI", stateName: "Rhode Island", small: 625, medium: 700, large: 825, special: 0 },
  { stateCode: "MA", stateName: "Massachusetts", small: 650, medium: 725, large: 850, special: 0 },
  { stateCode: "NH", stateName: "New Hampshire", small: 675, medium: 750, large: 875, special: 0 },
  { stateCode: "VT", stateName: "Vermont", small: 675, medium: 750, large: 875, special: 0 },
  { stateCode: "ME", stateName: "Maine", small: 700, medium: 775, large: 900, special: 0 },
  { stateCode: "PA", stateName: "Pennsylvania", small: 550, medium: 625, large: 750, special: 0 },
  { stateCode: "WV", stateName: "West Virginia", small: 525, medium: 600, large: 725, special: 0 },
  { stateCode: "KY", stateName: "Kentucky", small: 500, medium: 575, large: 700, special: 0 },
  { stateCode: "TN", stateName: "Tennessee", small: 450, medium: 525, large: 650, special: 0 },
  { stateCode: "AL", stateName: "Alabama", small: 400, medium: 475, large: 600, special: 0 },
  { stateCode: "MS", stateName: "Mississippi", small: 425, medium: 500, large: 625, special: 0 },
  { stateCode: "LA", stateName: "Louisiana", small: 450, medium: 525, large: 650, special: 0 },
  { stateCode: "AR", stateName: "Arkansas", small: 500, medium: 575, large: 700, special: 0 },
  { stateCode: "TX", stateName: "Texas", small: 550, medium: 625, large: 750, special: 0 },
  { stateCode: "OK", stateName: "Oklahoma", small: 575, medium: 650, large: 775, special: 0 },
  { stateCode: "OH", stateName: "Ohio", small: 550, medium: 625, large: 750, special: 0 },
  { stateCode: "IN", stateName: "Indiana", small: 575, medium: 650, large: 775, special: 0 },
  { stateCode: "IL", stateName: "Illinois", small: 600, medium: 675, large: 800, special: 0 },
  { stateCode: "MI", stateName: "Michigan", small: 600, medium: 675, large: 800, special: 0 },
  { stateCode: "WI", stateName: "Wisconsin", small: 625, medium: 700, large: 825, special: 0 },
  { stateCode: "MN", stateName: "Minnesota", small: 650, medium: 725, large: 850, special: 0 },
  { stateCode: "IA", stateName: "Iowa", small: 625, medium: 700, large: 825, special: 0 },
  { stateCode: "MO", stateName: "Missouri", small: 575, medium: 650, large: 775, special: 0 },
  { stateCode: "KS", stateName: "Kansas", small: 600, medium: 675, large: 800, special: 0 },
  { stateCode: "NE", stateName: "Nebraska", small: 625, medium: 700, large: 825, special: 0 },
  { stateCode: "SD", stateName: "South Dakota", small: 650, medium: 725, large: 850, special: 0 },
  { stateCode: "ND", stateName: "North Dakota", small: 675, medium: 750, large: 875, special: 0 },
  { stateCode: "CO", stateName: "Colorado", small: 700, medium: 775, large: 900, special: 0 },
  { stateCode: "WY", stateName: "Wyoming", small: 725, medium: 800, large: 925, special: 0 },
  { stateCode: "MT", stateName: "Montana", small: 750, medium: 825, large: 950, special: 0 },
  { stateCode: "ID", stateName: "Idaho", small: 775, medium: 850, large: 975, special: 0 },
  { stateCode: "UT", stateName: "Utah", small: 750, medium: 825, large: 950, special: 0 },
  { stateCode: "NV", stateName: "Nevada", small: 800, medium: 875, large: 1000, special: 0 },
  { stateCode: "AZ", stateName: "Arizona", small: 775, medium: 850, large: 975, special: 0 },
  { stateCode: "NM", stateName: "New Mexico", small: 700, medium: 775, large: 900, special: 0 },
  { stateCode: "CA", stateName: "California", small: 900, medium: 975, large: 1100, special: 0 },
  { stateCode: "OR", stateName: "Oregon", small: 950, medium: 1025, large: 1150, special: 0 },
  { stateCode: "WA", stateName: "Washington", small: 975, medium: 1050, large: 1175, special: 0 },
  { stateCode: "AK", stateName: "Alaska", small: 0, medium: 0, large: 0, special: 0 },
  { stateCode: "HI", stateName: "Hawaii", small: 0, medium: 0, large: 0, special: 0 },
];

export function getTransportRate(stateCode: string, size: VehicleSize): { rate: number; needsManualQuote: boolean } {
  const state = USA_TRANSPORT_RATES.find(s => s.stateCode === stateCode.toUpperCase());
  if (!state) return { rate: 650, needsManualQuote: false };
  if (size === "special" || state[size] === 0) return { rate: 0, needsManualQuote: true };
  return { rate: state[size], needsManualQuote: false };
}

// ─── Fees de Copart (Licensed Buyer via Autobid Master) ───────────────────────
export interface PlatformFees {
  buyerFee: number;
  environmentalFee: number;
  titleFee: number;
  virtualBidFee: number;
  gateFee: number;
  storagePerDay: number;
  total: number;
  breakdown: { name: string; amount: number }[];
}

export function calculateCopartFees(bidPrice: number): PlatformFees {
  let buyerFee = 0;
  if (bidPrice <= 99) buyerFee = 59;
  else if (bidPrice <= 199) buyerFee = 79;
  else if (bidPrice <= 299) buyerFee = 99;
  else if (bidPrice <= 399) buyerFee = 119;
  else if (bidPrice <= 499) buyerFee = 139;
  else if (bidPrice <= 599) buyerFee = 159;
  else if (bidPrice <= 699) buyerFee = 179;
  else if (bidPrice <= 799) buyerFee = 199;
  else if (bidPrice <= 899) buyerFee = 219;
  else if (bidPrice <= 999) buyerFee = 239;
  else if (bidPrice <= 1499) buyerFee = 299;
  else if (bidPrice <= 1999) buyerFee = 349;
  else if (bidPrice <= 2999) buyerFee = 399;
  else if (bidPrice <= 3999) buyerFee = 449;
  else if (bidPrice <= 4999) buyerFee = 499;
  else if (bidPrice <= 5999) buyerFee = 549;
  else if (bidPrice <= 6999) buyerFee = 599;
  else if (bidPrice <= 7999) buyerFee = 649;
  else if (bidPrice <= 9999) buyerFee = 699;
  else if (bidPrice <= 11999) buyerFee = 799;
  else if (bidPrice <= 13999) buyerFee = 849;
  else if (bidPrice <= 15999) buyerFee = 899;
  else if (bidPrice <= 19999) buyerFee = 999;
  else buyerFee = Math.round(bidPrice * 0.05);

  const environmentalFee = 10;
  const titleFee = 15;
  const virtualBidFee = 79;
  const total = buyerFee + environmentalFee + titleFee + virtualBidFee;
  return {
    buyerFee, environmentalFee, titleFee, virtualBidFee, gateFee: 0, storagePerDay: 0, total,
    breakdown: [
      { name: "Buyer Fee (Copart)", amount: buyerFee },
      { name: "Environmental Fee", amount: environmentalFee },
      { name: "Title Fee", amount: titleFee },
      { name: "Virtual Bid Fee (Autobid)", amount: virtualBidFee },
    ].filter(f => f.amount > 0),
  };
}

// ─── Fees de IAAI (Licensed Buyer via Autobid Master) ────────────────────────
export function calculateIAAIFees(bidPrice: number): PlatformFees {
  let buyerFee = 0;
  if (bidPrice <= 99) buyerFee = 99;
  else if (bidPrice <= 199) buyerFee = 129;
  else if (bidPrice <= 299) buyerFee = 149;
  else if (bidPrice <= 399) buyerFee = 169;
  else if (bidPrice <= 499) buyerFee = 189;
  else if (bidPrice <= 599) buyerFee = 209;
  else if (bidPrice <= 699) buyerFee = 229;
  else if (bidPrice <= 799) buyerFee = 249;
  else if (bidPrice <= 899) buyerFee = 269;
  else if (bidPrice <= 999) buyerFee = 289;
  else if (bidPrice <= 1499) buyerFee = 349;
  else if (bidPrice <= 1999) buyerFee = 399;
  else if (bidPrice <= 2999) buyerFee = 449;
  else if (bidPrice <= 3999) buyerFee = 499;
  else if (bidPrice <= 4999) buyerFee = 549;
  else if (bidPrice <= 5999) buyerFee = 599;
  else if (bidPrice <= 6999) buyerFee = 649;
  else if (bidPrice <= 7999) buyerFee = 699;
  else if (bidPrice <= 9999) buyerFee = 749;
  else if (bidPrice <= 11999) buyerFee = 849;
  else if (bidPrice <= 13999) buyerFee = 899;
  else if (bidPrice <= 15999) buyerFee = 949;
  else if (bidPrice <= 19999) buyerFee = 1049;
  else buyerFee = Math.round(bidPrice * 0.055);

  const environmentalFee = 15;
  const titleFee = 20;
  const virtualBidFee = 75;
  const total = buyerFee + environmentalFee + titleFee + virtualBidFee;
  return {
    buyerFee, environmentalFee, titleFee, virtualBidFee, gateFee: 0, storagePerDay: 0, total,
    breakdown: [
      { name: "Buyer Fee (IAAI)", amount: buyerFee },
      { name: "Environmental Fee", amount: environmentalFee },
      { name: "Title Fee", amount: titleFee },
      { name: "Online Bid Fee (Autobid)", amount: virtualBidFee },
    ].filter(f => f.amount > 0),
  };
}

// ─── Calculadora Principal ────────────────────────────────────────────────────

export interface ImportCalculationInput {
  auctionPrice: number;
  platform: AuctionPlatform;
  stateCode: string;
  bodyType: string | null;
  exchangeRate: number;
  /**
   * Ganancia interna de Ruta Cars en GTQ (calculada por IA, mínimo Q10,000).
   * NUNCA se muestra al cliente. Se reparte de forma invisible en el precio final.
   */
  internalProfitGTQ?: number;
}

export interface ImportCalculationResult {
  // Costos reales en USD (lo que el cliente ve en el desglose)
  auctionPrice: number;
  platformFees: PlatformFees;
  usaTransport: number;
  maritimeShipping: number;
  cifValue: number;
  guatemalaTax: number;       // 32% sobre CIF (impuesto unificado GT)
  miscExpensesGTQ: number;    // Q5,000 gastos varios
  rutaCarsServiceUSD: number; // $500 visible al cliente
  totalCostUSD: number;       // Costo real sin ganancia interna

  // Precio final al cliente (incluye ganancia interna oculta)
  finalPriceUSD: number;
  finalPriceGTQ: number;
  exchangeRate: number;

  // Ganancia interna (SOLO para uso del admin, nunca mostrar al cliente)
  internalProfitGTQ: number;

  // Info adicional
  vehicleSize: VehicleSizeInfo;
  needsManualQuote: boolean;

  // Desglose visible al cliente (sin ganancia interna)
  breakdown: { label: string; amountUSD: number; amountGTQ: number }[];
}

export function calculateImportCost(input: ImportCalculationInput): ImportCalculationResult {
  const { auctionPrice, platform, stateCode, bodyType, exchangeRate } = input;

  // 1. Fees de plataforma (automáticos según Copart o IAAI)
  const platformFees = platform === "copart"
    ? calculateCopartFees(auctionPrice)
    : calculateIAAIFees(auctionPrice);

  // 2. Tamaño del vehículo y transporte interno USA
  const vehicleSize = detectVehicleSize(bodyType);
  const transportInfo = getTransportRate(stateCode, vehicleSize.size);
  const usaTransport = transportInfo.rate;
  const needsManualQuote = transportInfo.needsManualQuote || vehicleSize.needsManualQuote;

  // 3. Shipping marítimo a Puerto Quetzal (desde Florida)
  const maritimeShipping = 2800;

  // 4. CIF = Precio + Fees + Transporte USA + Shipping Marítimo
  const cifValue = auctionPrice + platformFees.total + usaTransport + maritimeShipping;

  // 5. Impuesto Guatemala: 32% sobre CIF (unificado: aranceles + IVA + trámites)
  const guatemalaTax = Math.round(cifValue * 0.32);

  // 6. Gastos varios fijos: Q5,000
  const miscExpensesGTQ = 5000;

  // 7. Servicio Ruta Cars GT: $500 visible al cliente
  const rutaCarsServiceUSD = 500;

  // 8. Costo total real en USD (sin ganancia interna)
  const totalCostUSD = cifValue + guatemalaTax / exchangeRate + miscExpensesGTQ / exchangeRate + rutaCarsServiceUSD;

  // 9. Ganancia interna de Ruta Cars (mínimo Q10,000, calculada por IA)
  //    Si no se provee, se usa el mínimo de Q10,000
  const internalProfitGTQ = input.internalProfitGTQ ?? 10000;

  // 10. Precio final al cliente = costo total + ganancia interna oculta
  const finalPriceGTQ = Math.round(totalCostUSD * exchangeRate + miscExpensesGTQ + internalProfitGTQ);
  const finalPriceUSD = Math.round(finalPriceGTQ / exchangeRate);

  // Desglose visible al cliente (sin ganancia interna)
  const breakdown = [
    { label: "Precio de Subasta", amountUSD: auctionPrice, amountGTQ: Math.round(auctionPrice * exchangeRate) },
    { label: `Fees ${platform === "copart" ? "Copart" : "IAAI"}`, amountUSD: platformFees.total, amountGTQ: Math.round(platformFees.total * exchangeRate) },
    { label: "Transporte Interno USA", amountUSD: usaTransport, amountGTQ: Math.round(usaTransport * exchangeRate) },
    { label: "Shipping Marítimo (Puerto Quetzal)", amountUSD: maritimeShipping, amountGTQ: Math.round(maritimeShipping * exchangeRate) },
    { label: "Impuestos Guatemala (32% sobre CIF)", amountUSD: Math.round(guatemalaTax / exchangeRate), amountGTQ: guatemalaTax },
    { label: "Gastos Varios (aduana, trámites)", amountUSD: Math.round(miscExpensesGTQ / exchangeRate), amountGTQ: miscExpensesGTQ },
    { label: "Servicio Ruta Cars GT", amountUSD: rutaCarsServiceUSD, amountGTQ: Math.round(rutaCarsServiceUSD * exchangeRate) },
  ];

  return {
    auctionPrice,
    platformFees,
    usaTransport,
    maritimeShipping,
    cifValue,
    guatemalaTax,
    miscExpensesGTQ,
    rutaCarsServiceUSD,
    totalCostUSD,
    finalPriceUSD,
    finalPriceGTQ,
    exchangeRate,
    internalProfitGTQ,
    vehicleSize,
    needsManualQuote,
    breakdown,
  };
}
