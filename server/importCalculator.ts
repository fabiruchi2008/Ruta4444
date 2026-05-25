/**
 * Calculadora de Costos de Importación - Ruta Cars GT
 * Calcula el costo total de importar un vehículo de USA a Guatemala
 *
 * ESTRUCTURA DE COSTOS:
 * 1. Precio de subasta / Buy Now
 * 2. Fees de plataforma (Copart o IAAI, según tabla oficial)
 * 3. Transporte USA (grúa desde subasta al puerto) — precio real Royal Shipping
 *    ↑ La ganancia de Ruta Cars GT se incluye aquí de forma invisible
 * 4. Flete marítimo (Royal Shipping, Santo Tomás de Castilla) — precio real por tamaño
 * 5. Impuestos Guatemala: 32% sobre CIF
 * 6. Gastos varios: Q5,000
 * 7. Servicio Ruta Cars GT: $500 (visible al cliente)
 *
 * GANANCIA OCULTA:
 * - Se suma al precio de Transporte USA (línea 3)
 * - El cliente ve un precio de transporte "normal" que incluye la ganancia
 * - Nunca aparece como línea separada
 */

import { getDb } from "./db";
import { shippingRates, oceanRates, gtMarketPrices } from "../drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export type VehicleSize = "sedan" | "small_suv" | "medium_suv" | "large_suv" | "xl_suv" | "special";
export type AuctionPlatform = "copart" | "iaai";

// ─── Constantes de ganancia ────────────────────────────────────────────────────
export const MIN_PROFIT_GTQ = 10000; // Ganancia mínima en quetzales
export const MARKET_DISCOUNT_FACTOR = 0.87; // El cliente paga 13% menos que el mercado local

export interface VehicleSizeInfo {
  size: VehicleSize;
  label: string;
  needsManualQuote: boolean;
  oceanTier: number;
}

// ─── Ganancia de Ruta Cars GT (oculta en Transporte USA) ──────────────────────
// Esta ganancia se suma al precio de grúa real de Royal Shipping
// El cliente ve el total como "Transporte USA" sin saber que incluye ganancia
export const RUTA_CARS_PROFIT_USD = 500; // Ganancia fija en USD incluida en transporte

// ─── Buscar precio de mercado GT en la DB ─────────────────────────────────────
/**
 * Busca el precio de mercado guatemalteco para un vehículo específico.
 * Estrategia de búsqueda:
 * 1. make + model + year exacto
 * 2. make + model (sin año, promedio de todos los años)
 * 3. null (no hay datos de mercado)
 */
export async function getGtMarketPrice(
  make: string,
  model: string,
  year: number | null
): Promise<{ priceGtq: number; source: "exact" | "model_avg" } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const makeNorm = make.trim();
    const modelNorm = model.trim();

    // 1. Buscar por make + model + year exacto
    if (year) {
      const exact = await db
        .select()
        .from(gtMarketPrices)
        .where(and(
          eq(sql`LOWER(${gtMarketPrices.make})`, makeNorm.toLowerCase()),
          eq(sql`LOWER(${gtMarketPrices.model})`, modelNorm.toLowerCase()),
          eq(gtMarketPrices.year, year)
        ))
        .limit(1);

      if (exact[0]) {
        return { priceGtq: exact[0].priceGtq, source: "exact" };
      }

      // Buscar el año más cercano disponible para ese modelo
      const allYears = await db
        .select()
        .from(gtMarketPrices)
        .where(and(
          eq(sql`LOWER(${gtMarketPrices.make})`, makeNorm.toLowerCase()),
          eq(sql`LOWER(${gtMarketPrices.model})`, modelNorm.toLowerCase())
        ));

      if (allYears.length > 0) {
        // Ordenar por cercanía al año buscado
        const sorted = allYears
          .filter(r => r.year != null)
          .sort((a, b) => Math.abs((a.year ?? 0) - year) - Math.abs((b.year ?? 0) - year));

        if (sorted[0]) {
          return { priceGtq: sorted[0].priceGtq, source: "model_avg" };
        }

        // Si solo hay promedio sin año
        const noYear = allYears.find(r => r.year == null);
        if (noYear) {
          return { priceGtq: noYear.priceGtq, source: "model_avg" };
        }
      }
    }

    // 2. Buscar promedio del modelo sin año
    const modelAvg = await db
      .select()
      .from(gtMarketPrices)
      .where(and(
        eq(sql`LOWER(${gtMarketPrices.make})`, makeNorm.toLowerCase()),
        eq(sql`LOWER(${gtMarketPrices.model})`, modelNorm.toLowerCase()),
        isNull(gtMarketPrices.year)
      ))
      .limit(1);

    if (modelAvg[0]) {
      return { priceGtq: modelAvg[0].priceGtq, source: "model_avg" };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Detección de tamaño del vehículo (mapeo a tiers de Royal Shipping) ───────
export function detectVehicleSize(bodyType: string | null | undefined): VehicleSizeInfo {
  if (!bodyType) return { size: "medium_suv", label: "SUV Mediano", needsManualQuote: false, oceanTier: 4 };
  const bt = bodyType.toLowerCase();

  // Especiales: requieren cotización manual
  if (
    bt.includes("bus") || bt.includes("motorhome") || bt.includes("rv") ||
    bt.includes("trailer") || bt.includes("heavy") || bt.includes("commercial") ||
    bt.includes("cab chassis") || bt.includes("boat")
  ) {
    return { size: "special", label: "Especial (cotización manual)", needsManualQuote: true, oceanTier: 6 };
  }

  // XL: Van, vehículos extra grandes (18-20 ft) → Tier 6
  if (bt.includes("van") && !bt.includes("minivan")) {
    return { size: "xl_suv", label: "Van / Extra Grande", needsManualQuote: false, oceanTier: 6 };
  }

  // Large: SUV grande, Pickup crew cab, Minivan (16.5-17.9 ft) → Tier 5
  if (
    bt.includes("minivan") ||
    (bt.includes("suv") && (bt.includes("large") || bt.includes("full"))) ||
    bt.includes("crew") || bt.includes("extended cab")
  ) {
    return { size: "large_suv", label: "SUV Grande / Minivan", needsManualQuote: false, oceanTier: 5 };
  }

  // Medium SUV / Pickup regular (15.1-16.4 ft) → Tier 4
  if (
    bt.includes("pickup") || bt.includes("truck") || bt.includes("4x4") ||
    (bt.includes("suv") && !bt.includes("small") && !bt.includes("compact"))
  ) {
    return { size: "medium_suv", label: "SUV Mediano / Pickup", needsManualQuote: false, oceanTier: 4 };
  }

  // Small SUV / Crossover (max 15 ft) → Tier 3
  if (
    bt.includes("crossover") || bt.includes("wagon") ||
    (bt.includes("suv") && (bt.includes("small") || bt.includes("compact")))
  ) {
    return { size: "small_suv", label: "SUV Pequeño / Crossover", needsManualQuote: false, oceanTier: 3 };
  }

  // Sedan / Coupe / Hatchback / Convertible (max 16 ft) → Tier 2
  if (
    bt.includes("sedan") || bt.includes("hatchback") || bt.includes("coupe") ||
    bt.includes("convertible") || bt.includes("compact") || bt.includes("saloon")
  ) {
    return { size: "sedan", label: "Sedán / Coupé", needsManualQuote: false, oceanTier: 2 };
  }

  // Default: SUV Mediano
  return { size: "medium_suv", label: "SUV Mediano", needsManualQuote: false, oceanTier: 4 };
}

// ─── Tarifas de fallback (si la DB no está disponible) ────────────────────────
// Precios reales de Royal Shipping por estado (promedio cuando no hay ciudad exacta)
const FALLBACK_INLAND_RATES: Record<string, number> = {
  AL: 575, AR: 825, AZ: 1050, CA: 1425, CO: 988, CT: 925, DE: 825,
  FL: 265, GA: 464, IA: 900, IL: 813, IN: 808, KS: 925, KY: 825,
  LA: 638, MA: 913, MD: 775, ME: 1050, MI: 938, MN: 925, MO: 838,
  MS: 600, NC: 525, NH: 975, NJ: 825, NM: 1275, NV: 1275, NY: 950,
  OH: 848, OK: 850, PA: 930, RI: 875, SC: 425, TN: 575, TX: 750,
  VA: 717, WI: 913, WV: 838,
  // Estados sin datos de Royal Shipping (estimados)
  WA: 1500, OR: 1500, ID: 1300, MT: 1400, WY: 1200, UT: 1100,
  SD: 1100, ND: 1200, NE: 1000, VT: 1050, AK: 0, HI: 0,
};

// Tarifas de flete marítimo de fallback (Royal Shipping - Santo Tomás de Castilla)
const FALLBACK_OCEAN_RATES: Record<VehicleSize, number> = {
  sedan: 875,
  small_suv: 950,
  medium_suv: 1100,
  large_suv: 1250,
  xl_suv: 1650,
  special: 1650,
};

// ─── Obtener tarifa de grúa desde la DB ───────────────────────────────────────
export async function getInlandRate(
  stateCode: string,
  platform: AuctionPlatform,
  city?: string | null
): Promise<{ rate: number; source: "exact" | "state_avg" | "fallback"; city?: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const state = stateCode.toUpperCase();

    // 1. Buscar por ciudad exacta + plataforma
    if (city) {
      const cityNormalized = city.replace(/\s+/g, " ").trim();
      const exactMatch = await db
        .select()
        .from(shippingRates)
        .where(and(
          eq(shippingRates.stateCode, state),
          eq(shippingRates.brand, platform),
          eq(shippingRates.city, cityNormalized)
        ))
        .limit(1);

      if (exactMatch[0]) {
        return { rate: exactMatch[0].inlandRateUsd, source: "exact", city: exactMatch[0].city };
      }

      // 2. Buscar por ciudad sin importar plataforma
      const cityAnyBrand = await db
        .select()
        .from(shippingRates)
        .where(and(
          eq(shippingRates.stateCode, state),
          eq(shippingRates.city, cityNormalized)
        ))
        .limit(1);

      if (cityAnyBrand[0]) {
        return { rate: cityAnyBrand[0].inlandRateUsd, source: "exact", city: cityAnyBrand[0].city };
      }
    }

    // 3. Promedio del estado + plataforma
    const stateRates = await db
      .select()
      .from(shippingRates)
      .where(and(
        eq(shippingRates.stateCode, state),
        eq(shippingRates.brand, platform)
      ));

    if (stateRates.length > 0) {
      const avg = Math.round(stateRates.reduce((sum, r) => sum + r.inlandRateUsd, 0) / stateRates.length);
      return { rate: avg, source: "state_avg" };
    }

    // 4. Promedio del estado cualquier plataforma
    const stateAny = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.stateCode, state));

    if (stateAny.length > 0) {
      const avg = Math.round(stateAny.reduce((sum, r) => sum + r.inlandRateUsd, 0) / stateAny.length);
      return { rate: avg, source: "state_avg" };
    }

    throw new Error("No rates found");
  } catch {
    // Fallback a tabla estática
    const rate = FALLBACK_INLAND_RATES[stateCode.toUpperCase()] ?? 850;
    return { rate, source: "fallback" };
  }
}

// ─── Obtener tarifa de flete marítimo desde la DB ─────────────────────────────
export async function getOceanRate(vehicleSize: VehicleSize): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const sizeKey = vehicleSize === "special" ? "xl_suv" : vehicleSize;
    const result = await db
      .select()
      .from(oceanRates)
      .where(eq(oceanRates.vehicleSize, sizeKey))
      .limit(1);

    if (result[0]) return result[0].rateUsd;
    throw new Error("Rate not found");
  } catch {
    return FALLBACK_OCEAN_RATES[vehicleSize] ?? 1100;
  }
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

// ─── Calculadora Principal (async — usa DB para tarifas reales) ───────────────

export interface ImportCalculationInput {
  auctionPrice: number;
  platform: AuctionPlatform;
  stateCode: string;
  bodyType: string | null;
  exchangeRate: number;
  city?: string | null;
  /**
   * Ganancia interna de Ruta Cars en USD (se suma al Transporte USA, invisible al cliente).
   * Por defecto: $500 USD
   */
  internalProfitUSD?: number;
  /** Make del vehículo (para buscar precio de mercado GT) */
  make?: string | null;
  /** Model del vehículo (para buscar precio de mercado GT) */
  model?: string | null;
  /** Año del vehículo (para buscar precio de mercado GT) */
  year?: number | null;
  /** Ganancia mínima en quetzales (por defecto Q10,000) */
  minProfitGTQ?: number;
}

export interface ImportCalculationResult {
  // Costos reales en USD (lo que el cliente ve en el desglose)
  auctionPrice: number;
  platformFees: PlatformFees;
  usaTransport: number;          // Grúa real Royal Shipping + ganancia oculta
  usaTransportBase: number;      // Grúa real Royal Shipping (sin ganancia)
  maritimeShipping: number;      // Flete marítimo real Royal Shipping
  cifValue: number;
  guatemalaTax: number;          // 32% sobre CIF
  miscExpensesGTQ: number;       // Q5,000 gastos varios
  rutaCarsServiceUSD: number;    // $500 visible al cliente
  totalCostUSD: number;

  // Precio final al cliente
  finalPriceUSD: number;
  finalPriceGTQ: number;
  exchangeRate: number;

  // Info de tarifas usadas
  vehicleSize: VehicleSizeInfo;
  needsManualQuote: boolean;
  /** Razón por la que se requiere cotización manual */
  manualQuoteReason?: "special_vehicle" | "low_profit";
  inlandRateSource: "exact" | "state_avg" | "fallback";
  inlandCity?: string;

  // Información de mercado GT (para uso interno del sistema)
  gtMarketPriceGTQ?: number;     // Precio de mercado GT encontrado en DB
  gtMarketSource?: "exact" | "model_avg"; // Fuente del precio de mercado
  estimatedProfitGTQ?: number;   // Ganancia estimada en quetzales

  // Desglose visible al cliente
  breakdown: { label: string; amountUSD: number; amountGTQ: number }[];
}

export async function calculateImportCost(input: ImportCalculationInput): Promise<ImportCalculationResult> {
  const { auctionPrice, platform, stateCode, bodyType, exchangeRate, city } = input;
  const minProfitGTQ = input.minProfitGTQ ?? MIN_PROFIT_GTQ;

  // 1. Fees de plataforma
  const platformFees = platform === "copart"
    ? calculateCopartFees(auctionPrice)
    : calculateIAAIFees(auctionPrice);

  // 2. Tamaño del vehículo
  const vehicleSize = detectVehicleSize(bodyType);

  // Si el vehículo es especial, retornar cotización manual inmediatamente
  if (vehicleSize.needsManualQuote) {
    const inlandInfo = await getInlandRate(stateCode, platform, city);
    const usaTransportBase = inlandInfo.rate;
    const usaTransport = usaTransportBase + RUTA_CARS_PROFIT_USD;
    const maritimeShipping = await getOceanRate(vehicleSize.size);
    const cifValue = auctionPrice + platformFees.total + usaTransport + maritimeShipping;
    const guatemalaTax = Math.round(cifValue * 0.32);
    const miscExpensesGTQ = 5000;
    const rutaCarsServiceUSD = 500;
    const totalCostUSD = cifValue + guatemalaTax / exchangeRate + miscExpensesGTQ / exchangeRate + rutaCarsServiceUSD;
    const finalPriceGTQ = Math.round(totalCostUSD * exchangeRate);
    const finalPriceUSD = Math.round(finalPriceGTQ / exchangeRate);
    return {
      auctionPrice, platformFees, usaTransport, usaTransportBase, maritimeShipping,
      cifValue, guatemalaTax, miscExpensesGTQ, rutaCarsServiceUSD, totalCostUSD,
      finalPriceUSD, finalPriceGTQ, exchangeRate, vehicleSize,
      needsManualQuote: true, manualQuoteReason: "special_vehicle",
      inlandRateSource: inlandInfo.source, inlandCity: inlandInfo.city,
      breakdown: [],
    };
  }

  // 3. Tarifa de grúa real de Royal Shipping (desde DB)
  const inlandInfo = await getInlandRate(stateCode, platform, city);
  const usaTransportBase = inlandInfo.rate;

  // 4. Flete marítimo real de Royal Shipping (desde DB, por tamaño)
  const maritimeShipping = await getOceanRate(vehicleSize.size);

  // 5. Calcular costo base de importación (sin ganancia de Ruta Cars)
  const baseCostWithoutProfit = auctionPrice + platformFees.total + usaTransportBase + maritimeShipping;
  const baseTaxWithoutProfit = Math.round(baseCostWithoutProfit * 0.32);
  const miscExpensesGTQ = 5000;
  const rutaCarsServiceUSD = 500;
  const baseTotalCostGTQ = Math.round(
    (baseCostWithoutProfit + baseTaxWithoutProfit / exchangeRate + miscExpensesGTQ / exchangeRate + rutaCarsServiceUSD) * exchangeRate
  );

  // 6. Buscar precio de mercado GT (si se proporcionaron make/model)
  let gtMarketPriceGTQ: number | undefined;
  let gtMarketSource: "exact" | "model_avg" | undefined;
  let dynamicProfitGTQ = 0;

  if (input.make && input.model) {
    const marketData = await getGtMarketPrice(input.make, input.model, input.year ?? null);
    if (marketData) {
      gtMarketPriceGTQ = marketData.priceGtq;
      gtMarketSource = marketData.source;
      // Precio al cliente = precio mercado GT × 0.87 (13% más barato que mercado local)
      const targetClientPriceGTQ = Math.round(marketData.priceGtq * MARKET_DISCOUNT_FACTOR);
      dynamicProfitGTQ = targetClientPriceGTQ - baseTotalCostGTQ;
    }
  }

  // 7. Determinar ganancia final
  let internalProfitUSD: number;
  let needsManualQuote = false;
  let manualQuoteReason: "special_vehicle" | "low_profit" | undefined;

  if (gtMarketPriceGTQ) {
    // Tenemos precio de mercado GT: usar ganancia dinámica
    if (dynamicProfitGTQ < minProfitGTQ) {
      // Ganancia insuficiente: solicitar cotización manual
      needsManualQuote = true;
      manualQuoteReason = "low_profit";
      // Calcular con ganancia mínima de todas formas para tener los números
      internalProfitUSD = Math.ceil(minProfitGTQ / exchangeRate);
    } else {
      // Ganancia dinámica: diferencia entre precio objetivo y costo base
      internalProfitUSD = Math.ceil(dynamicProfitGTQ / exchangeRate);
    }
  } else {
    // Sin datos de mercado GT: usar ganancia fija de $500
    internalProfitUSD = input.internalProfitUSD ?? RUTA_CARS_PROFIT_USD;
  }

  // 8. Calcular totales con la ganancia determinada
  const usaTransport = usaTransportBase + internalProfitUSD;
  const cifValue = auctionPrice + platformFees.total + usaTransport + maritimeShipping;
  const guatemalaTax = Math.round(cifValue * 0.32);
  const totalCostUSD = cifValue + guatemalaTax / exchangeRate + miscExpensesGTQ / exchangeRate + rutaCarsServiceUSD;
  const finalPriceGTQ = Math.round(totalCostUSD * exchangeRate);
  const finalPriceUSD = Math.round(finalPriceGTQ / exchangeRate);
  const estimatedProfitGTQ = finalPriceGTQ - baseTotalCostGTQ;

  // Desglose visible al cliente
  const breakdown = [
    { label: "Precio de Subasta", amountUSD: auctionPrice, amountGTQ: Math.round(auctionPrice * exchangeRate) },
    { label: `Fees ${platform === "copart" ? "Copart" : "IAAI"} + Autobid`, amountUSD: platformFees.total, amountGTQ: Math.round(platformFees.total * exchangeRate) },
    { label: "Transporte USA (grúa al puerto)", amountUSD: usaTransport, amountGTQ: Math.round(usaTransport * exchangeRate) },
    { label: "Flete Marítimo (Royal Shipping)", amountUSD: maritimeShipping, amountGTQ: Math.round(maritimeShipping * exchangeRate) },
    { label: "Impuestos Guatemala (32% CIF)", amountUSD: Math.round(guatemalaTax / exchangeRate), amountGTQ: guatemalaTax },
    { label: "Gastos Varios (trámites, aduana)", amountUSD: Math.round(miscExpensesGTQ / exchangeRate), amountGTQ: miscExpensesGTQ },
    { label: "Gestión Internacional Ruta Cars", amountUSD: rutaCarsServiceUSD, amountGTQ: Math.round(rutaCarsServiceUSD * exchangeRate) },
  ];

  return {
    auctionPrice,
    platformFees,
    usaTransport,
    usaTransportBase,
    maritimeShipping,
    cifValue,
    guatemalaTax,
    miscExpensesGTQ,
    rutaCarsServiceUSD,
    totalCostUSD,
    finalPriceUSD,
    finalPriceGTQ,
    exchangeRate,
    vehicleSize,
    needsManualQuote,
    manualQuoteReason,
    inlandRateSource: inlandInfo.source,
    inlandCity: inlandInfo.city,
    gtMarketPriceGTQ,
    gtMarketSource,
    estimatedProfitGTQ,
    breakdown,
  };
}

// ─── Versión síncrona (para uso en cliente/frontend con datos estáticos) ──────
// Usa las tarifas de fallback sin consultar la DB
export function calculateImportCostSync(input: Omit<ImportCalculationInput, 'city'>): Omit<ImportCalculationResult, 'inlandRateSource' | 'inlandCity'> {
  const { auctionPrice, platform, stateCode, bodyType, exchangeRate } = input;
  const internalProfitUSD = input.internalProfitUSD ?? RUTA_CARS_PROFIT_USD;

  const platformFees = platform === "copart"
    ? calculateCopartFees(auctionPrice)
    : calculateIAAIFees(auctionPrice);

  const vehicleSize = detectVehicleSize(bodyType);
  const needsManualQuote = vehicleSize.needsManualQuote;

  const usaTransportBase = FALLBACK_INLAND_RATES[stateCode.toUpperCase()] ?? 850;
  const usaTransport = usaTransportBase + internalProfitUSD;
  const maritimeShipping = FALLBACK_OCEAN_RATES[vehicleSize.size] ?? 1100;

  const cifValue = auctionPrice + platformFees.total + usaTransport + maritimeShipping;
  const guatemalaTax = Math.round(cifValue * 0.32);
  const miscExpensesGTQ = 5000;
  const rutaCarsServiceUSD = 500;

  const totalCostUSD = cifValue + guatemalaTax / exchangeRate + miscExpensesGTQ / exchangeRate + rutaCarsServiceUSD;
  const finalPriceGTQ = Math.round(totalCostUSD * exchangeRate);
  const finalPriceUSD = Math.round(finalPriceGTQ / exchangeRate);

  const breakdown = [
    { label: "Precio de Subasta", amountUSD: auctionPrice, amountGTQ: Math.round(auctionPrice * exchangeRate) },
    { label: `Fees ${platform === "copart" ? "Copart" : "IAAI"} + Autobid`, amountUSD: platformFees.total, amountGTQ: Math.round(platformFees.total * exchangeRate) },
    { label: "Transporte USA (grúa al puerto)", amountUSD: usaTransport, amountGTQ: Math.round(usaTransport * exchangeRate) },
    { label: "Flete Marítimo (Royal Shipping)", amountUSD: maritimeShipping, amountGTQ: Math.round(maritimeShipping * exchangeRate) },
    { label: "Impuestos Guatemala (32% CIF)", amountUSD: Math.round(guatemalaTax / exchangeRate), amountGTQ: guatemalaTax },
    { label: "Gastos Varios (trámites, aduana)", amountUSD: Math.round(miscExpensesGTQ / exchangeRate), amountGTQ: miscExpensesGTQ },
    { label: "Servicio Ruta Cars GT", amountUSD: rutaCarsServiceUSD, amountGTQ: Math.round(rutaCarsServiceUSD * exchangeRate) },
  ];

  return {
    auctionPrice, platformFees, usaTransport, usaTransportBase, maritimeShipping,
    cifValue, guatemalaTax, miscExpensesGTQ, rutaCarsServiceUSD, totalCostUSD,
    finalPriceUSD, finalPriceGTQ, exchangeRate, vehicleSize, needsManualQuote,
    manualQuoteReason: vehicleSize.needsManualQuote ? "special_vehicle" as const : undefined,
    breakdown,
  };
}

// ─── Exportar datos estáticos para uso en cliente ─────────────────────────────
export const USA_TRANSPORT_RATES = Object.entries(FALLBACK_INLAND_RATES).map(([stateCode, rate]) => ({
  stateCode,
  rate,
}));

export const OCEAN_RATES_BY_SIZE = FALLBACK_OCEAN_RATES;
