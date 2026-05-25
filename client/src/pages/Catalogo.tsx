import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, Car, Fuel, Gauge, Calendar, MapPin,
  Calculator, MessageCircle, ArrowUpDown, Tag, Zap, ChevronDown, ChevronUp,
  SlidersHorizontal, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// ─── Static filter data ───────────────────────────────────────────────────────

const DOMAINS = [
  { id: 3, label: "Copart" },
  { id: 1, label: "IAAI" },
];

const BODY_TYPES = [
  { id: 1, label: "Sedán" },
  { id: 2, label: "Wagon" },
  { id: 3, label: "Coupe" },
  { id: 4, label: "Pickup" },
  { id: 5, label: "SUV" },
  { id: 6, label: "Cabrio / Convertible" },
  { id: 7, label: "Van" },
  { id: 11, label: "Hatchback" },
  { id: 20, label: "Liftback" },
  { id: 27, label: "Sport Car" },
];

// Fuel types (IDs from AuctionsAPI)
const FUEL_TYPES = [
  { id: 1, label: "Gasolina" },
  { id: 2, label: "Diésel" },
  { id: 3, label: "Eléctrico" },
  { id: 4, label: "Híbrido" },
  { id: 5, label: "Gas Natural" },
  { id: 6, label: "Flex Fuel" },
];

// Transmission types
const TRANSMISSIONS = [
  { id: 1, label: "Automático" },
  { id: 2, label: "Manual" },
  { id: 3, label: "CVT" },
];

// Drive wheel / tracción
const DRIVE_WHEELS = [
  { id: 1, label: "FWD (Delantera)" },
  { id: 2, label: "RWD (Trasera)" },
  { id: 3, label: "AWD (Total)" },
  { id: 4, label: "4WD / 4x4" },
];

// Title condition
const TITLE_CONDITIONS = [
  { id: 1, label: "Clean Title" },
  { id: 2, label: "Salvage Title" },
  { id: 3, label: "Rebuilt Title" },
  { id: 4, label: "Parts Only" },
  { id: 5, label: "Certificate of Destruction" },
];

// Cylinders
const CYLINDERS = [3, 4, 5, 6, 8, 10, 12];

// Sale date options
const SALE_DATE_OPTIONS = [
  { value: 1, label: "Hoy" },
  { value: 2, label: "Mañana" },
  { value: 3, label: "Próximos 3 días" },
  { value: 7, label: "Próximos 7 días" },
  { value: 14, label: "Próximas 2 semanas" },
  { value: 30, label: "Próximo mes" },
];

// US States
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeVehicle(vehicle: any) {
  const lots: any[] = vehicle.lots || [];
  const primaryLot = lots[0] || {};
  const domainId = primaryLot.domain?.id ?? vehicle.domain_id;
  const platform = domainId === 3 ? "copart" : "iaai";
  const platformLabel = domainId === 3 ? "Copart" : "IAAI";
  const platformColor = domainId === 3 ? "#00C8E0" : "#F97316";
  const images = primaryLot.images?.normal || primaryLot.images?.small || [];
  const primaryImage = images[0] || vehicle.image_url || null;

  // The real API field for Buy Now price is `lot.buy_now` (a number).
  // `lot.buy_now_price` is an older alias kept for compatibility.
  const buyNowPrice: number | null = (() => {
    for (const lot of lots) {
      // Prefer buy_now (real field), fall back to buy_now_price (alias)
      const p = (lot.buy_now != null && lot.buy_now > 0)
        ? lot.buy_now
        : (lot.buy_now_price != null && lot.buy_now_price > 0 ? lot.buy_now_price : null);
      if (p != null) return p;
    }
    return vehicle.buy_now ?? vehicle.buy_now_price ?? null;
  })();

  const rawBid = primaryLot.bid ?? primaryLot.final_bid ?? vehicle.bid_price ?? null;

  // Show bid as "Subasta Actual" only when it's different from the Buy Now price
  const bidPrice = (() => {
    if (rawBid == null || rawBid <= 0) return 0;
    if (buyNowPrice != null && rawBid === buyNowPrice) return 0; // same value, don't show twice
    return rawBid;
  })();
  const stateCode = primaryLot.location?.state?.code ?? vehicle.state_code ?? null;
  const odometer = primaryLot.odometer?.mi ?? vehicle.odometer ?? null;
  const fuelType = vehicle.fuel?.name ?? vehicle.fuel_type ?? null;
  const bodyType = vehicle.body_type?.name ?? vehicle.body_type ?? null;
  const make = vehicle.manufacturer?.name ?? vehicle.make ?? "";
  const model = vehicle.model?.name ?? vehicle.model ?? "";
  const damageType = primaryLot.damage?.main?.name ?? vehicle.damage_type ?? null;
  const lotNumber = primaryLot.lot ?? vehicle.lot_number ?? vehicle.id;
  const saleDate = primaryLot.sale_date ?? vehicle.sale_date ?? null;
  const transmission = vehicle.transmission?.name ?? vehicle.transmission ?? null;
  const driveWheel = vehicle.drive_wheel?.name ?? vehicle.drive_wheel ?? null;
  const color = vehicle.color?.name ?? vehicle.color ?? null;
  const cylinders = vehicle.cylinders ?? null;
  const titleCondition = primaryLot.condition?.name ?? null;
  return {
    ...vehicle,
    platform, platformLabel, platformColor, primaryImage,
    bidPrice, buyNowPrice, stateCode, odometer, fuelType,
    bodyType, make, model, damageType, lotNumber, saleDate,
    transmission, driveWheel, color, cylinders, titleCondition, domainId
  };
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-GT", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

function detectSearchType(q: string): "vin" | "lot" | "general" {
  const clean = q.trim();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return "vin";
  if (/^\d{6,12}$/.test(clean)) return "lot";
  return "general";
}

// ─── VehicleCard ──────────────────────────────────────────────────────────────

function VehicleCard({ vehicle: rawVehicle }: { vehicle: any }) {
  const v = normalizeVehicle(rawVehicle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#141E30] border border-[#243048] rounded-2xl overflow-hidden card-hover group flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-video bg-[#0F1624] overflow-hidden flex-shrink-0">
        {v.primaryImage ? (
          <img
            src={v.primaryImage}
            alt={`${v.year} ${v.make} ${v.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-[#243048]" />
          </div>
        )}

        {/* Top-left badges: platform + buy now */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className="px-2 py-0.5 rounded-md text-xs font-bold text-[#080D18]"
            style={{ backgroundColor: v.platformColor }}
          >
            {v.platformLabel}
          </span>
          {v.buyNowPrice && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#22c55e] text-white flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Buy Now: ${v.buyNowPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Sale date */}
        {v.saleDate && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-md text-xs bg-black/70 text-slate-200 backdrop-blur-sm flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(v.saleDate)}
            </span>
          </div>
        )}

        {/* Damage badge */}
        {v.damageType && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-0.5 rounded-md text-xs bg-black/60 text-slate-300 backdrop-blur-sm">
              {v.damageType}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div>
          <h3 className="font-semibold text-white text-base leading-tight line-clamp-1">
            {v.year} {v.make} {v.model}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">{v.bodyType || "Vehículo"}{v.titleCondition ? ` · ${v.titleCondition}` : ""}</p>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-400">
          {v.odometer != null && (
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 flex-shrink-0" />
              <span>{v.odometer.toLocaleString()} mi</span>
            </div>
          )}
          {v.fuelType && (
            <div className="flex items-center gap-1">
              <Fuel className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{v.fuelType}</span>
            </div>
          )}
          {v.stateCode && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{v.stateCode}</span>
            </div>
          )}
          {v.transmission && (
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{v.transmission}</span>
            </div>
          )}
        </div>

        {/* Price section */}
        <div className="border-t border-[#243048]/60 pt-3 mt-auto">
          {/* Price badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Current bid — always show if > 0 */}
            {v.bidPrice > 0 && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">
                  {v.buyNowPrice ? "Puja actual" : "Subasta Actual"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00C8E0]/10 border border-[#00C8E0]/30 text-[#00C8E0] text-xs font-medium">
                    <Tag className="w-2.5 h-2.5" /> {v.buyNowPrice ? "Subasta" : "Subasta Actual"}
                  </span>
                  <p className="text-[#00C8E0] font-bold text-lg">${v.bidPrice.toLocaleString()}</p>
                </div>
              </div>
            )}
            {/* Buy Now price */}
            {v.buyNowPrice && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Precio fijo</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-medium">
                    <Zap className="w-2.5 h-2.5" /> Buy Now
                  </span>
                  <p className="text-[#22c55e] font-bold text-lg">${v.buyNowPrice.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Link href={`/vehiculo/${v.lotNumber || v.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-semibold btn-press text-xs"
              >
                <Calculator className="w-3.5 h-3.5 mr-1" /> Ver Costos
              </Button>
            </Link>
            <a
              href={`https://wa.me/50231220803?text=${encodeURIComponent(
                `Hola Ruta Cars GT, me interesa el vehículo ${v.year} ${v.make} ${v.model} (Lote: ${v.lotNumber || v.id})`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="border-[#243048] text-[#25D366] hover:text-white hover:border-[#25D366]/50 btn-press"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Persist catalog state ────────────────────────────────────────────────────

const STORAGE_KEY = "rutacars_catalog_filters_v2";

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
  // New filters
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
  // Sort & pagination
  sort: string | undefined;
  order: "asc" | "desc" | undefined;
  page: number;
  per_page: number;
};

const DEFAULT_FILTERS: CatalogFilters = {
  search_query: "",
  domain_id: undefined,
  manufacturer_id: undefined,
  model_id: undefined,
  from_year: undefined,
  to_year: undefined,
  bid_price_from: undefined,
  bid_price_to: undefined,
  buy_now_price_from: undefined,
  buy_now_price_to: undefined,
  body_type: undefined,
  state_code: undefined,
  buy_now: undefined,
  damage: undefined,
  fuel_type: undefined,
  transmission: undefined,
  drive_wheel: undefined,
  color: undefined as number | undefined,
  cylinders: undefined,
  condition: undefined,
  odometer_from_mi: undefined,
  odometer_to_mi: undefined,
  sale_date_in_days: undefined,
  sort: undefined,
  order: undefined,
  page: 1,
  per_page: 24,
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Catalogo() {
  const savedFilters = loadSavedFilters();
  const [filters, setFilters] = useState<CatalogFilters>({
    ...DEFAULT_FILTERS,
    ...(savedFilters || {}),
  });

  // Debounced search — only fires API call 600ms after user stops typing
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search_query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search_query), 600);
    return () => clearTimeout(t);
  }, [filters.search_query]);

  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  // Dynamic data — only load when filter panel is open
  const { data: manufacturers } = trpc.vehicles.manufacturers.useQuery(
    undefined,
    { enabled: showFilters }
  );
  const { data: models } = trpc.vehicles.models.useQuery(
    { manufacturerId: filters.manufacturer_id! },
    { enabled: showFilters && !!filters.manufacturer_id }
  );
  const { data: damagesData } = trpc.vehicles.damages.useQuery(
    undefined,
    { enabled: showFilters && showAdvanced }
  );

  const allMakes: any[] = useMemo(() => {
    const list = (manufacturers as any)?.data || [];
    if (!makeSearch.trim()) return list;
    return list.filter((m: any) => m.name?.toLowerCase().includes(makeSearch.toLowerCase()));
  }, [manufacturers, makeSearch]);

  const damages: any[] = useMemo(() => {
    return (damagesData as any)?.data || [];
  }, [damagesData]);

  // Persist filters
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  // Persist scroll position
  useEffect(() => {
    const handleScroll = () => {
      try { sessionStorage.setItem(STORAGE_KEY + "_scroll", String(window.scrollY)); } catch {}
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll on mount
  useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem(STORAGE_KEY + "_scroll");
      if (savedScroll && savedFilters) {
        setTimeout(() => window.scrollTo({ top: parseInt(savedScroll), behavior: "instant" }), 100);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Buy Now vehicles often have past sale dates but are still available;
      // exclude_expired_auctions would incorrectly filter them out.
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
    enabled: searchType === "general",
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

  const selectClass = "bg-[#141E30] border-[#243048] text-slate-300 focus:border-[#00C8E0]/50 h-9 text-sm";
  const inputClass = "bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500 focus:border-[#00C8E0]/50 h-9 text-sm";

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      {/* Header */}
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-white">
                CATÁLOGO DE <span className="text-[#00C8E0]">VEHÍCULOS</span>
              </h1>
              <p className="text-slate-400 mt-1">
                Copart e IAAI en tiempo real —{" "}
                {total > 0 ? `${total.toLocaleString()} vehículos disponibles` : "Cargando..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Buy Now toggle — always visible */}
              <button
                onClick={() => setFilters(f => ({
                  ...f,
                  buy_now: f.buy_now === 1 ? undefined : 1,
                  page: 1,
                }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  filters.buy_now === 1
                    ? "bg-[#22c55e] border-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20"
                    : "bg-[#141E30] border-[#243048] text-slate-300 hover:border-[#22c55e]/50 hover:text-[#22c55e]"
                }`}
              >
                <Zap className="w-4 h-4" />
                Solo Buy Now
              </button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className={`border-[#243048] text-slate-300 hover:text-white relative ${showFilters ? "bg-[#141E30]" : ""}`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#00C8E0] text-[#080D18] text-xs font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por marca, modelo, VIN o número de lote..."
              value={filters.search_query}
              onChange={(e) => setFilters(f => ({ ...f, search_query: e.target.value, page: 1 }))}
              className="pl-12 bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500 focus:border-[#00C8E0]/50 h-12"
            />
          </div>

          {/* Search type indicator */}
          {filters.search_query && searchType !== "general" && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${searchType === "vin" ? "bg-[#00C8E0]/20 text-[#00C8E0]" : "bg-[#F97316]/20 text-[#F97316]"}`}>
                {searchType === "vin" ? "Búsqueda por VIN" : "Búsqueda por Lote"}
              </span>
              <span className="text-slate-500 text-xs">Búsqueda directa activada</span>
            </div>
          )}

          {/* Sort bar */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-slate-400 text-sm hidden sm:inline">Ordenar:</span>
            {[
              { sort: "buy_now_price", order: "asc" as const, label: "Buy Now ↑", color: "green" },
              { sort: "buy_now_price", order: "desc" as const, label: "Buy Now ↓", color: "green" },
              { sort: "bid", order: "asc" as const, label: "Precio ↑", color: "orange" },
              { sort: "bid", order: "desc" as const, label: "Precio ↓", color: "orange" },
            ].map(opt => {
              const active = filters.sort === opt.sort && filters.order === opt.order;
              const isGreen = opt.color === "green";
              return (
                <button
                  key={`${opt.sort}-${opt.order}`}
                  onClick={() => setFilters(f => ({
                    ...f,
                    sort: opt.sort,
                    order: opt.order,
                    buy_now: opt.sort === "buy_now_price" ? 1 : f.buy_now,
                    page: 1,
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    active
                      ? isGreen
                        ? "bg-[#22c55e] border-[#22c55e] text-white"
                        : "bg-[#F97316] border-[#F97316] text-white"
                      : "bg-[#141E30] border-[#243048] text-slate-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
            {(filters.sort || filters.buy_now) && (
              <button
                onClick={() => setFilters(f => ({ ...f, sort: undefined, order: undefined, buy_now: undefined, page: 1 }))}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-transparent hover:border-[#243048] transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Quitar orden
              </button>
            )}
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-[#0F1624] border border-[#243048]/60 rounded-2xl space-y-4">
                  {/* Basic filters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {/* Platform */}
                    <Select
                      value={filters.domain_id !== undefined ? String(filters.domain_id) : "all"}
                      onValueChange={(v) => setFilters(f => ({ ...f, domain_id: v === "all" ? undefined : parseInt(v), page: 1 }))}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Plataforma" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141E30] border-[#243048]">
                        <SelectItem value="all">Todas</SelectItem>
                        {DOMAINS.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Make */}
                    <Select
                      value={filters.manufacturer_id !== undefined ? String(filters.manufacturer_id) : "all"}
                      onValueChange={(v) => {
                        setFilters(f => ({ ...f, manufacturer_id: v === "all" ? undefined : parseInt(v), model_id: undefined, page: 1 }));
                        setMakeSearch("");
                      }}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Marca" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141E30] border-[#243048] max-h-72">
                        <div className="px-2 py-1.5 sticky top-0 bg-[#141E30] border-b border-[#243048] z-10">
                          <input
                            placeholder="Buscar marca..."
                            value={makeSearch}
                            onChange={e => setMakeSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-full px-2 py-1 text-xs bg-[#0F1624] border border-[#243048] rounded text-white placeholder:text-slate-500 outline-none"
                          />
                        </div>
                        <SelectItem value="all">Todas las marcas</SelectItem>
                        {allMakes.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Model */}
                    {filters.manufacturer_id && (
                      <Select
                        value={filters.model_id !== undefined ? String(filters.model_id) : "all"}
                        onValueChange={(v) => setFilters(f => ({ ...f, model_id: v === "all" ? undefined : parseInt(v), page: 1 }))}
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Modelo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141E30] border-[#243048] max-h-60">
                          <SelectItem value="all">Todos los modelos</SelectItem>
                          {((models as any)?.data || models as any || [])?.map((m: any) => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Body type */}
                    <Select
                      value={filters.body_type !== undefined ? String(filters.body_type) : "all"}
                      onValueChange={(v) => setFilters(f => ({ ...f, body_type: v === "all" ? undefined : parseInt(v), page: 1 }))}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Tipo de vehículo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141E30] border-[#243048]">
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {BODY_TYPES.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Year from */}
                    <Input
                      type="number"
                      placeholder="Año desde"
                      className={inputClass}
                      defaultValue={filters.from_year || ""}
                      onChange={(e) => setFilters(f => ({ ...f, from_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                    />

                    {/* Year to */}
                    <Input
                      type="number"
                      placeholder="Año hasta"
                      className={inputClass}
                      defaultValue={filters.to_year || ""}
                      onChange={(e) => setFilters(f => ({ ...f, to_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                    />

                    {/* Price from */}
                    <Input
                      type="number"
                      placeholder="Precio min $"
                      className={inputClass}
                      defaultValue={filters.bid_price_from || ""}
                      onChange={(e) => setFilters(f => ({ ...f, bid_price_from: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                    />

                    {/* Price to */}
                    <Input
                      type="number"
                      placeholder="Precio max $"
                      className={inputClass}
                      defaultValue={filters.bid_price_to || ""}
                      onChange={(e) => setFilters(f => ({ ...f, bid_price_to: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                    />

                    {/* State */}
                    <Select
                      value={filters.state_code || "all"}
                      onValueChange={(v) => setFilters(f => ({ ...f, state_code: v === "all" ? undefined : v, page: 1 }))}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Estado USA" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141E30] border-[#243048] max-h-60">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Sale date */}
                    <Select
                      value={filters.sale_date_in_days !== undefined ? String(filters.sale_date_in_days) : "all"}
                      onValueChange={(v) => setFilters(f => ({ ...f, sale_date_in_days: v === "all" ? undefined : parseInt(v), page: 1 }))}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Fecha de subasta" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141E30] border-[#243048]">
                        <SelectItem value="all">Cualquier fecha</SelectItem>
                        {SALE_DATE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced filters toggle */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#00C8E0] transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAdvanced ? "Ocultar filtros avanzados" : "Más filtros (condición, daño, combustible, transmisión...)"}
                  </button>

                  {/* Advanced filters */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-2">
                          {/* Damage */}
                          <Select
                            value={filters.damage || "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, damage: v === "all" ? undefined : v, page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Tipo de daño" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048] max-h-60">
                              <SelectItem value="all">Cualquier daño</SelectItem>
                              {damages.length > 0
                                ? damages.map((d: any) => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                  ))
                                : [
                                    { id: "1", name: "Normal Wear" },
                                    { id: "2", name: "Front End" },
                                    { id: "3", name: "Rear End" },
                                    { id: "4", name: "Side" },
                                    { id: "5", name: "Rollover" },
                                    { id: "6", name: "Flood" },
                                    { id: "7", name: "Fire" },
                                    { id: "8", name: "Mechanical" },
                                    { id: "9", name: "Hail" },
                                    { id: "10", name: "Vandalism" },
                                  ].map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                  ))
                              }
                            </SelectContent>
                          </Select>

                          {/* Fuel type */}
                          <Select
                            value={filters.fuel_type !== undefined ? String(filters.fuel_type) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, fuel_type: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Combustible" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier combustible</SelectItem>
                              {FUEL_TYPES.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.label}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          {/* Transmission */}
                          <Select
                            value={filters.transmission !== undefined ? String(filters.transmission) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, transmission: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Transmisión" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier transmisión</SelectItem>
                              {TRANSMISSIONS.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          {/* Drive wheel */}
                          <Select
                            value={filters.drive_wheel !== undefined ? String(filters.drive_wheel) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, drive_wheel: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Tracción" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier tracción</SelectItem>
                              {DRIVE_WHEELS.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          {/* Cylinders */}
                          <Select
                            value={filters.cylinders !== undefined ? String(filters.cylinders) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, cylinders: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Cilindros" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier cilindrada</SelectItem>
                              {CYLINDERS.map(c => <SelectItem key={c} value={String(c)}>{c} cilindros</SelectItem>)}
                            </SelectContent>
                          </Select>

                          {/* Title condition */}
                          <Select
                            value={filters.condition !== undefined ? String(filters.condition) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, condition: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Tipo de título" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier título</SelectItem>
                              {TITLE_CONDITIONS.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          {/* Odometer from */}
                          <Input
                            type="number"
                            placeholder="Odómetro min (mi)"
                            className={inputClass}
                            defaultValue={filters.odometer_from_mi || ""}
                            onChange={(e) => setFilters(f => ({ ...f, odometer_from_mi: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                          />

                          {/* Odometer to */}
                          <Input
                            type="number"
                            placeholder="Odómetro max (mi)"
                            className={inputClass}
                            defaultValue={filters.odometer_to_mi || ""}
                            onChange={(e) => setFilters(f => ({ ...f, odometer_to_mi: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                          />

                          {/* Color */}
                          <Select
                            value={filters.color !== undefined ? String(filters.color) : "all"}
                            onValueChange={(v) => setFilters(f => ({ ...f, color: v === "all" ? undefined : parseInt(v), page: 1 }))}
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Color" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141E30] border-[#243048]">
                              <SelectItem value="all">Cualquier color</SelectItem>
                              {[
                                { id: 1, label: "Blanco" },
                                { id: 2, label: "Negro" },
                                { id: 3, label: "Gris" },
                                { id: 4, label: "Plata" },
                                { id: 5, label: "Rojo" },
                                { id: 6, label: "Azul" },
                                { id: 7, label: "Verde" },
                                { id: 8, label: "Café / Beige" },
                                { id: 9, label: "Amarillo / Dorado" },
                                { id: 10, label: "Naranja" },
                                { id: 11, label: "Morado" },
                                { id: 12, label: "Otro" },
                              ].map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Buy Now price range */}
                          <Input
                            type="number"
                            placeholder="Buy Now min $"
                            className={inputClass}
                            defaultValue={filters.buy_now_price_from || ""}
                            onChange={(e) => setFilters(f => ({ ...f, buy_now_price_from: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                          />
                          <Input
                            type="number"
                            placeholder="Buy Now max $"
                            className={inputClass}
                            defaultValue={filters.buy_now_price_to || ""}
                            onChange={(e) => setFilters(f => ({ ...f, buy_now_price_to: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Clear filters */}
                  {activeFilterCount > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white border border-[#243048] hover:border-red-500/50 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Limpiar {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="bg-[#0F1624] border-b border-[#243048]/40 py-2">
          <div className="container flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-xs">Filtros activos:</span>
            {filters.buy_now === 1 && (
              <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Solo Buy Now
                <button onClick={() => setFilters(f => ({ ...f, buy_now: undefined, page: 1 }))} className="ml-1 hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.domain_id && (
              <span className="px-2 py-0.5 rounded-full bg-[#00C8E0]/10 border border-[#00C8E0]/30 text-[#00C8E0] text-xs flex items-center gap-1">
                {DOMAINS.find(d => d.id === filters.domain_id)?.label}
                <button onClick={() => setFilters(f => ({ ...f, domain_id: undefined, page: 1 }))} className="ml-1 hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.sale_date_in_days && (
              <span className="px-2 py-0.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {SALE_DATE_OPTIONS.find(o => o.value === filters.sale_date_in_days)?.label}
                <button onClick={() => setFilters(f => ({ ...f, sale_date_in_days: undefined, page: 1 }))} className="ml-1 hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:text-white transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[#141E30] border border-[#243048] rounded-2xl overflow-hidden">
                <div className="aspect-video shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-5 shimmer rounded" />
                  <div className="h-4 shimmer rounded w-2/3" />
                  <div className="h-8 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-[#243048] mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Error al cargar vehículos. Intenta de nuevo.</p>
            <p className="text-slate-500 text-sm mt-2">{error.message}</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-[#243048] mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No se encontraron vehículos con esos filtros.</p>
            <button onClick={clearFilters} className="mt-4 text-[#00C8E0] text-sm hover:underline flex items-center gap-1 mx-auto">
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle: any, i: number) => (
              <VehicleCard key={vehicle.id || vehicle.lot_number || i} vehicle={vehicle} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && vehicles.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <p className="text-slate-500 text-sm">
              Mostrando {((filters.page - 1) * filters.per_page) + 1}–{Math.min(filters.page * filters.per_page, total)} de {total.toLocaleString()} vehículos
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-[#243048] text-slate-300 hover:text-white"
                disabled={filters.page <= 1}
                onClick={() => {
                  setFilters(f => ({ ...f, page: f.page - 1 }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                ← Anterior
              </Button>
              <span className="text-slate-300 text-sm font-medium px-4 py-2 bg-[#141E30] border border-[#243048] rounded-lg min-w-[140px] text-center">
                Página {filters.page} de {totalPages.toLocaleString()}
              </span>
              <Button
                variant="outline"
                className="border-[#243048] text-slate-300 hover:text-white"
                disabled={filters.page >= totalPages}
                onClick={() => {
                  setFilters(f => ({ ...f, page: f.page + 1 }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
