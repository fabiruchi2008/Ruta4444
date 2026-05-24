/**
 * Calculadora de Costos de Importación - Ruta Cars GT
 * Calcula el costo total de importar un vehículo de USA a Guatemala
 */

// ─── Tipos de vehículo para transporte ────────────────────────────────────────

export type VehicleSize = "small" | "medium" | "large" | "special";
export type AuctionPlatform = "copart" | "iaai";

export interface VehicleSizeInfo {
  size: VehicleSize;
  label: string;
  needsManualQuote: boolean;
}

// Detectar tamaño del vehículo basado en tipo de carrocería
export function detectVehicleSize(bodyType: string | null | undefined): VehicleSizeInfo {
  if (!bodyType) return { size: "medium", label: "Mediano", needsManualQuote: false };

  const bt = bodyType.toLowerCase();

  // Vehículos especiales que necesitan cotización manual
  if (
    bt.includes("van") ||
    bt.includes("bus") ||
    bt.includes("truck") ||
    bt.includes("motorhome") ||
    bt.includes("rv") ||
    bt.includes("trailer") ||
    bt.includes("heavy") ||
    bt.includes("commercial")
  ) {
    return { size: "special", label: "Especial (cotización manual)", needsManualQuote: true };
  }

  // SUV grande, Pickup grande
  if (
    bt.includes("suv") ||
    bt.includes("pickup") ||
    bt.includes("truck") ||
    bt.includes("4x4") ||
    bt.includes("crew") ||
    bt.includes("extended")
  ) {
    return { size: "large", label: "Grande (SUV/Pickup)", needsManualQuote: false };
  }

  // Sedán, Hatchback, Coupé, Convertible
  if (
    bt.includes("sedan") ||
    bt.includes("hatchback") ||
    bt.includes("coupe") ||
    bt.includes("convertible") ||
    bt.includes("wagon") ||
    bt.includes("compact")
  ) {
    return { size: "small", label: "Pequeño (Sedán/Hatchback)", needsManualQuote: false };
  }

  // Crossover, SUV compacto
  return { size: "medium", label: "Mediano (Crossover/SUV Compacto)", needsManualQuote: false };
}

// ─── Tarifas de Transporte Interno USA (RoyalShipping) ────────────────────────
// Basado en información de RoyalShipping Lines, Miami FL
// Tarifa base desde cualquier estado a Miami/Florida para embarque

interface TransportRate {
  stateCode: string;
  stateName: string;
  small: number;    // Sedán, Hatchback
  medium: number;   // Crossover, SUV compacto
  large: number;    // SUV grande, Pickup
  special: number;  // Necesita cotización manual (0 = manual)
}

export const USA_TRANSPORT_RATES: TransportRate[] = [
  // Costa Este - Cercana a Florida
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
  // Sur Central
  { stateCode: "LA", stateName: "Louisiana", small: 450, medium: 525, large: 650, special: 0 },
  { stateCode: "AR", stateName: "Arkansas", small: 500, medium: 575, large: 700, special: 0 },
  { stateCode: "TX", stateName: "Texas", small: 550, medium: 625, large: 750, special: 0 },
  { stateCode: "OK", stateName: "Oklahoma", small: 575, medium: 650, large: 775, special: 0 },
  // Medio Oeste
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
  // Montaña / Suroeste
  { stateCode: "CO", stateName: "Colorado", small: 700, medium: 775, large: 900, special: 0 },
  { stateCode: "WY", stateName: "Wyoming", small: 725, medium: 800, large: 925, special: 0 },
  { stateCode: "MT", stateName: "Montana", small: 750, medium: 825, large: 950, special: 0 },
  { stateCode: "ID", stateName: "Idaho", small: 775, medium: 850, large: 975, special: 0 },
  { stateCode: "UT", stateName: "Utah", small: 750, medium: 825, large: 950, special: 0 },
  { stateCode: "NV", stateName: "Nevada", small: 800, medium: 875, large: 1000, special: 0 },
  { stateCode: "AZ", stateName: "Arizona", small: 775, medium: 850, large: 975, special: 0 },
  { stateCode: "NM", stateName: "New Mexico", small: 700, medium: 775, large: 900, special: 0 },
  // Costa Oeste
  { stateCode: "CA", stateName: "California", small: 900, medium: 975, large: 1100, special: 0 },
  { stateCode: "OR", stateName: "Oregon", small: 950, medium: 1025, large: 1150, special: 0 },
  { stateCode: "WA", stateName: "Washington", small: 975, medium: 1050, large: 1175, special: 0 },
  // Noroeste
  { stateCode: "AK", stateName: "Alaska", small: 0, medium: 0, large: 0, special: 0 }, // Manual
  { stateCode: "HI", stateName: "Hawaii", small: 0, medium: 0, large: 0, special: 0 }, // Manual
];

export function getTransportRate(stateCode: string, size: VehicleSize): { rate: number; needsManualQuote: boolean } {
  const state = USA_TRANSPORT_RATES.find(s => s.stateCode === stateCode.toUpperCase());

  if (!state) {
    return { rate: 650, needsManualQuote: false }; // Promedio si no se encuentra
  }

  if (size === "special" || state[size] === 0) {
    return { rate: 0, needsManualQuote: true };
  }

  return { rate: state[size], needsManualQuote: false };
}

// ─── Fees de Copart e IAAI ────────────────────────────────────────────────────
// Fees reales basados en las tablas oficiales de Copart e IAAI
// Autobid Master = Licensed Buyer (acceso completo)

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

// Fees de Copart (Licensed Buyer via Autobid Master)
export function calculateCopartFees(bidPrice: number): PlatformFees {
  let buyerFee = 0;

  // Tabla de fees de Copart 2024-2025 para Licensed Buyers
  if (bidPrice <= 99) {
    buyerFee = 59;
  } else if (bidPrice <= 199) {
    buyerFee = 79;
  } else if (bidPrice <= 299) {
    buyerFee = 99;
  } else if (bidPrice <= 399) {
    buyerFee = 119;
  } else if (bidPrice <= 499) {
    buyerFee = 139;
  } else if (bidPrice <= 599) {
    buyerFee = 159;
  } else if (bidPrice <= 699) {
    buyerFee = 179;
  } else if (bidPrice <= 799) {
    buyerFee = 199;
  } else if (bidPrice <= 899) {
    buyerFee = 219;
  } else if (bidPrice <= 999) {
    buyerFee = 239;
  } else if (bidPrice <= 1499) {
    buyerFee = 299;
  } else if (bidPrice <= 1999) {
    buyerFee = 349;
  } else if (bidPrice <= 2999) {
    buyerFee = 399;
  } else if (bidPrice <= 3999) {
    buyerFee = 449;
  } else if (bidPrice <= 4999) {
    buyerFee = 499;
  } else if (bidPrice <= 5999) {
    buyerFee = 549;
  } else if (bidPrice <= 6999) {
    buyerFee = 599;
  } else if (bidPrice <= 7999) {
    buyerFee = 649;
  } else if (bidPrice <= 9999) {
    buyerFee = 699;
  } else if (bidPrice <= 11999) {
    buyerFee = 799;
  } else if (bidPrice <= 13999) {
    buyerFee = 849;
  } else if (bidPrice <= 15999) {
    buyerFee = 899;
  } else if (bidPrice <= 19999) {
    buyerFee = 999;
  } else {
    // Para precios mayores: ~5% del precio
    buyerFee = Math.round(bidPrice * 0.05);
  }

  const environmentalFee = 10;
  const titleFee = 15;
  const virtualBidFee = 79; // Fee de Autobid Master / virtual bid
  const gateFee = 0; // Incluido en buyer fee para licensed buyers

  const total = buyerFee + environmentalFee + titleFee + virtualBidFee + gateFee;

  return {
    buyerFee,
    environmentalFee,
    titleFee,
    virtualBidFee,
    gateFee,
    storagePerDay: 0,
    total,
    breakdown: [
      { name: "Buyer Fee (Copart)", amount: buyerFee },
      { name: "Environmental Fee", amount: environmentalFee },
      { name: "Title Fee", amount: titleFee },
      { name: "Virtual Bid Fee (Autobid)", amount: virtualBidFee },
    ].filter(f => f.amount > 0),
  };
}

// Fees de IAAI (Licensed Buyer via Autobid Master)
export function calculateIAAIFees(bidPrice: number): PlatformFees {
  let buyerFee = 0;

  // Tabla de fees de IAAI 2024-2025
  if (bidPrice <= 99) {
    buyerFee = 99;
  } else if (bidPrice <= 199) {
    buyerFee = 129;
  } else if (bidPrice <= 299) {
    buyerFee = 149;
  } else if (bidPrice <= 399) {
    buyerFee = 169;
  } else if (bidPrice <= 499) {
    buyerFee = 189;
  } else if (bidPrice <= 599) {
    buyerFee = 209;
  } else if (bidPrice <= 699) {
    buyerFee = 229;
  } else if (bidPrice <= 799) {
    buyerFee = 249;
  } else if (bidPrice <= 899) {
    buyerFee = 269;
  } else if (bidPrice <= 999) {
    buyerFee = 289;
  } else if (bidPrice <= 1499) {
    buyerFee = 349;
  } else if (bidPrice <= 1999) {
    buyerFee = 399;
  } else if (bidPrice <= 2999) {
    buyerFee = 449;
  } else if (bidPrice <= 3999) {
    buyerFee = 499;
  } else if (bidPrice <= 4999) {
    buyerFee = 549;
  } else if (bidPrice <= 5999) {
    buyerFee = 599;
  } else if (bidPrice <= 6999) {
    buyerFee = 649;
  } else if (bidPrice <= 7999) {
    buyerFee = 699;
  } else if (bidPrice <= 9999) {
    buyerFee = 749;
  } else if (bidPrice <= 11999) {
    buyerFee = 849;
  } else if (bidPrice <= 13999) {
    buyerFee = 899;
  } else if (bidPrice <= 15999) {
    buyerFee = 949;
  } else if (bidPrice <= 19999) {
    buyerFee = 1049;
  } else {
    buyerFee = Math.round(bidPrice * 0.055);
  }

  const environmentalFee = 15;
  const titleFee = 20;
  const virtualBidFee = 75; // IAAI online bid fee
  const gateFee = 0;

  const total = buyerFee + environmentalFee + titleFee + virtualBidFee + gateFee;

  return {
    buyerFee,
    environmentalFee,
    titleFee,
    virtualBidFee,
    gateFee,
    storagePerDay: 0,
    total,
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
  auctionPrice: number;          // Precio de subasta en USD
  platform: AuctionPlatform;     // "copart" o "iaai"
  stateCode: string;             // Estado de origen del vehículo
  bodyType: string | null;       // Tipo de carrocería
  exchangeRate: number;          // Tipo de cambio USD → GTQ (ej: 7.75)
  customDutyRate?: number;       // Porcentaje de arancel (0.15 a 0.25, default 0.20)
}

export interface ImportCalculationResult {
  // Precios en USD
  auctionPrice: number;
  platformFees: PlatformFees;
  usaTransport: number;
  maritimeShipping: number;
  cifValue: number;
  customsDuty: number;
  vat: number;
  customsAdminFee: number;
  rutaCarsService: number;
  totalUSD: number;

  // Precios en GTQ
  totalGTQ: number;
  exchangeRate: number;

  // Análisis de ganancia
  estimatedMarketPriceGTQ: number;
  estimatedProfitGTQ: number;
  meetsMinimumProfit: boolean;
  suggestedSellingPriceGTQ: number;

  // Información adicional
  vehicleSize: VehicleSizeInfo;
  needsManualQuote: boolean;
  breakdown: { label: string; amountUSD: number; amountGTQ: number }[];
}

export function calculateImportCost(input: ImportCalculationInput): ImportCalculationResult {
  const {
    auctionPrice,
    platform,
    stateCode,
    bodyType,
    exchangeRate,
    customDutyRate = 0.20,
  } = input;

  // 1. Fees de plataforma
  const platformFees = platform === "copart"
    ? calculateCopartFees(auctionPrice)
    : calculateIAAIFees(auctionPrice);

  // 2. Tamaño del vehículo y transporte
  const vehicleSize = detectVehicleSize(bodyType);
  const transportInfo = getTransportRate(stateCode, vehicleSize.size);
  const usaTransport = transportInfo.rate;
  const needsManualQuote = transportInfo.needsManualQuote || vehicleSize.needsManualQuote;

  // 3. Shipping marítimo a Puerto Quetzal (desde Florida)
  const maritimeShipping = 2800;

  // 4. CIF = Precio + Fees + Transporte USA + Shipping Marítimo
  const cifValue = auctionPrice + platformFees.total + usaTransport + maritimeShipping;

  // 5. Aranceles Guatemala (sobre CIF)
  const customsDuty = Math.round(cifValue * customDutyRate);

  // 6. IVA 12% (sobre CIF + Aranceles)
  const vat = Math.round((cifValue + customsDuty) * 0.12);

  // 7. Costos aduanales y administrativos
  const customsAdminFee = 350; // Promedio de costos aduanales

  // 8. Servicio Ruta Cars GT
  const rutaCarsService = 500;

  // 9. Total en USD
  const totalUSD = cifValue + customsDuty + vat + customsAdminFee + rutaCarsService;

  // 10. Total en GTQ
  const totalGTQ = Math.round(totalUSD * exchangeRate);

  // 11. Análisis de ganancia
  // Estimación del precio de mercado en Guatemala basado en el precio de subasta
  // Los vehículos de subasta típicamente se venden 40-80% más caro en Guatemala
  const marketMultiplier = 1.6; // Multiplicador conservador
  const estimatedMarketPriceGTQ = Math.round(auctionPrice * exchangeRate * marketMultiplier);
  const estimatedProfitGTQ = estimatedMarketPriceGTQ - totalGTQ;
  const minimumProfitGTQ = 10000;
  const meetsMinimumProfit = estimatedProfitGTQ >= minimumProfitGTQ;

  // Precio de venta sugerido que garantiza Q10,000 de ganancia
  const suggestedSellingPriceGTQ = Math.max(
    estimatedMarketPriceGTQ,
    totalGTQ + minimumProfitGTQ
  );

  const breakdown = [
    { label: "Precio de Subasta", amountUSD: auctionPrice, amountGTQ: Math.round(auctionPrice * exchangeRate) },
    { label: `Fees ${platform === "copart" ? "Copart" : "IAAI"}`, amountUSD: platformFees.total, amountGTQ: Math.round(platformFees.total * exchangeRate) },
    { label: "Transporte Interno USA", amountUSD: usaTransport, amountGTQ: Math.round(usaTransport * exchangeRate) },
    { label: "Shipping Marítimo (Puerto Quetzal)", amountUSD: maritimeShipping, amountGTQ: Math.round(maritimeShipping * exchangeRate) },
    { label: `Aranceles Guatemala (${Math.round(customDutyRate * 100)}% sobre CIF)`, amountUSD: customsDuty, amountGTQ: Math.round(customsDuty * exchangeRate) },
    { label: "IVA 12%", amountUSD: vat, amountGTQ: Math.round(vat * exchangeRate) },
    { label: "Costos Aduanales", amountUSD: customsAdminFee, amountGTQ: Math.round(customsAdminFee * exchangeRate) },
    { label: "Servicio Ruta Cars GT", amountUSD: rutaCarsService, amountGTQ: Math.round(rutaCarsService * exchangeRate) },
  ];

  return {
    auctionPrice,
    platformFees,
    usaTransport,
    maritimeShipping,
    cifValue,
    customsDuty,
    vat,
    customsAdminFee,
    rutaCarsService,
    totalUSD,
    totalGTQ,
    exchangeRate,
    estimatedMarketPriceGTQ,
    estimatedProfitGTQ,
    meetsMinimumProfit,
    suggestedSellingPriceGTQ,
    vehicleSize,
    needsManualQuote,
    breakdown,
  };
}
