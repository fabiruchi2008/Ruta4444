import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Car, Fuel, Gauge, Calendar, MapPin,
  Calculator, MessageCircle, Tag, Zap, ChevronDown, ChevronUp,
  RotateCcw, Gavel, Key, Settings2, ShieldCheck, ArrowUpDown,
  ChevronLeft, ChevronRight, SlidersHorizontal, CheckSquare, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// ─── Traducciones ─────────────────────────────────────────────────────────────

const FUEL_ES: Record<string, string> = {
  gasoline: "Gasolina", petrol: "Gasolina", gas: "Gasolina",
  diesel: "Diésel", hybrid: "Híbrido", electric: "Eléctrico",
  flexible: "Flex (E85)", "plug-in hybrid": "Híbrido Enchufable",
  "gas/electric hybrid": "Híbrido Gas/Eléctrico",
  "natural gas": "Gas Natural", propane: "Propano",
};

const TRANSMISSION_ES: Record<string, string> = {
  automatic: "Automático", manual: "Manual", cvt: "CVT",
  "automated manual": "Manual Automatizado", "dual clutch": "Doble Embrague",
};

const CONDITION_ES: Record<string, string> = {
  run_and_drives: "Enciende y Maneja", "run and drives": "Enciende y Maneja",
  engine_starts: "Motor Enciende", "engine starts": "Motor Enciende",
  not_run: "No Enciende", "does not run": "No Enciende",
  enhanced: "Mejorado", stationary: "Estacionario",
};

const DAMAGE_ES: Record<string, string> = {
  "front end": "Daño Frontal", "rear end": "Daño Trasero",
  "left side": "Lado Izquierdo", "right side": "Lado Derecho",
  "all over": "Daño General", flood: "Inundación", "water/flood": "Inundación/Agua",
  "normal wear": "Desgaste Normal", "normal wear & tear": "Desgaste Normal",
  vandalism: "Vandalismo", "theft recovery": "Recuperado de Robo",
  fire: "Incendio", hail: "Granizo", rollover: "Volcadura",
  "mechanical/engine": "Mecánico/Motor", "front & rear": "Frontal y Trasero",
  "left front": "Frontal Izquierdo", "right front": "Frontal Derecho",
  "left rear": "Trasero Izquierdo", "right rear": "Trasero Derecho",
  "minor dents/scratches": "Golpes y Rayones", "burn - engine": "Quemado - Motor",
  rear: "Trasero", front: "Frontal", roll: "Volcadura",
  "top/roof": "Techo", undercarriage: "Chasis",
};

const BODY_TYPE_ES: Record<string, string> = {
  sedan: "Sedán", suv: "SUV", pickup: "Pickup / Camioneta",
  van: "Van / Furgoneta", coupe: "Coupé", hatchback: "Hatchback",
  wagon: "Familiar / Wagon", convertible: "Convertible",
  truck: "Camión", minivan: "Minivan", crossover: "Crossover",
};

function tES(map: Record<string, string>, val: string | null | undefined): string {
  if (!val) return "";
  return map[val.toLowerCase()] ?? val;
}

// ─── Static filter data ───────────────────────────────────────────────────────

const DOMAINS = [
  { id: 3, label: "Copart", color: "#00C8E0" },
  { id: 1, label: "IAAI", color: "#F97316" },
];

const BODY_TYPES = [
  { id: 1, label: "Sedán" }, { id: 2, label: "Familiar / Wagon" },
  { id: 3, label: "Coupé" }, { id: 4, label: "Pickup / Camioneta" },
  { id: 5, label: "SUV" }, { id: 6, label: "Convertible" },
  { id: 7, label: "Van / Furgoneta" }, { id: 11, label: "Hatchback" },
  { id: 20, label: "Liftback" }, { id: 27, label: "Auto Deportivo" },
];

const FUEL_TYPES = [
  { id: 1, label: "Gasolina" }, { id: 2, label: "Diésel" },
  { id: 3, label: "Híbrido" }, { id: 4, label: "Eléctrico" },
  { id: 5, label: "Flex (E85)" }, { id: 6, label: "Gas Natural" },
];

const TRANSMISSIONS = [
  { id: 1, label: "Automático" }, { id: 2, label: "Manual" },
  { id: 3, label: "CVT" }, { id: 4, label: "Doble Embrague" },
];

const DRIVE_WHEELS = [
  { id: 1, label: "Delantera (FWD)" }, { id: 2, label: "Trasera (RWD)" },
  { id: 3, label: "4x4 (4WD)" }, { id: 4, label: "AWD (Todo Terreno)" },
];

const RUN_CONDITIONS = [
  { id: 0, label: "Enciende y Avanza" },
  { id: 6, label: "Motor Enciende" },
  { id: 3, label: "No Enciende" },
  { id: 7, label: "Mejorado" },
];

const CYLINDERS = [3, 4, 5, 6, 8, 10, 12];

const TITLE_CONDITIONS = [
  { id: 1, label: "Salvage" }, { id: 2, label: "Clean" },
  { id: 3, label: "Rebuilt" }, { id: 4, label: "Parts Only" },
];

const SALE_DATE_OPTIONS = [
  { value: 1, label: "Hoy" }, { value: 3, label: "Próximos 3 días" },
  { value: 7, label: "Esta semana" }, { value: 14, label: "Próximas 2 semanas" },
  { value: 30, label: "Este mes" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

function normalizeVehicle(raw: any) {
  const lots: any[] = Array.isArray(raw.lots) ? raw.lots : [];
  const firstLot = lots[0] || {};

  // Plataforma: lot.domain.id (objeto) o fallback
  const platformId = firstLot.domain?.id ?? firstLot.domain_id ?? raw.domain_id;
  const platformLabel = platformId === 3 ? "Copart" : platformId === 1 ? "IAAI" : "Subasta";
  const platformColor = platformId === 3 ? "#00C8E0" : platformId === 1 ? "#F97316" : "#8B5CF6";

  // Precio: buy_now y bid desde el lot
  let buyNowPrice: number | null = null;
  for (const lot of lots) {
    const bn = lot.buy_now ?? lot.buy_now_price;
    if (bn && Number(bn) > 0) { buyNowPrice = Number(bn); break; }
  }
  const bidPrice = Number(firstLot.bid ?? firstLot.final_bid ?? 0) || 0;

  // Imágenes: lot.images.normal o small
  const images = firstLot.images?.normal || firstLot.images?.small || [];
  const primaryImage = (Array.isArray(images) ? images[0] : null) || raw.image_url || null;

  // Ubicación: lot.location es objeto { state: { code }, city }
  const stateCode = firstLot.location?.state?.code ?? firstLot.state_code ?? raw.state_code ?? "";
  const location = firstLot.location?.city ?? firstLot.location ?? raw.location ?? "";

  // Odómetro: lot.odometer.mi
  const odometer = firstLot.odometer?.mi ?? firstLot.odometer_mi ?? raw.odometer ?? null;

  // Daño: lot.damage.main.name
  const damageType = firstLot.damage?.main?.name ?? firstLot.damage?.name ?? firstLot.damage ?? raw.damage_type ?? "";

  // Condición: lot.condition puede ser objeto o string
  const condition = (typeof firstLot.condition === "object" ? firstLot.condition?.name : firstLot.condition) ?? raw.condition ?? "";

  // Combustible: v.fuel.name (no fuel_type)
  const fuelType = raw.fuel?.name ?? raw.fuel_type?.name ?? raw.fuel_type ?? "";

  // Lot number: firstLot.lot o lot_number
  const lotNumber = firstLot.lot ?? firstLot.lot_number ?? raw.lot_number ?? raw.id;

  // Fecha de venta
  const saleDate = firstLot.sale_date ?? raw.sale_date ?? null;

  return {
    id: raw.id,
    lotNumber,
    vin: raw.vin ?? "",
    year: raw.year ?? 0,
    make: raw.manufacturer?.name ?? (typeof raw.make === "string" ? raw.make : ""),
    model: raw.model?.name ?? (typeof raw.model === "string" ? raw.model : ""),
    bodyType: raw.body_type?.name ?? (typeof raw.body_type === "string" ? raw.body_type : ""),
    fuelType,
    transmission: raw.transmission?.name ?? (typeof raw.transmission === "string" ? raw.transmission : ""),
    condition: typeof condition === "string" ? condition : "",
    damageType: typeof damageType === "string" ? damageType : "",
    odometer,
    stateCode,
    location: typeof location === "string" ? location : "",
    saleDate,
    primaryImage,
    bidPrice,
    buyNowPrice,
    platformLabel,
    platformColor,
    cylinders: raw.cylinders ?? firstLot.cylinders ?? null,
    engineSize: raw.engine_size ?? null,
    driveWheel: raw.drive_wheel?.name ?? (typeof raw.drive_wheel === "string" ? raw.drive_wheel : ""),
    color: raw.color?.name ?? (typeof raw.color === "string" ? raw.color : ""),
    keys: firstLot.keys ?? null,
  };
}

function detectSearchType(q: string): "vin" | "lot" | "general" {
  const clean = q.trim();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return "vin";
  if (/^\d{6,12}$/.test(clean)) return "lot";
  return "general";
}

// ─── Persist catalog state ────────────────────────────────────────────────────

const STORAGE_KEY = "rutacars_catalog_filters_v4"; // v4: IDs de condición corregidos (0=run_and_drives, 6=engine_starts)

type CatalogFilters = {
  search_query: string;
  domain_id: number | undefined;
  manufacturer_id: number | undefined;
  model_id: number | undefined;
  from_year: number | undefined;
  to_year: number | undefined;
  bid_price_from: number | undefined;
  bid_price_to: number | undefined;
  buy_now_price_from: number | undefined;
  buy_now_price_to: number | undefined;
  body_type: number | undefined;
  state_code: string | undefined;
  buy_now: number | undefined;
  damage: string | undefined;
  fuel_type: number | undefined;
  transmission: number | undefined;
  drive_wheel: number | undefined;
  color: number | undefined;
  cylinders: number | undefined;
  condition: number | undefined;
  odometer_from_mi: number | undefined;
  odometer_to_mi: number | undefined;
  sale_date_in_days: number | undefined;
  sort: string | undefined;
  order: "asc" | "desc" | undefined;
  page: number;
  per_page: number;
};

const DEFAULT_FILTERS: CatalogFilters = {
  search_query: "", domain_id: undefined, manufacturer_id: undefined,
  model_id: undefined, from_year: undefined, to_year: undefined,
  bid_price_from: undefined, bid_price_to: undefined,
  buy_now_price_from: undefined, buy_now_price_to: undefined,
  body_type: undefined, state_code: undefined, buy_now: undefined,
  damage: undefined, fuel_type: undefined, transmission: undefined,
  drive_wheel: undefined, color: undefined, cylinders: undefined,
  condition: undefined, odometer_from_mi: undefined, odometer_to_mi: undefined,
  sale_date_in_days: undefined, sort: undefined, order: undefined,
  page: 1, per_page: 20,
};

function loadSavedFilters(): Partial<CatalogFilters> | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function countActiveFilters(f: CatalogFilters): number {
  const keys: (keyof CatalogFilters)[] = [
    "domain_id","manufacturer_id","model_id","from_year","to_year",
    "bid_price_from","bid_price_to","buy_now_price_from","buy_now_price_to",
    "body_type","state_code","buy_now","damage","fuel_type","transmission",
    "drive_wheel","color","cylinders","condition","odometer_from_mi",
    "odometer_to_mi","sale_date_in_days",
  ];
  return keys.filter(k => f[k] !== undefined && f[k] !== "").length;
}

// ─── VehicleRow (horizontal list item) ───────────────────────────────────────

function VehicleRow({ vehicle: rawVehicle }: { vehicle: any }) {
  const v = normalizeVehicle(rawVehicle);
  const fuelLabel = tES(FUEL_ES, v.fuelType);
  const transmissionLabel = tES(TRANSMISSION_ES, v.transmission);
  const conditionLabel = tES(CONDITION_ES, v.condition);
  const damageLabel = tES(DAMAGE_ES, v.damageType);

  const whatsappBuyNow = encodeURIComponent(
    `Hola Ruta Cars GT! Quiero COMPRAR AHORA el ${v.year} ${v.make} ${v.model} (Lote: ${v.lotNumber}) a $${v.buyNowPrice?.toLocaleString()} en ${v.platformLabel}. ¿Cómo procedo?`
  );
  const whatsappAuction = encodeURIComponent(
    `Hola Ruta Cars GT, me interesa el ${v.year} ${v.make} ${v.model} (Lote: ${v.lotNumber || v.id}) en ${v.platformLabel}`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] border border-[#1F2D45] rounded-xl overflow-hidden hover:border-[#00C8E0]/30 transition-all duration-200 group"
    >
      <div className="flex flex-col sm:flex-row">
        {/* ── Image ── */}
        <div className="relative sm:w-52 lg:w-60 flex-shrink-0 bg-[#0B1120] overflow-hidden">
          <div className="aspect-[4/3] sm:aspect-auto sm:h-full min-h-[140px]">
            {v.primaryImage ? (
              <img
                src={v.primaryImage}
                alt={`${v.year} ${v.make} ${v.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-12 h-12 text-[#1F2D45]" />
              </div>
            )}
          </div>

          {/* Platform badge */}
          <div className="absolute top-2 left-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase"
              style={{ backgroundColor: v.platformColor, color: "#080D18" }}
            >
              {v.platformLabel}
            </span>
          </div>

          {/* Sale date */}
          {v.saleDate && (
            <div className="absolute bottom-2 left-2 right-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 font-medium">
                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                {formatDate(v.saleDate)}
              </span>
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4 min-w-0">
          {/* Left: title + specs */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title row */}
            <div>
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base leading-tight tracking-tight">
                  {v.year} {v.make?.toUpperCase()} {v.model}
                </h3>
                {v.buyNowPrice && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 uppercase tracking-wider flex-shrink-0">
                    Comprar Ahora
                  </span>
                )}
              </div>
              {/* VIN + Lot */}
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {v.vin && (
                  <span className="text-slate-500 text-[10px] font-mono flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> {v.vin}
                  </span>
                )}
                {v.lotNumber && (
                  <span className="text-slate-500 text-[10px] font-mono flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {v.lotNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Spec pills */}
            <div className="flex flex-wrap gap-1.5">
              {v.keys !== null && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  v.keys ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  <Key className="w-2.5 h-2.5" />
                  {v.keys ? "Llaves disponibles" : "Sin llaves"}
                </span>
              )}
              {transmissionLabel && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1F2D45] text-slate-300 border border-[#243048]">
                  <Settings2 className="w-2.5 h-2.5" /> {transmissionLabel}
                </span>
              )}
              {v.driveWheel && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1F2D45] text-slate-300 border border-[#243048]">
                  {v.driveWheel}
                </span>
              )}
              {v.cylinders && v.engineSize && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1F2D45] text-slate-300 border border-[#243048]">
                  {v.engineSize} · {v.cylinders} cil.
                </span>
              )}
              {fuelLabel && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1F2D45] text-slate-300 border border-[#243048]">
                  <Fuel className="w-2.5 h-2.5" /> {fuelLabel}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {v.odometer != null && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Odómetro</span>
                  <span className="font-semibold text-slate-200">{v.odometer.toLocaleString()} mi</span>
                </div>
              )}
              {(v.location || v.stateCode) && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Ubicación</span>
                  <span className="font-semibold text-slate-200 truncate">{v.location || v.stateCode}</span>
                </div>
              )}
              {damageLabel && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Daño</span>
                  <span className="font-semibold text-amber-400">{damageLabel}</span>
                </div>
              )}
              {conditionLabel && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Condición</span>
                  <span className={`font-semibold ${
                    conditionLabel === "Enciende y Maneja" ? "text-green-400"
                    : conditionLabel === "Motor Enciende" ? "text-yellow-400"
                    : "text-red-400"
                  }`}>{conditionLabel}</span>
                </div>
              )}
              {v.color && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Color</span>
                  <span className="font-semibold text-slate-200">{v.color}</span>
                </div>
              )}
              {v.saleDate && (
                <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                  <span className="text-slate-600 text-[9px] font-semibold uppercase tracking-wider w-16 flex-shrink-0">Subasta</span>
                  <span className="font-semibold text-orange-400">
                    {new Date(v.saleDate).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: prices + actions */}
          <div className="sm:w-44 lg:w-52 flex-shrink-0 flex flex-col justify-between gap-3">
            {/* Prices */}
            <div className="space-y-2">
              {/* Buy Now price — highlighted */}
              {v.buyNowPrice && (
                <div className="bg-[#0d2818] border border-[#22c55e]/25 rounded-lg p-2.5">
                  <p className="text-[#22c55e] text-[9px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Comprar Ahora
                  </p>
                  <p className="text-[#22c55e] font-extrabold text-xl leading-none">
                    ${v.buyNowPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Bid / Auction price */}
              {v.bidPrice > 0 && (
                <div className="bg-[#0a1828] border border-[#00C8E0]/20 rounded-lg p-2.5">
                  <p className="text-[#00C8E0] text-[9px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <Gavel className="w-2.5 h-2.5" />
                    {v.buyNowPrice ? "Puja Actual" : "Subasta Actual"}
                  </p>
                  <p className="text-[#00C8E0] font-extrabold text-xl leading-none">
                    ${v.bidPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {!v.bidPrice && !v.buyNowPrice && (
                <div className="bg-[#111827] border border-[#1F2D45] rounded-lg p-2.5">
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">Precio</p>
                  <p className="text-slate-500 text-sm font-semibold">Sin precio</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-1.5">
              {v.buyNowPrice ? (
                <>
                  <a
                    href={`https://wa.me/50231220803?text=${whatsappBuyNow}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <button className="w-full py-2 px-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <Zap className="w-3 h-3" /> Comprar Ahora
                    </button>
                  </a>
                  <Link href={`/vehiculo/${v.lotNumber || v.id}`} className="block">
                    <button className="w-full py-2 px-3 rounded-lg bg-[#1F2D45] hover:bg-[#243048] text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#243048]">
                      <Calculator className="w-3 h-3" /> Ver Costos
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/vehiculo/${v.lotNumber || v.id}`} className="block">
                    <button className="w-full py-2 px-3 rounded-lg bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <Calculator className="w-3 h-3" /> Ver Costos
                    </button>
                  </Link>
                  <a
                    href={`https://wa.me/50231220803?text=${whatsappAuction}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <button className="w-full py-2 px-3 rounded-lg bg-[#1F2D45] hover:bg-[#243048] text-[#25D366] hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#243048]">
                      <MessageCircle className="w-3 h-3" /> Consultar
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="bg-[#111827] border border-[#1F2D45] rounded-xl overflow-hidden">
      <div className="flex">
        <div className="w-52 h-40 shimmer flex-shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-5 shimmer rounded w-2/3" />
          <div className="h-3 shimmer rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 shimmer rounded-full w-20" />
            <div className="h-5 shimmer rounded-full w-16" />
            <div className="h-5 shimmer rounded-full w-18" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 shimmer rounded w-full" />
            <div className="h-3 shimmer rounded w-full" />
          </div>
        </div>
        <div className="w-44 p-4 space-y-2 flex-shrink-0">
          <div className="h-14 shimmer rounded-lg" />
          <div className="h-8 shimmer rounded-lg" />
          <div className="h-8 shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar filter section ───────────────────────────────────────────────────

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1F2D45] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-[#1F2D45]/30 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Catalogo() {
  const savedFilters = loadSavedFilters();
  const [filters, setFilters] = useState<CatalogFilters>({
    ...DEFAULT_FILTERS,
    ...(savedFilters || {}),
  });

  const [catalogReady, setCatalogReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCatalogReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search_query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search_query), 600);
    return () => clearTimeout(t);
  }, [filters.search_query]);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  // Staggered filter data loading
  const [manufacturersEnabled, setManufacturersEnabled] = useState(false);
  const [damagesEnabled, setDamagesEnabled] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setManufacturersEnabled(true), 1500);
    const t2 = setTimeout(() => setDamagesEnabled(true), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const { data: manufacturers } = trpc.vehicles.manufacturers.useQuery(undefined, {
    enabled: manufacturersEnabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
  const { data: models } = trpc.vehicles.models.useQuery(
    { manufacturerId: filters.manufacturer_id! },
    { enabled: manufacturersEnabled && !!filters.manufacturer_id, staleTime: 60 * 60 * 1000 }
  );
  const { data: damagesData } = trpc.vehicles.damages.useQuery(undefined, {
    enabled: damagesEnabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  const allMakes: any[] = useMemo(() => {
    const list = (manufacturers as any)?.data || [];
    if (!makeSearch.trim()) return list;
    return list.filter((m: any) => m.name?.toLowerCase().includes(makeSearch.toLowerCase()));
  }, [manufacturers, makeSearch]);

  const damages: any[] = useMemo(() => (damagesData as any)?.data || [], [damagesData]);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  const debouncedFilters = useMemo(
    () => ({ ...filters, search_query: debouncedSearch }),
    [filters, debouncedSearch]
  );
  const searchType = detectSearchType(debouncedSearch);

  const queryInput = useMemo(() => {
    const isBuyNow = debouncedFilters.buy_now === 1;
    return {
      ...debouncedFilters,
      status: 0,
      ...(isBuyNow ? {} : { exclude_expired_auctions: 1 }),
    };
  }, [debouncedFilters]);

  const vinQuery = trpc.vehicles.searchByVin.useQuery(
    { vin: debouncedSearch.trim() },
    { enabled: searchType === "vin" && debouncedSearch.trim().length === 17 }
  );
  const lotQuery = trpc.vehicles.searchByLot.useQuery(
    { lot: debouncedSearch.trim() },
    { enabled: searchType === "lot" && debouncedSearch.trim().length >= 6 }
  );
  const generalQuery = trpc.vehicles.search.useQuery(queryInput, {
    enabled: catalogReady && searchType === "general",
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const isLoading = searchType === "vin" ? vinQuery.isLoading : searchType === "lot" ? lotQuery.isLoading : generalQuery.isLoading;
  const error = searchType === "vin" ? vinQuery.error : searchType === "lot" ? lotQuery.error : generalQuery.error;
  const rawData = searchType === "vin" ? vinQuery.data : searchType === "lot" ? lotQuery.data : generalQuery.data;
  const vehicles = (rawData as any)?.data || (Array.isArray(rawData) ? rawData : []);
  const total = (rawData as any)?.meta?.total ?? (rawData as any)?.meta?.to ?? vehicles.length;
  const totalPages = Math.ceil(total / filters.per_page);

  const activeFilterCount = countActiveFilters(filters);

  function clearFilters() {
    setFilters({ ...DEFAULT_FILTERS });
    setMakeSearch("");
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const selectClass = "bg-[#0B1120] border-[#1F2D45] text-slate-300 focus:border-[#00C8E0]/50 h-8 text-xs";
  const inputClass = "bg-[#0B1120] border-[#1F2D45] text-white placeholder:text-slate-600 focus:border-[#00C8E0]/50 h-8 text-xs";

  // ── Sidebar JSX ──
  const sidebarContent = (
    <div className="bg-[#0B1120] border border-[#1F2D45] rounded-xl overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2D45] bg-[#111827]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#00C8E0]" />
          <span className="text-sm font-bold text-white">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#00C8E0] text-[#080D18] text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 font-medium">
            <RotateCcw className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Buy Now toggle */}
      <div className="px-4 py-3 border-b border-[#1F2D45]">
        <button
          onClick={() => setFilters(f => ({ ...f, buy_now: f.buy_now === 1 ? undefined : 1, page: 1 }))}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${
            filters.buy_now === 1
              ? "bg-[#0d2818] border-[#22c55e]/50 text-[#22c55e]"
              : "bg-[#111827] border-[#1F2D45] text-slate-400 hover:border-[#22c55e]/30 hover:text-[#22c55e]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Solo Comprar Ahora
          </span>
          {filters.buy_now === 1
            ? <CheckSquare className="w-4 h-4" />
            : <Square className="w-4 h-4 text-slate-600" />
          }
        </button>
      </div>

      {/* Auction type */}
      <FilterSection title="Tipo de subasta">
        <div className="grid grid-cols-3 gap-1.5">
          {[{ id: undefined, label: "Todas" }, ...DOMAINS].map((d) => (
            <button
              key={String(d.id)}
              onClick={() => setFilters(f => ({ ...f, domain_id: d.id, page: 1 }))}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border text-center ${
                filters.domain_id === d.id
                  ? "bg-[#00C8E0]/15 border-[#00C8E0]/40 text-[#00C8E0]"
                  : "bg-[#111827] border-[#1F2D45] text-slate-400 hover:text-white hover:border-[#243048]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Make */}
      <FilterSection title="Marca">
        <div className="space-y-1.5">
          <input
            placeholder="Buscar marca..."
            value={makeSearch}
            onChange={e => setMakeSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#111827] border border-[#1F2D45] rounded-lg text-white placeholder:text-slate-600 outline-none focus:border-[#00C8E0]/40"
          />
          <Select
            value={filters.manufacturer_id !== undefined ? String(filters.manufacturer_id) : "all"}
            onValueChange={(v) => {
              setFilters(f => ({ ...f, manufacturer_id: v === "all" ? undefined : parseInt(v), model_id: undefined, page: 1 }));
              setMakeSearch("");
            }}
          >
            <SelectTrigger className={selectClass}><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1F2D45] max-h-60">
              <SelectItem value="all">Todas las marcas</SelectItem>
              {allMakes.map((m: any) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.manufacturer_id && (
            <Select
              value={filters.model_id !== undefined ? String(filters.model_id) : "all"}
              onValueChange={(v) => setFilters(f => ({ ...f, model_id: v === "all" ? undefined : parseInt(v), page: 1 }))}
            >
              <SelectTrigger className={selectClass}><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1F2D45] max-h-60">
                <SelectItem value="all">Todos los modelos</SelectItem>
                {((models as any)?.data || [])?.map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </FilterSection>

      {/* Year */}
      <FilterSection title="Año">
        <div className="grid grid-cols-2 gap-1.5">
          <Input type="number" placeholder="Desde" className={inputClass}
            defaultValue={filters.from_year || ""}
            onChange={(e) => setFilters(f => ({ ...f, from_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
          <Input type="number" placeholder="Hasta" className={inputClass}
            defaultValue={filters.to_year || ""}
            onChange={(e) => setFilters(f => ({ ...f, to_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Precio subasta ($)">
        <div className="grid grid-cols-2 gap-1.5">
          <Input type="number" placeholder="Mín." className={inputClass}
            defaultValue={filters.bid_price_from || ""}
            onChange={(e) => setFilters(f => ({ ...f, bid_price_from: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
          <Input type="number" placeholder="Máx." className={inputClass}
            defaultValue={filters.bid_price_to || ""}
            onChange={(e) => setFilters(f => ({ ...f, bid_price_to: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
        </div>
      </FilterSection>

      {/* Buy Now price */}
      <FilterSection title="Precio Comprar Ahora ($)" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          <Input type="number" placeholder="Mín." className={inputClass}
            defaultValue={filters.buy_now_price_from || ""}
            onChange={(e) => setFilters(f => ({ ...f, buy_now_price_from: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
          <Input type="number" placeholder="Máx." className={inputClass}
            defaultValue={filters.buy_now_price_to || ""}
            onChange={(e) => setFilters(f => ({ ...f, buy_now_price_to: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condición (Run & Drive)">
        <Select
          value={filters.condition !== undefined ? String(filters.condition) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, condition: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier condición" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier condición</SelectItem>
            {RUN_CONDITIONS.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Damage */}
      <FilterSection title="Tipo de daño">
        <Select
          value={filters.damage || "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, damage: v === "all" ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier daño" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45] max-h-60">
            <SelectItem value="all">Cualquier daño</SelectItem>
            {damages.length > 0
              ? damages.map((d: any) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {tES(DAMAGE_ES, d.name) || d.name}
                  </SelectItem>
                ))
              : [
                  { id: "1", name: "Normal Wear" }, { id: "2", name: "Front End" },
                  { id: "3", name: "Rear End" }, { id: "4", name: "Side" },
                  { id: "5", name: "Rollover" }, { id: "6", name: "Flood" },
                  { id: "7", name: "Fire" }, { id: "8", name: "Mechanical" },
                  { id: "9", name: "Hail" }, { id: "10", name: "Vandalism" },
                ].map(d => (
                  <SelectItem key={d.id} value={d.id}>{tES(DAMAGE_ES, d.name) || d.name}</SelectItem>
                ))
            }
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Body type */}
      <FilterSection title="Tipo de vehículo" defaultOpen={false}>
        <Select
          value={filters.body_type !== undefined ? String(filters.body_type) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, body_type: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Todos los tipos</SelectItem>
            {BODY_TYPES.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Fuel */}
      <FilterSection title="Combustible" defaultOpen={false}>
        <Select
          value={filters.fuel_type !== undefined ? String(filters.fuel_type) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, fuel_type: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier combustible" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier combustible</SelectItem>
            {FUEL_TYPES.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Transmission */}
      <FilterSection title="Transmisión" defaultOpen={false}>
        <Select
          value={filters.transmission !== undefined ? String(filters.transmission) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, transmission: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier transmisión" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier transmisión</SelectItem>
            {TRANSMISSIONS.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Drive wheel */}
      <FilterSection title="Tracción" defaultOpen={false}>
        <Select
          value={filters.drive_wheel !== undefined ? String(filters.drive_wheel) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, drive_wheel: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier tracción" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier tracción</SelectItem>
            {DRIVE_WHEELS.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Cylinders */}
      <FilterSection title="Cilindros" defaultOpen={false}>
        <div className="grid grid-cols-4 gap-1">
          {CYLINDERS.map(c => (
            <button
              key={c}
              onClick={() => setFilters(f => ({ ...f, cylinders: f.cylinders === c ? undefined : c, page: 1 }))}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border text-center ${
                filters.cylinders === c
                  ? "bg-[#00C8E0]/15 border-[#00C8E0]/40 text-[#00C8E0]"
                  : "bg-[#111827] border-[#1F2D45] text-slate-400 hover:text-white hover:border-[#243048]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* State */}
      <FilterSection title="Estado USA" defaultOpen={false}>
        <Select
          value={filters.state_code || "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, state_code: v === "all" ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45] max-h-60">
            <SelectItem value="all">Todos los estados</SelectItem>
            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Odometer */}
      <FilterSection title="Odómetro (millas)" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          <Input type="number" placeholder="Mín." className={inputClass}
            defaultValue={filters.odometer_from_mi || ""}
            onChange={(e) => setFilters(f => ({ ...f, odometer_from_mi: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
          <Input type="number" placeholder="Máx." className={inputClass}
            defaultValue={filters.odometer_to_mi || ""}
            onChange={(e) => setFilters(f => ({ ...f, odometer_to_mi: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))} />
        </div>
      </FilterSection>

      {/* Sale date */}
      <FilterSection title="Fecha de subasta" defaultOpen={false}>
        <Select
          value={filters.sale_date_in_days !== undefined ? String(filters.sale_date_in_days) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, sale_date_in_days: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier fecha" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier fecha</SelectItem>
            {SALE_DATE_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color" defaultOpen={false}>
        <Select
          value={filters.color !== undefined ? String(filters.color) : "all"}
          onValueChange={(v) => setFilters(f => ({ ...f, color: v === "all" ? undefined : parseInt(v), page: 1 }))}
        >
          <SelectTrigger className={selectClass}><SelectValue placeholder="Cualquier color" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1F2D45]">
            <SelectItem value="all">Cualquier color</SelectItem>
            {[
              { id: 1, label: "Blanco" }, { id: 2, label: "Negro" },
              { id: 3, label: "Gris" }, { id: 4, label: "Plata" },
              { id: 5, label: "Rojo" }, { id: 6, label: "Azul" },
              { id: 7, label: "Verde" }, { id: 8, label: "Café / Beige" },
              { id: 9, label: "Amarillo / Dorado" }, { id: 10, label: "Naranja" },
              { id: 11, label: "Morado" }, { id: 12, label: "Otro" },
            ].map(c => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      {/* ── Page header ── */}
      <div className="bg-[#0B1120] border-b border-[#1F2D45]/60">
        <div className="container py-5">
          <div className="flex flex-col gap-3">
            {/* Title + count */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="font-display text-3xl md:text-4xl text-white tracking-tight">
                  CATÁLOGO DE <span className="text-[#00C8E0]">VEHÍCULOS</span>
                </h1>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">
                  Copart e IAAI en tiempo real ·{" "}
                  {total > 0 ? (
                    <span className="text-[#00C8E0] font-semibold">{total.toLocaleString()} disponibles</span>
                  ) : isLoading ? "Cargando..." : ""}
                </p>
              </div>
              {/* Mobile filter button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-[#1F2D45] text-slate-300 text-sm font-semibold hover:border-[#00C8E0]/30 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#00C8E0] text-[#080D18] text-[10px] font-extrabold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder="Buscar por marca, modelo, VIN o número de lote..."
                value={filters.search_query}
                onChange={(e) => setFilters(f => ({ ...f, search_query: e.target.value, page: 1 }))}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1F2D45] rounded-xl text-white placeholder:text-slate-600 text-sm font-medium outline-none focus:border-[#00C8E0]/40 transition-colors"
              />
              {filters.search_query && (
                <button
                  onClick={() => setFilters(f => ({ ...f, search_query: "", page: 1 }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort + active chips row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">Ordenar:</span>
              {[
                { sort: "buy_now_price", order: "asc" as const, label: "Comprar Ahora ↑" },
                { sort: "buy_now_price", order: "desc" as const, label: "Comprar Ahora ↓" },
                { sort: "bid", order: "asc" as const, label: "Subasta ↑" },
                { sort: "bid", order: "desc" as const, label: "Subasta ↓" },
              ].map(opt => {
                const active = filters.sort === opt.sort && filters.order === opt.order;
                const isGreen = opt.sort === "buy_now_price";
                return (
                  <button
                    key={`${opt.sort}-${opt.order}`}
                    onClick={() => setFilters(f => ({
                      ...f, sort: opt.sort, order: opt.order,
                      buy_now: opt.sort === "buy_now_price" ? 1 : f.buy_now,
                      page: 1,
                    }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      active
                        ? isGreen
                          ? "bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]"
                          : "bg-[#00C8E0]/15 border-[#00C8E0]/40 text-[#00C8E0]"
                        : "bg-[#111827] border-[#1F2D45] text-slate-500 hover:text-white hover:border-[#243048]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              {/* Filtros rápidos de condición */}
              {[
                { conditionId: 0, label: "✓ Enciende y Avanza", activeColor: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
                { conditionId: 6, label: "⚡ Motor Enciende", activeColor: "bg-yellow-500/15 border-yellow-500/40 text-yellow-400" },
              ].map(opt => {
                const active = filters.condition === opt.conditionId;
                return (
                  <button
                    key={`cond-${opt.conditionId}`}
                    onClick={() => setFilters(f => ({
                      ...f,
                      condition: active ? undefined : opt.conditionId,
                      page: 1,
                    }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      active
                        ? opt.activeColor
                        : "bg-[#111827] border-[#1F2D45] text-slate-500 hover:text-white hover:border-[#243048]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              {(filters.sort || filters.buy_now || filters.condition !== undefined) && (
                <button
                  onClick={() => setFilters(f => ({ ...f, sort: undefined, order: undefined, buy_now: undefined, condition: undefined, page: 1 }))}
                  className="px-2.5 py-1 rounded-lg text-[10px] text-slate-600 hover:text-slate-300 border border-transparent hover:border-[#1F2D45] transition-all flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Quitar
                </button>
              )}

              {/* Search type indicator */}
              {filters.search_query && searchType !== "general" && (
                <span className={`px-2 py-1 rounded text-[10px] font-bold ml-2 ${
                  searchType === "vin" ? "bg-[#00C8E0]/15 text-[#00C8E0]" : "bg-[#F97316]/15 text-[#F97316]"
                }`}>
                  {searchType === "vin" ? "VIN" : "Lote"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout: sidebar + results ── */}
      <div className="container py-6">
        <div className="flex gap-6 items-start">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1F2D45] scrollbar-track-transparent">
            {sidebarContent}
          </aside>

          {/* ── Results column ── */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Results header */}
            {!isLoading && vehicles.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1">
                <span>
                  Mostrando <span className="text-white font-semibold">{((filters.page - 1) * filters.per_page) + 1}–{Math.min(filters.page * filters.per_page, total)}</span> de{" "}
                  <span className="text-white font-semibold">{total.toLocaleString()}</span> vehículos
                </span>
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Página {filters.page} / {totalPages.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Vehicle list */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : error ? (
              <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-12 text-center">
                <Car className="w-14 h-14 text-[#1F2D45] mx-auto mb-4" />
                <p className="text-slate-300 text-base font-semibold mb-1">No se pudieron cargar los vehículos</p>
                <p className="text-slate-600 text-sm max-w-sm mx-auto">
                  La API de subastas está procesando tu solicitud. Los datos se actualizarán automáticamente en unos momentos.
                </p>
                <button
                  onClick={() => generalQuery.refetch()}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#00C8E0]/15 border border-[#00C8E0]/30 text-[#00C8E0] text-sm font-semibold hover:bg-[#00C8E0]/25 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reintentar
                </button>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-12 text-center">
                <Car className="w-14 h-14 text-[#1F2D45] mx-auto mb-4" />
                <p className="text-slate-300 text-base font-semibold mb-1">Sin resultados</p>
                <p className="text-slate-600 text-sm">No se encontraron vehículos con esos filtros.</p>
                <button onClick={clearFilters} className="mt-4 text-[#00C8E0] text-sm hover:underline flex items-center gap-1 mx-auto font-medium">
                  <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle: any, i: number) => (
                  <VehicleRow key={vehicle.id || vehicle.lot_number || i} vehicle={vehicle} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && vehicles.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => { setFilters(f => ({ ...f, page: f.page - 1 })); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111827] border border-[#1F2D45] text-slate-300 text-sm font-semibold hover:border-[#00C8E0]/30 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-slate-400 text-sm font-semibold px-4 py-2 bg-[#111827] border border-[#1F2D45] rounded-lg min-w-[130px] text-center">
                  {filters.page} / {totalPages.toLocaleString()}
                </span>
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => { setFilters(f => ({ ...f, page: f.page + 1 })); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111827] border border-[#1F2D45] text-slate-300 text-sm font-semibold hover:border-[#00C8E0]/30 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-[#080D18] z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#1F2D45]">
                <span className="text-white font-bold text-base">Filtros</span>
                <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                {sidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
