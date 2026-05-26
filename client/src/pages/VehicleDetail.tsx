import { useParams } from "wouter";
import { Car, Gauge, Fuel, MapPin, Calendar, ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, Loader2, DollarSign, Ship, Truck, Receipt, Info, CheckCircle2, AlertTriangle, Zap, Gavel, RefreshCw, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import type { AuctionVehicle } from "../../../server/auctionsApi";
import { useSEO } from "@/hooks/useSEO";

// ─── Translations ─────────────────────────────────────────────────────────────

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

function t(map: Record<string, string>, val: string | null | undefined): string {
  if (!val) return "N/A";
  return map[val.toLowerCase()] ?? val;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeVehicleDetail(v: AuctionVehicle) {
  const primaryLot = v.lots?.[0];
  const domainId = primaryLot?.domain?.id ?? 0;
  const platform = domainId === 3 ? "copart" : "iaai";
  const platformLabel = domainId === 3 ? "Copart" : "IAAI";
  const platformColor = domainId === 3 ? "#00C8E0" : "#F97316";
  const allImages: string[] = [];
  for (const lot of v.lots) {
    if (lot.images?.normal?.length) allImages.push(...lot.images.normal);
    else if (lot.images?.small?.length) allImages.push(...lot.images.small);
  }
  const stateCode = primaryLot?.location?.state?.code ?? "FL";
  // city es objeto {id, name} en la API real
  const cityRaw = primaryLot?.location?.city as any;
  const city: string | null = cityRaw == null ? null : (typeof cityRaw === "string" ? cityRaw : (cityRaw?.name ?? null));
  const bidPrice = primaryLot?.bid ?? primaryLot?.final_bid ?? 0;
  // Real API field is lot.buy_now (number), buy_now_price is an alias
  const buyNowPrice: number | null = (() => {
    for (const lot of v.lots) {
      const p = (lot as any).buy_now ?? lot.buy_now_price ?? null;
      if (p != null && p > 0) return p;
    }
    return null;
  })();
  const odometer = primaryLot?.odometer?.mi ?? null;
  const fuelType = v.fuel?.name ?? null;
  const bodyType = v.body_type?.name ?? null;
  const make = v.manufacturer?.name ?? "";
  const model = v.model?.name ?? "";
  const damageType = primaryLot?.damage?.main?.name ?? null;
  const lotNumber = primaryLot?.lot ?? String(v.id);
  const condition = primaryLot?.condition?.name ?? null;
  const highlights = primaryLot?.highlights ?? null;
  const transmission = (v as any).transmission?.name ?? (v as any).transmission ?? null;
  const saleDate = primaryLot?.sale_date ?? null;
  return {
    ...v, platform, platformLabel, platformColor, allImages, stateCode, city,
    bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model,
    damageType, lotNumber, condition, highlights, transmission, saleDate,
  };
}

// ─── Cost breakdown row ───────────────────────────────────────────────────────

function BreakdownRow({ icon: Icon, label, usd, gtq, highlight = false, accent = false }: {
  icon?: any; label: string; usd: number; gtq: number; highlight?: boolean; accent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${highlight ? "border-t-2 border-[#243048] mt-2 pt-4" : "border-b border-[#1a2740]/50"}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${accent ? "text-[#00C8E0]" : "text-slate-500"}`} />}
        <span className={`text-sm ${highlight ? "text-white font-bold" : accent ? "text-[#00C8E0] font-medium" : "text-slate-400"}`}>{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${highlight ? "text-[#00C8E0] text-base" : "text-white"}`}>
          ${usd.toLocaleString()}
        </span>
        <span className="text-xs text-slate-500 ml-2">Q{gtq.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Single calculator panel ──────────────────────────────────────────────────

function CalcPanel({
  title, subtitle, price, platform, stateCode, bodyType, city,
  accentColor, icon: Icon, isBuyNow, whatsappMsg, buyNowWhatsappMsg,
  make, model, year,
}: {
  title: string; subtitle: string; price: number;
  platform: "copart" | "iaai"; stateCode: string; bodyType: string | null; city?: string | null;
  accentColor: string; icon: any; isBuyNow: boolean;
  whatsappMsg: string; buyNowWhatsappMsg?: string;
  make?: string; model?: string; year?: number;
}) {
  const { data: calcResult, isLoading, refetch } = trpc.calculator.calculate.useQuery(
    { auctionPrice: price, platform, stateCode, bodyType: bodyType ?? null, city: city ?? null, make: make ?? null, model: model ?? null, year: year ?? null },
    { enabled: price > 0, staleTime: 5 * 60 * 1000 }
  );

  const er = calcResult?.exchangeRate ?? 7.75;

  const [marketPrice, setMarketPrice] = useState<{ gtq: number } | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const getMarketPrice = trpc.admin.getMarketPrice.useMutation();

  const handleCalcGestion = async () => {
    if (!make || !model || !year) return;
    setMarketLoading(true);
    setMarketError(null);
    try {
      const result = await getMarketPrice.mutateAsync({ make, model, year });
      if (result.success && result.data) {
        setMarketPrice({ gtq: result.data.averagePrice });
      } else {
        setMarketError('Sin coincidencias del mismo año. Ganancia mínima aplicada.');
      }
    } catch {
      setMarketError('Error al buscar. Intenta de nuevo.');
    } finally {
      setMarketLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: `${accentColor}40`, background: "linear-gradient(135deg, #0D1829 0%, #0a1220 100%)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1a2740] flex items-center justify-between"
        style={{ background: `linear-gradient(90deg, ${accentColor}15 0%, transparent 100%)` }}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
          <div>
            <h3 className="text-white font-bold text-sm">{title}</h3>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-0.5">Precio base</p>
          <p className="font-bold text-lg" style={{ color: accentColor }}>${price.toLocaleString()}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            <span className="text-slate-400 text-sm">Calculando...</span>
          </div>
        ) : calcResult?.needsManualQuote ? (
          <div className="flex flex-col items-center py-5 gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-[#F97316]" />
            {calcResult.manualQuoteReason === "low_profit" ? (
              <>
                <p className="text-white font-semibold text-sm">Precio especial disponible</p>
                <p className="text-slate-400 text-xs">Este vehículo tiene condiciones especiales de importación. Contáctanos para obtener tu cotización personalizada.</p>
                <a href={`https://wa.me/50231220803?text=${buyNowWhatsappMsg ?? whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full font-bold btn-press bg-[#F97316] hover:bg-[#ea6b0a] text-white">
                    <MessageCircle className="w-4 h-4 mr-2" /> Solicitar Cotización
                  </Button>
                </a>
              </>
            ) : (
              <>
                <p className="text-white font-semibold text-sm">Requiere cotización especial</p>
                <p className="text-slate-400 text-xs">El transporte de este vehículo se cotiza manualmente.</p>
                <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full font-bold btn-press bg-[#25D366] hover:bg-[#1da851] text-white">
                    <MessageCircle className="w-4 h-4 mr-2" /> Consultar por WhatsApp
                  </Button>
                </a>
              </>
            )}
          </div>
        ) : calcResult ? (
          <>
            <div className="space-y-0">
              <BreakdownRow icon={DollarSign} label={isBuyNow ? "Precio Comprar Ahora" : "Precio de Subasta"} usd={calcResult.auctionPrice} gtq={Math.round(calcResult.auctionPrice * er)} />
              <BreakdownRow icon={Receipt} label={`Fees ${platform === "copart" ? "Copart" : "IAAI"}`} usd={calcResult.platformFees.total} gtq={Math.round(calcResult.platformFees.total * er)} />
              <BreakdownRow icon={Truck} label={`Transporte USA (${calcResult.vehicleSize.label})`} usd={calcResult.usaTransport} gtq={Math.round(calcResult.usaTransport * er)} />
              <BreakdownRow icon={Ship} label="Flete Marítimo (Pto. Quetzal)" usd={calcResult.maritimeShipping} gtq={Math.round(calcResult.maritimeShipping * er)} />
              <BreakdownRow icon={Receipt} label="Impuestos Guatemala (32% CIF)" usd={calcResult.guatemalaTax} gtq={Math.round(calcResult.guatemalaTax * er)} />
              <BreakdownRow icon={Receipt} label="Gastos Varios (aduana, trámites)" usd={Math.round(calcResult.miscExpensesGTQ / er)} gtq={calcResult.miscExpensesGTQ} />
              <div className="flex items-center justify-between py-2 px-1 border-b border-[#1a2740]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-white text-sm font-medium">Gestión Internacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-white font-semibold text-sm">${calcResult.gestionInternacionalUSD.toLocaleString()}</span>
                    <span className="text-slate-400 text-xs ml-1">Q{Math.round(calcResult.gestionInternacionalUSD * er).toLocaleString()}</span>
                  </div>
                  {make && model && year && (
                    <button
                      onClick={handleCalcGestion}
                      disabled={marketLoading}
                      className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
                      title="Buscar precio de mercado en Guatemala"
                    >
                      {marketLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Calcular'}
                    </button>
                  )}
                </div>
              </div>
              {marketPrice && (
                <div className="mx-1 mb-1 px-3 py-2 rounded-lg text-xs" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}>
                  <span className="text-slate-400">Precio mercado GT (encuentra24): </span>
                  <span className="font-semibold" style={{ color: accentColor }}>Q{marketPrice.gtq.toLocaleString()}</span>
                </div>
              )}
              {marketError && (
                <div className="mx-1 mb-1 px-3 py-2 rounded-lg text-xs bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400">{marketError}</span>
                </div>
              )}
              {/* Línea decorativa: visible al cliente pero NO incluida en el total */}
              <div className="flex items-center justify-between py-1.5 px-1 opacity-50">
                <span className="text-slate-400 text-xs">Servicio Ruta Cars GT</span>
                <span className="text-slate-400 text-xs line-through">${calcResult.rutaCarsServiceUSD} <span className="no-underline text-[10px]">(incluido)</span></span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-3 rounded-xl p-4" style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Total Puesto en Guatemala</p>
                  <p className="text-slate-500 text-xs mt-0.5">Todo incluido · Sin sorpresas</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl" style={{ color: accentColor }}>${calcResult.finalPriceUSD.toLocaleString()}</p>
                  <p className="text-[#F97316] font-bold text-sm">Q{calcResult.finalPriceGTQ.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            {isBuyNow ? (
              <a href={`https://wa.me/50231220803?text=${buyNowWhatsappMsg ?? whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="block mt-3">
                <Button className="w-full font-bold btn-press text-white" style={{ background: accentColor, color: "#080D18" }}>
                  <Zap className="w-4 h-4 mr-2" /> Comprar Ahora por ${price.toLocaleString()}
                </Button>
              </a>
            ) : (
              <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="block mt-3">
                <Button className="w-full font-bold btn-press bg-[#25D366] hover:bg-[#1da851] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" /> Hablar con un Asesor
                </Button>
              </a>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-slate-500 text-sm">Sin precio disponible para calcular</div>
        )}
      </div>
    </div>
  );
}

// ─── Interactive auction calculator ──────────────────────────────────────────

function AuctionCalcInteractive({
  platform, stateCode, bodyType, city, currentBid, whatsappBase, make, model, year,
}: {
  platform: "copart" | "iaai"; stateCode: string; bodyType: string | null; city?: string | null;
  currentBid: number; whatsappBase: string;
  make?: string; model?: string; year?: number;
}) {
  const [bidInput, setBidInput] = useState<string>(currentBid > 0 ? String(currentBid) : "");
  const [debouncedBid, setDebouncedBid] = useState<number>(currentBid > 0 ? currentBid : 0);

  useEffect(() => {
    const t = setTimeout(() => {
      const val = parseInt(bidInput.replace(/[^0-9]/g, "")) || 0;
      setDebouncedBid(val);
    }, 600);
    return () => clearTimeout(t);
  }, [bidInput]);

  const { data: calcResult, isLoading, refetch } = trpc.calculator.calculate.useQuery(
    { auctionPrice: debouncedBid, platform, stateCode, bodyType: bodyType ?? null, city: city ?? null, make: make ?? null, model: model ?? null, year: year ?? null },
    { enabled: debouncedBid > 0, staleTime: 5 * 60 * 1000 }
  );

  const er = calcResult?.exchangeRate ?? 7.75;

  const [marketPrice2, setMarketPrice2] = useState<{ gtq: number } | null>(null);
  const [marketLoading2, setMarketLoading2] = useState(false);
  const [marketError2, setMarketError2] = useState<string | null>(null);
  const getMarketPrice2 = trpc.admin.getMarketPrice.useMutation();

  const handleCalcGestion2 = async () => {
    if (!make || !model || !year) return;
    setMarketLoading2(true);
    setMarketError2(null);
    try {
      const result = await getMarketPrice2.mutateAsync({ make, model, year });
      if (result.success && result.data) {
        setMarketPrice2({ gtq: result.data.averagePrice });
      } else {
        setMarketError2('Sin coincidencias del mismo año. Ganancia mínima aplicada.');
      }
    } catch {
      setMarketError2('Error al buscar. Intenta de nuevo.');
    } finally {
      setMarketLoading2(false);
    }
  };

  const whatsappMsg = encodeURIComponent(
    `${decodeURIComponent(whatsappBase)} Planeo pujar $${debouncedBid.toLocaleString()}. Costo total estimado: $${calcResult?.finalPriceUSD?.toLocaleString() ?? "?"}`
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-[#00C8E0]/30" style={{ background: "linear-gradient(135deg, #0D1829 0%, #0a1220 100%)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1a2740]" style={{ background: "linear-gradient(90deg, #00C8E015 0%, transparent 100%)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-[#00C8E0]" />
            <div>
              <h3 className="text-white font-bold text-sm">Calculadora de Subasta</h3>
              <p className="text-slate-500 text-xs">Ingresa tu monto de puja para calcular el costo total</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="text-slate-500 hover:text-[#00C8E0] transition-colors p-1" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Bid input */}
        <div className="mb-4">
          <label className="text-slate-400 text-xs mb-2 block">¿Cuánto planeas pujar? (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00C8E0] font-bold text-lg">$</span>
            <Input
              type="number"
              min={0}
              step={100}
              value={bidInput}
              onChange={(e) => setBidInput(e.target.value)}
              placeholder={currentBid > 0 ? `Puja actual: $${currentBid.toLocaleString()}` : "Ej: 3500"}
              className="pl-8 bg-[#141E30] border-[#00C8E0]/40 text-white text-lg font-bold focus:border-[#00C8E0] h-12 rounded-xl"
            />
          </div>
          {currentBid > 0 && (
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8E0] inline-block"></span>
              Puja actual en subasta: <span className="text-[#00C8E0] font-medium">${currentBid.toLocaleString()}</span>
            </p>
          )}
        </div>

        {debouncedBid <= 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Ingresa un monto para ver el costo de importación
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6 gap-3">
            <Loader2 className="w-5 h-5 text-[#00C8E0] animate-spin" />
            <span className="text-slate-400 text-sm">Calculando...</span>
          </div>
        ) : calcResult?.needsManualQuote ? (
          <div className="flex flex-col items-center py-5 gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-[#F97316]" />
            {calcResult.manualQuoteReason === "low_profit" ? (
              <>
                <p className="text-white font-semibold text-sm">Precio especial disponible</p>
                <p className="text-slate-400 text-xs">Este vehículo tiene condiciones especiales. Contáctanos para una cotización personalizada.</p>
                <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full font-bold btn-press bg-[#F97316] hover:bg-[#ea6b0a] text-white">
                    <MessageCircle className="w-4 h-4 mr-2" /> Solicitar Cotización
                  </Button>
                </a>
              </>
            ) : (
              <>
                <p className="text-white font-semibold text-sm">Requiere cotización especial</p>
                <p className="text-slate-400 text-xs">El transporte de este vehículo se cotiza manualmente.</p>
              </>
            )}
          </div>
        ) : calcResult ? (
          <>
            <div className="space-y-0">
              <BreakdownRow icon={DollarSign} label="Tu puja en subasta" usd={calcResult.auctionPrice} gtq={Math.round(calcResult.auctionPrice * er)} />
              <BreakdownRow icon={Receipt} label={`Fees ${platform === "copart" ? "Copart" : "IAAI"}`} usd={calcResult.platformFees.total} gtq={Math.round(calcResult.platformFees.total * er)} />
              <BreakdownRow icon={Truck} label={`Transporte USA (${calcResult.vehicleSize.label})`} usd={calcResult.usaTransport} gtq={Math.round(calcResult.usaTransport * er)} />
              <BreakdownRow icon={Ship} label="Flete Marítimo (Pto. Quetzal)" usd={calcResult.maritimeShipping} gtq={Math.round(calcResult.maritimeShipping * er)} />
              <BreakdownRow icon={Receipt} label="Impuestos Guatemala (32% CIF)" usd={calcResult.guatemalaTax} gtq={Math.round(calcResult.guatemalaTax * er)} />
              <BreakdownRow icon={Receipt} label="Gastos Varios" usd={Math.round(calcResult.miscExpensesGTQ / er)} gtq={calcResult.miscExpensesGTQ} />
              <div className="flex items-center justify-between py-2 px-1 border-b border-[#1a2740]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00C8E0]" />
                  <span className="text-white text-sm font-medium">Gestión Internacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-white font-semibold text-sm">${calcResult.gestionInternacionalUSD.toLocaleString()}</span>
                    <span className="text-slate-400 text-xs ml-1">Q{Math.round(calcResult.gestionInternacionalUSD * er).toLocaleString()}</span>
                  </div>
                  {make && model && year && (
                    <button
                      onClick={handleCalcGestion2}
                      disabled={marketLoading2}
                      className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: '#00C8E020', color: '#00C8E0', border: '1px solid #00C8E040' }}
                      title="Buscar precio de mercado en Guatemala"
                    >
                      {marketLoading2 ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Calcular'}
                    </button>
                  )}
                </div>
              </div>
              {marketPrice2 && (
                <div className="mx-1 mb-1 px-3 py-2 rounded-lg text-xs" style={{ background: '#00C8E010', border: '1px solid #00C8E020' }}>
                  <span className="text-slate-400">Precio mercado GT (encuentra24): </span>
                  <span className="font-semibold text-[#00C8E0]">Q{marketPrice2.gtq.toLocaleString()}</span>
                </div>
              )}
              {marketError2 && (
                <div className="mx-1 mb-1 px-3 py-2 rounded-lg text-xs bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400">{marketError2}</span>
                </div>
              )}
              {/* Línea decorativa: visible al cliente pero NO incluida en el total */}
              <div className="flex items-center justify-between py-1.5 px-1 opacity-50">
                <span className="text-slate-400 text-xs">Servicio Ruta Cars GT</span>
                <span className="text-slate-400 text-xs line-through">${calcResult.rutaCarsServiceUSD} <span className="no-underline text-[10px]">(incluido)</span></span>
              </div>
            </div>

            <div className="mt-3 rounded-xl p-4 bg-[#00C8E0]/10 border border-[#00C8E0]/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Total si ganas la subasta</p>
                  <p className="text-slate-500 text-xs mt-0.5">Todo incluido · Puesto en Guatemala</p>
                </div>
                <div className="text-right">
                  <p className="text-[#00C8E0] font-bold text-2xl">${calcResult.finalPriceUSD.toLocaleString()}</p>
                  <p className="text-[#F97316] font-bold text-sm">Q{calcResult.finalPriceGTQ.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="block mt-3">
              <Button className="w-full font-bold btn-press bg-[#25D366] hover:bg-[#1da851] text-white">
                <MessageCircle className="w-4 h-4 mr-2" /> Hablar con un Asesor
              </Button>
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images, initialIdx, onClose,
}: {
  images: string[]; initialIdx: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIdx);

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-slate-400 text-sm">{idx + 1} / {images.length}</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center relative px-12 min-h-0"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[idx]}
          alt={`Foto ${idx + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg select-none"
          draggable={false}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-thin"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-[#00C8E0] scale-105" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [imgIdx, setImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function goBackToCatalog() {
    if (window.history.length > 1) window.history.back();
    else navigate("/catalogo");
  }

  const { data: rawVehicle, isLoading, refetch } = trpc.vehicleDetail.getById.useQuery(
    { id: id! },
    { enabled: !!id, staleTime: 5 * 60 * 1000, refetchInterval: 5 * 60 * 1000 }
  );

  const vehicle = rawVehicle ? normalizeVehicleDetail(rawVehicle) : null;

  // SEO dinámico por vehículo (usamos los campos ya normalizados)
  const seoMake = vehicle?.make ?? "";
  const seoModel = vehicle?.model ?? "";
  const seoYear = vehicle?.year ?? "";
  const seoLot = vehicle?.lotNumber ?? id;
  const seoImage = vehicle?.allImages?.[0];
  useSEO(vehicle ? {
    title: `${seoYear} ${seoMake} ${seoModel} - Lote #${seoLot}`,
    description: `Importa este ${seoYear} ${seoMake} ${seoModel} desde subastas USA a Guatemala. Cotización automática incluida.`,
    image: seoImage,
    url: `https://rutacarsgt.manus.space/vehiculo/${id}`,
  } : {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080D18] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00C8E0] animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#080D18] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-[#243048] mx-auto mb-4" />
          <h2 className="font-display text-3xl text-white mb-2">VEHÍCULO NO ENCONTRADO</h2>
          <Link href="/catalogo"><Button className="bg-[#00C8E0] text-[#080D18] mt-4 font-bold">Volver al Catálogo</Button></Link>
        </div>
      </div>
    );
  }

  const {
    platform, platformLabel, platformColor, allImages, stateCode, city,
    bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model,
    damageType, lotNumber, condition, highlights, transmission, saleDate,
  } = vehicle;

  const hasBid = bidPrice > 0;
  const hasBuyNow = buyNowPrice != null && buyNowPrice > 0;

  const baseWhatsapp = encodeURIComponent(
    `Hola Ruta Cars GT! Me interesa el ${vehicle.year} ${make} ${model} (Lote #${lotNumber}) en ${platformLabel}.`
  );
  const buyNowWhatsapp = encodeURIComponent(
    `Hola Ruta Cars GT! Quiero COMPRAR AHORA el ${vehicle.year} ${make} ${model} (Lote #${lotNumber}) a $${buyNowPrice?.toLocaleString()} en ${platformLabel}. ¿Cómo procedo?`
  );

  const saleDateFmt = saleDate ? new Date(saleDate).toLocaleDateString("es-GT", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : null;

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="container py-8">
        <Button onClick={goBackToCatalog} variant="outline" className="border-[#243048] text-slate-400 hover:text-white mb-6 btn-press">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Catálogo
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── Left: Gallery + specs ── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-video bg-[#141E30] rounded-2xl overflow-hidden group">
              {allImages.length > 0 ? (
                <img
                  src={allImages[imgIdx]}
                  alt={`${vehicle.year} ${make} ${model}`}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car className="w-20 h-20 text-[#243048]" /></div>
              )}
              {/* Platform badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#080D18]" style={{ backgroundColor: platformColor }}>
                  {platformLabel}
                </span>
                {hasBuyNow && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#22c55e] text-white flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Comprar Ahora
                  </span>
                )}
              </div>
              {/* Expand button */}
              {allImages.length > 0 && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                  title="Ver en pantalla completa"
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.slice(0, 10).map((_: string, i: number) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-[#00C8E0] scale-125" : "bg-white/40 hover:bg-white/70"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-6 gap-1.5">
                {allImages.slice(0, 6).map((img: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? "border-[#00C8E0] scale-105" : "border-transparent hover:border-[#243048]"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Gauge, label: "Odómetro", value: odometer ? `${odometer.toLocaleString()} mi` : "N/A" },
                { icon: Fuel, label: "Combustible", value: t(FUEL_ES, fuelType) },
                { icon: Car, label: "Carrocería", value: t(BODY_TYPE_ES, bodyType) },
                { icon: MapPin, label: "Estado USA", value: stateCode },
                { icon: Calendar, label: "Año", value: String(vehicle.year || "N/A") },
                { icon: Receipt, label: "Transmisión", value: t(TRANSMISSION_ES, transmission) },
              ].map(item => (
                <div key={item.label} className="bg-[#141E30] border border-[#243048] rounded-xl p-3 flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#00C8E0] flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">{item.label}</p>
                    <p className="text-white text-sm font-semibold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Condition + Damage */}
            {(condition || damageType) && (
              <div className="grid grid-cols-2 gap-2.5">
                {condition && (
                  <div className="bg-[#141E30] border border-[#243048] rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">Condición</p>
                    <p className="text-white text-sm font-semibold">{t(CONDITION_ES, condition)}</p>
                  </div>
                )}
                {damageType && (
                  <div className="bg-[#141E30] border border-amber-500/20 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">Tipo de Daño</p>
                    <p className="text-amber-400 text-sm font-semibold">{t(DAMAGE_ES, damageType)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sale date */}
            {saleDateFmt && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Fecha de Subasta</p>
                  <p className="text-white text-sm font-semibold capitalize">{saleDateFmt}</p>
                </div>
              </div>
            )}

            {/* Highlights */}
            {highlights && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> Notas del Lote</p>
                <p className="text-slate-300 text-sm leading-relaxed">{highlights}</p>
              </div>
            )}

            {/* VIN */}
            {vehicle.vin && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Número de Identificación (VIN)</p>
                <p className="text-white font-mono text-sm tracking-wider">{vehicle.vin}</p>
              </div>
            )}
          </div>

          {/* ── Right: Title + Calculators ── */}
          <div className="space-y-5">
            {/* Vehicle header */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#080D18]" style={{ backgroundColor: platformColor }}>
                  {platformLabel}
                </span>
                {damageType && (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
                    {t(DAMAGE_ES, damageType)}
                  </span>
                )}
                {condition && (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-300 font-medium">
                    {t(CONDITION_ES, condition)}
                  </span>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-white leading-tight tracking-wide">
                {vehicle.year} {make.toUpperCase()} {model.toUpperCase()}
              </h1>
              <p className="text-slate-400 mt-2 text-sm">Lote #{lotNumber} · {stateCode} · {platformLabel}</p>
            </div>

            {/* Price summary bar */}
            <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-4 flex flex-wrap gap-4">
              {hasBid && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> Puja Actual en Subasta
                  </p>
                  <p className="text-[#00C8E0] font-bold text-2xl">${bidPrice.toLocaleString()}</p>
                </div>
              )}
              {hasBuyNow && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Precio Comprar Ahora
                  </p>
                  <p className="text-[#22c55e] font-bold text-2xl">${buyNowPrice!.toLocaleString()}</p>
                </div>
              )}
              {!hasBid && !hasBuyNow && (
                <p className="text-slate-500 text-sm">Sin precio disponible actualmente</p>
              )}
            </div>

            {/* ── CALCULADORAS ── */}

            {/* Case 1: Buy Now only */}
            {hasBuyNow && !hasBid && (
              <CalcPanel
                title="Cotización — Comprar Ahora"
                subtitle="Precio fijo · Disponible inmediatamente"
                price={buyNowPrice!}
                platform={platform as "copart" | "iaai"}
                stateCode={stateCode}
                bodyType={bodyType}
                city={city}
                accentColor="#22c55e"
                icon={Zap}
                isBuyNow={true}
                whatsappMsg={baseWhatsapp}
                buyNowWhatsappMsg={buyNowWhatsapp}
                make={make}
                model={model}
                year={vehicle.year ?? undefined}
              />
            )}

            {/* Case 2: Auction only */}
            {hasBid && !hasBuyNow && (
              <AuctionCalcInteractive
                platform={platform as "copart" | "iaai"}
                stateCode={stateCode}
                bodyType={bodyType}
                city={city}
                currentBid={bidPrice}
                whatsappBase={baseWhatsapp}
                make={make}
                model={model}
                year={vehicle.year ?? undefined}
              />
            )}

            {/* Case 3: Both Buy Now + Auction */}
            {hasBuyNow && hasBid && (
              <>
                {/* Buy Now — highlighted */}
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10">
                    <span className="bg-[#22c55e] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> RECOMENDADO
                    </span>
                  </div>
                  <CalcPanel
                    title="Cotización — Comprar Ahora"
                    subtitle="Precio fijo garantizado · Sin riesgo de subasta"
                    price={buyNowPrice!}
                    platform={platform as "copart" | "iaai"}
                    stateCode={stateCode}
                    bodyType={bodyType}
                    city={city}
                    accentColor="#22c55e"
                    icon={Zap}
                    isBuyNow={true}
                    whatsappMsg={baseWhatsapp}
                    buyNowWhatsappMsg={buyNowWhatsapp}
                    make={make}
                    model={model}
                    year={vehicle.year ?? undefined}
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#243048]"></div>
                  <span className="text-slate-500 text-xs font-medium px-2">o también puedes subastar</span>
                  <div className="flex-1 h-px bg-[#243048]"></div>
                </div>

                {/* Auction — interactive */}
                <AuctionCalcInteractive
                  platform={platform as "copart" | "iaai"}
                  stateCode={stateCode}
                  bodyType={bodyType}
                  city={city}
                  currentBid={bidPrice}
                  whatsappBase={baseWhatsapp}
                  make={make}
                  model={model}
                  year={vehicle.year ?? undefined}
                />
              </>
            )}

            {/* No price */}
            {!hasBid && !hasBuyNow && (
              <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-[#F97316] mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Sin precio disponible</p>
                <p className="text-slate-400 text-sm mb-4">Contáctanos para obtener información actualizada de este vehículo.</p>
                <a href={`https://wa.me/50231220803?text=${baseWhatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold btn-press">
                    <MessageCircle className="w-4 h-4 mr-2" /> Consultar por WhatsApp
                  </Button>
                </a>
              </div>
            )}

            {/* Motor */}
            {vehicle.engine && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Motor</p>
                <p className="text-white text-sm font-semibold">{typeof vehicle.engine === 'string' ? vehicle.engine : (vehicle.engine as any)?.name ?? ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <Lightbox
          images={allImages}
          initialIdx={imgIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
