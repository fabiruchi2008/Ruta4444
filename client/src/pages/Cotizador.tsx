import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Car, DollarSign, TrendingUp, ArrowRight, Info, CheckCircle, AlertTriangle, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

function CostRow({ label, value, color = "text-slate-300", highlight = false }: any) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-[#243048]/40 last:border-0 ${highlight ? "bg-[#1A2540]/50 -mx-4 px-4 rounded-lg" : ""}`}>
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${color}`}>{value}</span>
    </div>
  );
}

export default function Cotizador() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [form, setForm] = useState({
    auctionPrice: parseFloat(params.get("price") || "") || 5000,
    platform: (params.get("platform") as "copart" | "iaai") || "copart",
    stateCode: params.get("state") || "FL",
    bodyType: params.get("body") || "auto",
    customDutyRate: 0.20,
  });

  const [vehicleTitle, setVehicleTitle] = useState(params.get("title") || "");
  const [vehicleYear, setVehicleYear] = useState(2020);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [damage, setDamage] = useState("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const { data: calcData, isLoading: calcLoading } = trpc.calculator.calculate.useQuery({
    auctionPrice: form.auctionPrice,
    platform: form.platform,
    stateCode: form.stateCode,
    bodyType: (form.bodyType === "auto" || !form.bodyType) ? null : form.bodyType,
    customDutyRate: form.customDutyRate,
  }, { enabled: form.auctionPrice > 0 });

  const { data: marketData, isLoading: marketLoading } = trpc.calculator.marketAnalysis.useQuery({
    vehicleTitle: vehicleTitle || `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
    vehicleYear,
    make: vehicleMake || "Toyota",
    model: vehicleModel || "Camry",
    auctionPrice: form.auctionPrice,
    damage: damage || undefined,
    totalCostUSD: calcData?.totalUSD || 0,
    totalCostGTQ: calcData?.totalGTQ || 0,
    exchangeRate: calcData?.exchangeRate || 7.75,
  }, {
    enabled: !!calcData && form.auctionPrice > 0,
    staleTime: 5 * 60 * 1000,
  });

  const createQuote = trpc.quotes.create.useMutation({
    onSuccess: () => {
      toast.success("¡Cotización enviada! Te contactaremos pronto.");
      const waMsg = encodeURIComponent(
        `Hola Ruta Cars GT! Acabo de cotizar un vehículo:\n` +
        `${vehicleTitle || "Vehículo"}\n` +
        `Precio subasta: $${form.auctionPrice.toLocaleString()}\n` +
        `Total importación: $${calcData?.totalUSD?.toFixed(2)}\n` +
        `Quiero más información.`
      );
      window.open(`https://wa.me/50231220803?text=${waMsg}`, "_blank");
    },
    onError: () => toast.error("Error al enviar cotización. Intenta de nuevo."),
  });

  function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !clientPhone) return toast.error("Nombre y teléfono son requeridos");
    createQuote.mutate({
      clientName,
      clientPhone,
      clientEmail: clientEmail || undefined,
      vehicleTitle: vehicleTitle || undefined,
      vehicleYear,
      vehicleMake: vehicleMake || undefined,
      vehicleModel: vehicleModel || undefined,
      vehicleBodyType: form.bodyType || undefined,
      vehicleStateCode: form.stateCode,
      platform: form.platform,
      auctionPrice: form.auctionPrice,
      platformFees: (calcData?.platformFees as any)?.total ?? (calcData?.platformFees as any),
      usaTransport: calcData?.usaTransport,
      maritimeShipping: calcData?.maritimeShipping,
      cifValue: calcData?.cifValue,
      customsDuty: calcData?.customsDuty,
      vat: calcData?.vat,
      customsAdminFee: calcData?.customsAdminFee,
      rutaCarsService: calcData?.rutaCarsService,
      totalUSD: calcData?.totalUSD,
      totalGTQ: calcData?.totalGTQ,
      exchangeRate: calcData?.exchangeRate,
    });
  }

  const profitGTQ = marketData?.estimatedProfitGTQ || 0;
  const isGoodDeal = profitGTQ > 0;

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-8">
        <div className="container">
          <h1 className="font-display text-4xl md:text-5xl text-white">
            COTIZADOR <span className="text-[#00C8E0]">AUTOMÁTICO</span>
          </h1>
          <p className="text-slate-400 mt-1">Calcula el costo total de importación en segundos</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-[#00C8E0]" /> Datos del Vehículo
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-300 text-sm mb-1.5 block">Descripción (opcional)</Label>
                  <Input
                    placeholder="Ej: 2021 Toyota RAV4"
                    value={vehicleTitle}
                    onChange={e => setVehicleTitle(e.target.value)}
                    className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500 focus:border-[#00C8E0]/50"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Marca</Label>
                  <Input placeholder="Toyota" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Modelo</Label>
                  <Input placeholder="RAV4" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Año</Label>
                  <Input type="number" value={vehicleYear} onChange={e => setVehicleYear(parseInt(e.target.value) || 2020)} className="bg-[#0F1624] border-[#243048] text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Tipo de daño</Label>
                  <Input placeholder="Ej: Front End" value={damage} onChange={e => setDamage(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" />
                </div>
              </div>
            </div>

            <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#F97316]" /> Datos de Subasta
              </h2>

              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  Precio de Subasta: <span className="text-[#00C8E0] font-bold">${form.auctionPrice.toLocaleString()}</span>
                </Label>
                <Slider
                  value={[form.auctionPrice]}
                  onValueChange={([v]) => setForm(f => ({ ...f, auctionPrice: v }))}
                  min={500}
                  max={50000}
                  step={100}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$500</span><span>$50,000</span>
                </div>
                <Input
                  type="number"
                  value={form.auctionPrice}
                  onChange={e => setForm(f => ({ ...f, auctionPrice: parseFloat(e.target.value) || 0 }))}
                  className="mt-2 bg-[#0F1624] border-[#243048] text-white"
                  placeholder="O escribe el precio exacto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Plataforma</Label>
                  <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as "copart" | "iaai" }))}>
                    <SelectTrigger className="bg-[#0F1624] border-[#243048] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141E30] border-[#243048]">
                      <SelectItem value="copart">Copart</SelectItem>
                      <SelectItem value="iaai">IAAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Estado USA</Label>
                  <Select value={form.stateCode} onValueChange={v => setForm(f => ({ ...f, stateCode: v }))}>
                    <SelectTrigger className="bg-[#0F1624] border-[#243048] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141E30] border-[#243048] max-h-48">
                      {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Tipo de Vehículo</Label>
                  <Select value={form.bodyType} onValueChange={v => setForm(f => ({ ...f, bodyType: v }))}>
                    <SelectTrigger className="bg-[#0F1624] border-[#243048] text-white">
                      <SelectValue placeholder="Auto detectar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141E30] border-[#243048]">
                      <SelectItem value="auto">Auto detectar</SelectItem>
                      <SelectItem value="Sedan">Sedán</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                      <SelectItem value="Van">Van/Minivan</SelectItem>
                      <SelectItem value="Coupe">Coupe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">
                    Arancel: <span className="text-[#00C8E0]">{(form.customDutyRate * 100).toFixed(0)}%</span>
                  </Label>
                  <Slider
                    value={[form.customDutyRate * 100]}
                    onValueChange={([v]) => setForm(f => ({ ...f, customDutyRate: v / 100 }))}
                    min={15}
                    max={25}
                    step={1}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1"><span>15%</span><span>25%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-[#00C8E0]" /> Desglose de Costos
              </h2>
              {calcLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#00C8E0] animate-spin" />
                </div>
              ) : calcData ? (
                <div className="space-y-0">
                  <CostRow label="Precio de Subasta" value={`$${calcData.auctionPrice?.toLocaleString()}`} color="text-white" />
                  <CostRow label={`Fees ${form.platform === "copart" ? "Copart" : "IAAI"}`} value={`$${((calcData.platformFees as any)?.total ?? calcData.platformFees ?? 0).toFixed(2)}`} />
                  <CostRow label={`Transporte USA (${(calcData.vehicleSize as any)?.label ?? "Estándar"}) — ${form.stateCode}`} value={calcData.needsManualQuote ? "Cotización manual" : `$${calcData.usaTransport?.toFixed(2)}`} color={calcData.needsManualQuote ? "text-[#F97316]" : "text-slate-300"} />
                  <CostRow label="Shipping Marítimo a Guatemala" value={`$${calcData.maritimeShipping?.toFixed(2)}`} />
                  <CostRow label="Valor CIF" value={`$${calcData.cifValue?.toFixed(2)}`} color="text-slate-200" />
                  <CostRow label={`Aranceles (${(form.customDutyRate * 100).toFixed(0)}% sobre CIF)`} value={`$${calcData.customsDuty?.toFixed(2)}`} />
                  <CostRow label="IVA (12%)" value={`$${calcData.vat?.toFixed(2)}`} />
                  <CostRow label="Costos Aduanales" value={`$${calcData.customsAdminFee?.toFixed(2)}`} />
                  <CostRow label="Servicio Ruta Cars GT" value={`$${calcData.rutaCarsService?.toFixed(2)}`} color="text-[#F97316]" />
                  <div className="mt-4 pt-4 border-t border-[#243048]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold text-lg">TOTAL USD</span>
                      <span className="text-[#00C8E0] font-bold text-2xl">${calcData.totalUSD?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total en Quetzales</span>
                      <span className="text-slate-200 font-semibold text-lg">Q{calcData.totalGTQ?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Tipo de cambio: Q{calcData.exchangeRate} / $1 USD</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Market Analysis */}
            <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#22C55E]" /> Análisis de Mercado Guatemala
              </h2>
              {marketLoading ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="w-6 h-6 text-[#22C55E] animate-spin" />
                  <span className="text-slate-400 text-sm">Analizando mercado guatemalteco...</span>
                </div>
              ) : marketData ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isGoodDeal ? "bg-[#22C55E]/10 border-[#22C55E]/20" : "bg-[#F97316]/10 border-[#F97316]/20"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isGoodDeal ? <CheckCircle className="w-5 h-5 text-[#22C55E]" /> : <AlertTriangle className="w-5 h-5 text-[#F97316]" />}
                      <span className={`font-semibold ${isGoodDeal ? "text-[#22C55E]" : "text-[#F97316]"}`}>
                        {isGoodDeal ? "¡Vehículo con buen potencial en Guatemala!" : "Mercado con demanda limitada"}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{marketData.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0F1624] rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Precio Mercado GT</p>
                      <p className="text-white font-bold text-lg">Q{marketData.estimatedMarketPriceGTQ?.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">Rango: Q{marketData.priceRangeMin?.toLocaleString()} - Q{marketData.priceRangeMax?.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0F1624] rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Valor vs Costo de Importación</p>
                      <p className={`font-bold text-lg ${isGoodDeal ? "text-[#22C55E]" : "text-[#F97316]"}`}>
                        {isGoodDeal ? "+" : ""}Q{marketData.estimatedProfitGTQ?.toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-xs">{marketData.profitMarginPercent?.toFixed(1)}% sobre costo total</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Demanda en Guatemala</span>
                    <span className={`font-medium capitalize ${marketData.marketDemand === "alta" ? "text-[#22C55E]" : marketData.marketDemand === "media" ? "text-[#F97316]" : "text-red-400"}`}>
                      {marketData.marketDemand}
                    </span>
                  </div>

                  {marketData.repairCostEstimateUSD > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Reparación estimada</span>
                      <span className="text-[#F97316] font-medium">${marketData.repairCostEstimateUSD?.toLocaleString()}</span>
                    </div>
                  )}

                  {marketData.comparableVehicles?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs mb-2">Comparables en Guatemala</p>
                      <div className="space-y-1">
                        {marketData.comparableVehicles.slice(0, 3).map((v: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 text-xs">{v.description}</span>
                            <span className="text-slate-200 font-medium text-xs">Q{v.priceGTQ?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">Ingresa los datos del vehículo para ver el análisis de mercado</p>
              )}
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-[#141E30] to-[#1A2540] border border-[#243048] rounded-2xl p-6">
              {!showQuoteForm ? (
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-white text-lg">¿Te interesa este vehículo?</h3>
                  <p className="text-slate-400 text-sm">Envíanos tu cotización y un asesor te contactará para confirmar la compra.</p>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => setShowQuoteForm(true)} className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold btn-press w-full">
                      Solicitar Cotización Formal
                    </Button>
                    <a href={`https://wa.me/50231220803?text=${encodeURIComponent(`Hola! Me interesa cotizar: ${vehicleTitle || "un vehículo"} desde ${form.stateCode}. Precio subasta: $${form.auctionPrice.toLocaleString()}`)}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 w-full btn-press">
                        <MessageCircle className="w-4 h-4 mr-2" /> Hablar por WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <h3 className="font-semibold text-white text-lg">Datos de Contacto</h3>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">Nombre completo *</Label>
                    <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Tu nombre" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" required />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">WhatsApp / Teléfono *</Label>
                    <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+502 XXXX-XXXX" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" required />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">Email (opcional)</Label>
                    <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="tu@email.com" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="border-[#243048] text-slate-400 flex-1" onClick={() => setShowQuoteForm(false)}>Cancelar</Button>
                    <Button type="submit" className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold flex-1 btn-press" disabled={createQuote.isPending}>
                      {createQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar y Contactar"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
