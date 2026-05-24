import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, Car, Fuel, Gauge, Calendar, MapPin, ExternalLink, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const DOMAINS = [
  { id: 3, label: "Copart", value: 3 },
  { id: 1, label: "IAAI", value: 1 },
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

function normalizeVehicle(vehicle: any) {
  // AuctionsAPI returns nested objects; flatten for display
  const primaryLot = vehicle.lots?.[0] || {};
  const domainId = primaryLot.domain?.id ?? vehicle.domain_id;
  const platform = domainId === 3 ? "copart" : "iaai";
  const platformLabel = domainId === 3 ? "Copart" : "IAAI";
  const platformColor = domainId === 3 ? "#00C8E0" : "#F97316";
  const images = primaryLot.images?.normal || primaryLot.images?.small || [];
  const primaryImage = images[0] || vehicle.image_url || null;
  const bidPrice = primaryLot.bid ?? primaryLot.final_bid ?? vehicle.bid_price ?? 0;
  const buyNowPrice = primaryLot.buy_now_price ?? vehicle.buy_now_price ?? null;
  const stateCode = primaryLot.location?.state?.code ?? vehicle.state_code ?? "FL";
  const odometer = primaryLot.odometer?.mi ?? vehicle.odometer ?? null;
  const fuelType = vehicle.fuel?.name ?? vehicle.fuel_type ?? null;
  const bodyType = vehicle.body_type?.name ?? vehicle.body_type ?? null;
  const make = vehicle.manufacturer?.name ?? vehicle.make ?? "";
  const model = vehicle.model?.name ?? vehicle.model ?? "";
  const damageType = primaryLot.damage?.main?.name ?? vehicle.damage_type ?? null;
  const lotNumber = primaryLot.lot ?? vehicle.lot_number ?? vehicle.id;
  return { ...vehicle, platform, platformLabel, platformColor, primaryImage, bidPrice, buyNowPrice, stateCode, odometer, fuelType, bodyType, make, model, damageType, lotNumber, domainId };
}

function VehicleCard({ vehicle: rawVehicle, onQuote }: { vehicle: any; onQuote: (v: any) => void }) {
  const vehicle = normalizeVehicle(rawVehicle);
  const { platform, platformLabel, platformColor, primaryImage, bidPrice, buyNowPrice } = vehicle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#141E30] border border-[#243048] rounded-2xl overflow-hidden card-hover group"
    >
      {/* Image */}
      <div className="relative aspect-video bg-[#0F1624] overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage} alt={vehicle.title || "Vehicle"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-[#243048]" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 rounded-lg text-xs font-bold text-[#080D18]" style={{ backgroundColor: platformColor }}>
            {platformLabel}
          </span>
          {buyNowPrice && (
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-[#F97316] text-white">Buy Now</span>
          )}
        </div>
          {vehicle.damageType && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-lg text-xs bg-black/60 text-slate-300 backdrop-blur-sm">
              {vehicle.damageType}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white text-lg leading-tight line-clamp-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-slate-400 text-sm">{vehicle.bodyType || "Vehículo"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          {vehicle.odometer && (
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>{vehicle.odometer?.toLocaleString()} mi</span>
            </div>
          )}
          {vehicle.fuelType && (
            <div className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>{vehicle.fuelType}</span>
            </div>
          )}
          {vehicle.stateCode && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{vehicle.stateCode}</span>
            </div>
          )}
          {vehicle.year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{vehicle.year}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="border-t border-[#243048]/60 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400">Precio Actual</p>
              <p className="text-[#00C8E0] font-bold text-xl">${bidPrice?.toLocaleString()}</p>
            </div>
            {buyNowPrice && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Buy Now</p>
                <p className="text-[#F97316] font-bold text-lg">${buyNowPrice?.toLocaleString()}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onQuote(vehicle)}
              size="sm"
              className="flex-1 bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-semibold btn-press text-xs"
            >
              <Calculator className="w-3.5 h-3.5 mr-1" /> Cotizar
            </Button>
            <Link href={`/vehiculo/${vehicle.lotNumber || vehicle.id}`}>
              <Button size="sm" variant="outline" className="border-[#243048] text-slate-300 hover:text-white hover:border-[#00C8E0]/50 btn-press">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Detect if search looks like a VIN (17 chars alphanumeric) or lot number (all digits)
function detectSearchType(q: string): "vin" | "lot" | "general" {
  const clean = q.trim();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return "vin";
  if (/^\d{6,12}$/.test(clean)) return "lot";
  return "general";
}

export default function Catalogo() {
  const [filters, setFilters] = useState({
    search_query: "",
    domain_id: undefined as number | undefined,
    manufacturer_id: undefined as number | undefined,
    model_id: undefined as number | undefined,
    from_year: undefined as number | undefined,
    to_year: undefined as number | undefined,
    bid_price_from: undefined as number | undefined,
    bid_price_to: undefined as number | undefined,
    body_type: undefined as number | undefined,
    page: 1,
    per_page: 24,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  // Dynamic manufacturer/model data from AuctionsAPI
  const { data: manufacturers } = trpc.vehicles.manufacturers.useQuery();
  const { data: models } = trpc.vehicles.models.useQuery(
    { manufacturerId: filters.manufacturer_id! },
    { enabled: !!filters.manufacturer_id }
  );

  // Filter manufacturers list by search text
  const allMakes: any[] = useMemo(() => {
    const list = (manufacturers as any)?.data || [];
    if (!makeSearch.trim()) return list;
    return list.filter((m: any) => m.name?.toLowerCase().includes(makeSearch.toLowerCase()));
  }, [manufacturers, makeSearch]);

  const searchType = detectSearchType(filters.search_query);

  const queryInput = useMemo(() => ({
    ...filters,
    exclude_expired_auctions: 1,
  }), [filters]);

  const vinQuery = trpc.vehicles.searchByVin.useQuery(
    { vin: filters.search_query.trim() },
    { enabled: searchType === "vin" && filters.search_query.trim().length === 17 }
  );
  const lotQuery = trpc.vehicles.searchByLot.useQuery(
    { lot: filters.search_query.trim() },
    { enabled: searchType === "lot" && filters.search_query.trim().length >= 6 }
  );
  const generalQuery = trpc.vehicles.search.useQuery(queryInput, { enabled: searchType === "general" });

  const isLoading = searchType === "vin" ? vinQuery.isLoading : searchType === "lot" ? lotQuery.isLoading : generalQuery.isLoading;
  const error = searchType === "vin" ? vinQuery.error : searchType === "lot" ? lotQuery.error : generalQuery.error;
  const rawData = searchType === "vin" ? vinQuery.data : searchType === "lot" ? lotQuery.data : generalQuery.data;
  const vehicles = (rawData as any)?.data || (Array.isArray(rawData) ? rawData : []);
  const total = (rawData as any)?.meta?.total ?? (rawData as any)?.meta?.to ?? vehicles.length;

  function handleQuote(rawVehicle: any) {
    const vehicle = normalizeVehicle(rawVehicle);
    window.location.href = `/cotizador?platform=${vehicle.platform}&state=${vehicle.stateCode}&price=${vehicle.bidPrice}&title=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}&body=${encodeURIComponent(vehicle.bodyType || "")}`;
  }

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      {/* Header */}
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-white">CATÁLOGO DE <span className="text-[#00C8E0]">VEHÍCULOS</span></h1>
              <p className="text-slate-400 mt-1">Copart e IAAI en tiempo real — {total > 0 ? `${total.toLocaleString()} vehículos disponibles` : "Cargando..."}</p>
            </div>
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="border-[#243048] text-slate-300 hover:text-white w-fit">
              <Filter className="w-4 h-4 mr-2" /> Filtros {showFilters ? <X className="w-4 h-4 ml-2" /> : null}
            </Button>
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

          {/* Filters */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select onValueChange={(v) => setFilters(f => ({ ...f, domain_id: v === "all" ? undefined : parseInt(v), page: 1 }))}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-slate-300">
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048]">
                  <SelectItem value="all">Todas</SelectItem>
                  {DOMAINS.map(d => <SelectItem key={d.id} value={String(d.value)}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select onValueChange={(v) => { setFilters(f => ({ ...f, manufacturer_id: v === "all" ? undefined : parseInt(v), model_id: undefined, page: 1 })); setMakeSearch(""); }}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-slate-300">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048] max-h-72">
                  {/* Search box inside dropdown */}
                  <div className="px-2 py-1.5 sticky top-0 bg-[#141E30] border-b border-[#243048] z-10">
                    <input
                      placeholder="Buscar marca..."
                      value={makeSearch}
                      onChange={e => setMakeSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full px-2 py-1 text-sm bg-[#0F1624] border border-[#243048] rounded text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {allMakes.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.manufacturer_id && (
                <Select onValueChange={(v) => setFilters(f => ({ ...f, model_id: v === "all" ? undefined : parseInt(v), page: 1 }))}>
                  <SelectTrigger className="bg-[#141E30] border-[#243048] text-slate-300">
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

              <Select onValueChange={(v) => setFilters(f => ({ ...f, body_type: v === "all" ? undefined : parseInt(v), page: 1 }))}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-slate-300">
                  <SelectValue placeholder="Tipo de vehículo" />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048]">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {BODY_TYPES.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Año desde"
                className="bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500"
                onChange={(e) => setFilters(f => ({ ...f, from_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
              />
              <Input
                type="number"
                placeholder="Año hasta"
                className="bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500"
                onChange={(e) => setFilters(f => ({ ...f, to_year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
              />
              <Input
                type="number"
                placeholder="Precio min $"
                className="bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500"
                onChange={(e) => setFilters(f => ({ ...f, bid_price_from: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
              />
              <Input
                type="number"
                placeholder="Precio max $"
                className="bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500"
                onChange={(e) => setFilters(f => ({ ...f, bid_price_to: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
              />
              <Button onClick={() => { setFilters({ search_query: "", domain_id: undefined as number | undefined, manufacturer_id: undefined as number | undefined, model_id: undefined as number | undefined, from_year: undefined as number | undefined, to_year: undefined as number | undefined, bid_price_from: undefined as number | undefined, bid_price_to: undefined as number | undefined, body_type: undefined as number | undefined, page: 1, per_page: 24 }); setMakeSearch(""); }} variant="outline" className="border-[#243048] text-slate-400 hover:text-white col-span-2 md:col-span-1">
                <X className="w-4 h-4 mr-1" /> Limpiar Filtros
              </Button>
            </motion.div>
          )}
        </div>
      </div>

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
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle: any, i: number) => (
              <VehicleCard key={vehicle.id || vehicle.lot_number || i} vehicle={vehicle} onQuote={handleQuote} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && vehicles.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <p className="text-slate-500 text-sm">
              Mostrando {((filters.page - 1) * filters.per_page) + 1}–{Math.min(filters.page * filters.per_page, total)} de {total.toLocaleString()} vehículos
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-[#243048] text-slate-300 hover:text-white"
                disabled={filters.page <= 1}
                onClick={() => { setFilters(f => ({ ...f, page: f.page - 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                ← Anterior
              </Button>
              <span className="text-slate-300 text-sm font-medium px-4 py-2 bg-[#141E30] border border-[#243048] rounded-lg">
                Página {filters.page} de {Math.ceil(total / filters.per_page).toLocaleString()}
              </span>
              <Button
                variant="outline"
                className="border-[#243048] text-slate-300 hover:text-white"
                disabled={filters.page >= Math.ceil(total / filters.per_page)}
                onClick={() => { setFilters(f => ({ ...f, page: f.page + 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
