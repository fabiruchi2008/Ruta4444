import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Car, Gauge, Fuel, MapPin, Calendar, ArrowLeft, Calculator, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
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
    if (lot.images?.normal) allImages.push(...lot.images.normal);
    else if (lot.images?.small) allImages.push(...lot.images.small);
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
  return { ...v, platform, platformLabel, platformColor, allImages, stateCode, bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model, damageType, lotNumber, condition };
}

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [imgIdx, setImgIdx] = useState(0);

  const { data: rawVehicle, isLoading } = trpc.vehicleDetail.getById.useQuery({ id: id! }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080D18] pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00C8E0] animate-spin" />
      </div>
    );
  }

  if (!rawVehicle) {
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

  const vehicle = normalizeVehicleDetail(rawVehicle);
  const { platform, platformLabel, platformColor, allImages, stateCode, bidPrice, buyNowPrice, odometer, fuelType, bodyType, make, model, damageType, lotNumber, condition } = vehicle;
  const quoteUrl = `/cotizador?platform=${platform}&state=${stateCode}&price=${bidPrice}&title=${encodeURIComponent(`${vehicle.year} ${make} ${model}`)}&body=${encodeURIComponent(bodyType || "")}`;

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="container py-8">
        <Link href="/catalogo">
          <Button variant="outline" className="border-[#243048] text-slate-400 hover:text-white mb-6 btn-press">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Catálogo
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative aspect-video bg-[#141E30] rounded-2xl overflow-hidden mb-3">
              {allImages.length > 0 ? (
                <img src={allImages[imgIdx]} alt={`${vehicle.year} ${make} ${model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car className="w-20 h-20 text-[#243048]" /></div>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                    <ChevronRight className="w-4 h-4" />
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
                  <button key={i} onClick={() => setImgIdx(i)} className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-[#00C8E0]" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-lg text-xs font-bold text-[#080D18]" style={{ backgroundColor: platformColor }}>
                  {platformLabel}
                </span>
                {damageType && <span className="px-2 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-300">{damageType}</span>}
                {condition && <span className="px-2 py-1 rounded-lg text-xs bg-[#141E30] border border-[#243048] text-slate-400">{condition}</span>}
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-white">{vehicle.year} {make.toUpperCase()} {model.toUpperCase()}</h1>
              <p className="text-slate-400 mt-1">{bodyType} · Lote #{lotNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gauge, label: "Odómetro", value: odometer ? `${odometer.toLocaleString()} mi` : "N/A" },
                { icon: Fuel, label: "Combustible", value: fuelType || "N/A" },
                { icon: MapPin, label: "Estado", value: stateCode },
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

            <div className="bg-[#141E30] border border-[#243048] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Precio Actual</span>
                <span className="text-[#00C8E0] font-bold text-3xl">${bidPrice?.toLocaleString()}</span>
              </div>
              {buyNowPrice && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400">Buy Now</span>
                  <span className="text-[#F97316] font-bold text-2xl">${buyNowPrice?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex flex-col gap-3 mt-4">
                <Link href={quoteUrl}>
                  <Button className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold btn-press w-full">
                    <Calculator className="w-4 h-4 mr-2" /> Calcular Importación Completa
                  </Button>
                </Link>
                <a href={`https://wa.me/50231220803?text=${encodeURIComponent(`Hola! Me interesa el ${vehicle.year} ${make} ${model} (Lote #${lotNumber}) a $${bidPrice?.toLocaleString()}`)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 w-full btn-press">
                    <MessageCircle className="w-4 h-4 mr-2" /> Consultar por WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {vehicle.vin && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">VIN</p>
                <p className="text-white font-mono text-sm">{vehicle.vin}</p>
              </div>
            )}

            {vehicle.engine && (
              <div className="bg-[#141E30] border border-[#243048] rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Motor</p>
                <p className="text-white text-sm">{vehicle.engine.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
