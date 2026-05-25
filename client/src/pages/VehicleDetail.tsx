import { useParams } from "wouter";
import { Car, Gauge, Fuel, MapPin, Calendar, ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, Loader2, DollarSign, Ship, Truck, Receipt, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import type { AuctionVehicle } from "../../../server/auctionsApi";

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
  const bidPrice = primaryLot?.bid ?? primaryLot?.final_bid ?? 0;
  const buyNowPrice = primaryLot?.buy_now_price ?? null;
  const odometer = primaryLot?.odometer?.mi ?? null;
  const fuelType = v.fuel?.name ?? null;
  const bodyType = v.body_type?.name ?? null;
  const make = v.manufacturer?.name ?? "";
  const model = v.model?.name ?? "";
  const damageType = primaryLot?.damage?.main?.name ?? null;
  const lotNumber = primaryLot?.lot ?? String(v.id);
  const condition = primaryLot?.condition?.name ?? null;
  const highlights = primaryLot?.highlights ?? null;
  return { ...v, platform, platformLabel, platformColor, allImages, stateCode, bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model, damageType, lotNumber, condition, highlights };
}

function BreakdownRow({ label, usd, gtq, highlight = false }: { label: string; usd: number; gtq: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? "border-t border-[#243048] mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${highlight ? "text-white font-semibold" : "text-slate-400"}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${highlight ? "text-[#00C8E0] text-base" : "text-white"}`}>
          ${usd.toLocaleString()}
        </span>
        <span className="text-xs text-slate-500 ml-2">Q{gtq.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [imgIdx, setImgIdx] = useState(0);

  function goBackToCatalog() {
    // Go back in history so the catalog restores its saved position
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/catalogo");
    }
  }

  const { data: rawVehicle, isLoading } = trpc.vehicleDetail.getById.useQuery(
    { id: id! },
    { enabled: !!id, staleTime: 10 * 60 * 1000 }
  );

  // Calcular importación automáticamente cuando tengamos el vehículo
  const vehicle = rawVehicle ? normalizeVehicleDetail(rawVehicle) : null;

  const { data: calcResult, isLoading: calcLoading } = trpc.calculator.calculate.useQuery(
    {
      auctionPrice: vehicle?.bidPrice ?? 0,
      platform: (vehicle?.platform ?? "copart") as "copart" | "iaai",
      stateCode: vehicle?.stateCode ?? "FL",
      bodyType: vehicle?.bodyType ?? null,
    },
    {
      enabled: !!vehicle && (vehicle.bidPrice ?? 0) > 0,
      staleTime: 10 * 60 * 1000,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080D18] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00C8E0] animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando vehículo...</p>
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
          <Link href="/catalogo"><Button className="bg-[#00C8E0] text-[#080D18] mt-4">Volver al Catálogo</Button></Link>
        </div>
      </div>
    );
  }

  const { platform, platformLabel, platformColor, allImages, stateCode, bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model, damageType, lotNumber, condition, highlights } = vehicle;

  const whatsappMsg = encodeURIComponent(
    `Hola Ruta Cars GT! Me interesa el ${vehicle.year} ${make} ${model} (Lote #${lotNumber}) a $${bidPrice?.toLocaleString()} en ${platformLabel}. ¿Pueden ayudarme con la importación?`
  );

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="container py-8">
        <Button onClick={goBackToCatalog} variant="outline" className="border-[#243048] text-slate-400 hover:text-white mb-6 btn-press">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Catálogo
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── Galería de imágenes ── */}
          <div>
            <div className="relative aspect-video bg-[#141E30] rounded-2xl overflow-hidden mb-3">
              {allImages.length > 0 ? (
                <img src={allImages[imgIdx]} alt={`${vehicle.year} ${make} ${model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car className="w-20 h-20 text-[#243048]" /></div>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.slice(0, 8).map((_: string, i: number) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-[#00C8E0]" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.slice(0, 5).map((img: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-[#00C8E0]" : "border-transparent hover:border-[#243048]"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Highlights / notas del lote */}
            {highlights && (
              <div className="mt-4 bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> Notas del Lote</p>
                <p className="text-slate-300 text-sm">{highlights}</p>
              </div>
            )}
          </div>

          {/* ── Info + Calculadora ── */}
          <div className="space-y-5">
            {/* Header del vehículo */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2 py-1 rounded-lg text-xs font-bold text-[#080D18]" style={{ backgroundColor: platformColor }}>
                  {platformLabel}
                </span>
                {damageType && <span className="px-2 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-300">{damageType}</span>}
                {condition && <span className="px-2 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-400">{condition}</span>}
                {bodyType && <span className="px-2 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-400">{bodyType}</span>}
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">
                {vehicle.year} {make.toUpperCase()} {model.toUpperCase()}
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Lote #{lotNumber} · {stateCode}</p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gauge, label: "Odómetro", value: odometer ? `${odometer.toLocaleString()} mi` : "N/A" },
                { icon: Fuel, label: "Combustible", value: fuelType || "N/A" },
                { icon: MapPin, label: "Estado USA", value: stateCode },
                { icon: Calendar, label: "Año", value: vehicle.year || "N/A" },
              ].map(item => (
                <div key={item.label} className="bg-[#141E30] border border-[#243048] rounded-xl p-3 flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#00C8E0] flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Precio de subasta */}
            <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Precio Actual en Subasta</p>
                  <p className="text-[#00C8E0] font-bold text-3xl">${bidPrice?.toLocaleString()}</p>
                </div>
                {buyNowPrice && (
                  <div className="text-right">
                    <p className="text-slate-400 text-xs mb-1">Buy Now</p>
                    <p className="text-[#F97316] font-bold text-2xl">${buyNowPrice?.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── CALCULADORA AUTOMÁTICA ── */}
            <div className="bg-[#0D1829] border border-[#00C8E0]/20 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#00C8E0]/10 to-transparent px-5 py-4 border-b border-[#243048]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#00C8E0]" />
                  <h3 className="text-white font-semibold">Costo de Importación a Guatemala</h3>
                </div>
                <p className="text-slate-500 text-xs mt-1">Calculado automáticamente · Incluye todos los costos</p>
              </div>

              <div className="px-5 py-4">
                {calcLoading ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 className="w-5 h-5 text-[#00C8E0] animate-spin" />
                    <span className="text-slate-400 text-sm">Calculando costos...</span>
                  </div>
                ) : calcResult?.needsManualQuote ? (
                  <div className="flex flex-col items-center py-6 gap-3 text-center">
                    <AlertTriangle className="w-10 h-10 text-[#F97316]" />
                    <p className="text-white font-semibold">Este vehículo requiere cotización especial</p>
                    <p className="text-slate-400 text-sm">Por el tipo o tamaño del vehículo, necesitamos cotizar el transporte manualmente.</p>
                    <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold w-full btn-press mt-2">
                        <MessageCircle className="w-4 h-4 mr-2" /> Solicitar Cotización Especial
                      </Button>
                    </a>
                  </div>
                ) : calcResult ? (
                  <>
                    {/* Desglose de costos */}
                    <div className="space-y-0.5 mb-4">
                      {/* Precio subasta */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Precio de Subasta</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${calcResult.auctionPrice.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{Math.round(calcResult.auctionPrice * calcResult.exchangeRate).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Fees plataforma */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Fees {platform === "copart" ? "Copart" : "IAAI"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${calcResult.platformFees.total.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{Math.round(calcResult.platformFees.total * calcResult.exchangeRate).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Transporte USA */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Transporte USA ({calcResult.vehicleSize.label})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${calcResult.usaTransport.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{Math.round(calcResult.usaTransport * calcResult.exchangeRate).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Shipping marítimo */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Ship className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Shipping Marítimo (Puerto Quetzal)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${calcResult.maritimeShipping.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{Math.round(calcResult.maritimeShipping * calcResult.exchangeRate).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Impuestos GT */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Impuestos Guatemala (32% CIF)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${Math.round(calcResult.guatemalaTax / calcResult.exchangeRate).toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{calcResult.guatemalaTax.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Gastos varios */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Gastos Varios (aduana, trámites)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">${Math.round(calcResult.miscExpensesGTQ / calcResult.exchangeRate).toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{calcResult.miscExpensesGTQ.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Servicio Ruta Cars */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00C8E0]" />
                          <span className="text-[#00C8E0] text-sm font-medium">Servicio Ruta Cars GT</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#00C8E0] text-sm font-bold">${calcResult.rutaCarsServiceUSD.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-2">Q{Math.round(calcResult.rutaCarsServiceUSD * calcResult.exchangeRate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total final */}
                    <div className="border-t border-[#243048] pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 font-semibold">Total Puesto en Guatemala</p>
                          <p className="text-slate-500 text-xs mt-0.5">Precio final · Todo incluido</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#00C8E0] font-bold text-2xl">${calcResult.finalPriceUSD.toLocaleString()}</p>
                          <p className="text-[#F97316] font-bold text-lg">Q{calcResult.finalPriceGTQ.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA WhatsApp */}
                    <a href={`https://wa.me/50231220803?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="block mt-4">
                      <Button className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold w-full btn-press">
                        <MessageCircle className="w-4 h-4 mr-2" /> Hablar con un Asesor
                      </Button>
                    </a>
                    <p className="text-slate-600 text-xs text-center mt-2">
                      Respuesta en menos de 1 hora · +502 3122-0803
                    </p>
                  </>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-sm">
                    No hay precio disponible para calcular
                  </div>
                )}
              </div>
            </div>

            {/* VIN */}
            {vehicle.vin && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">VIN</p>
                <p className="text-white font-mono text-sm">{vehicle.vin}</p>
              </div>
            )}

            {/* Motor */}
            {vehicle.engine && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Motor</p>
                <p className="text-white text-sm">{typeof vehicle.engine === 'string' ? vehicle.engine : (vehicle.engine as any)?.name ?? ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
