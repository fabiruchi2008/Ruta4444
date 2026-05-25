import { useState } from "react";
import { Calculator, DollarSign, TrendingDown, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const BODY_TYPES = [
  { value: "sedan", label: "Sedán" },
  { value: "suv", label: "SUV mediano" },
  { value: "large_suv", label: "SUV grande (Tahoe, Expedition)" },
  { value: "pickup", label: "Pickup / Camioneta" },
  { value: "van", label: "Van / Minivan" },
  { value: "coupe", label: "Coupé / Hatchback" },
];

export default function AdminCalculadora() {
  const { user, isAuthenticated } = useAuth();

  const [auctionPrice, setAuctionPrice] = useState("");
  const [platform, setPlatform] = useState<"copart" | "iaai">("copart");
  const [stateCode, setStateCode] = useState("TX");
  const [bodyType, setBodyType] = useState("sedan");
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading, error } = trpc.admin.calculateReal.useQuery(
    {
      auctionPrice: parseFloat(auctionPrice) || 0,
      platform,
      stateCode,
      bodyType,
    },
    {
      enabled: enabled && !!auctionPrice && parseFloat(auctionPrice) > 0,
      staleTime: 0,
    }
  );

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080D18] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[#F97316] mx-auto mb-4" />
          <p className="text-white text-xl font-bold">Acceso restringido</p>
          <p className="text-slate-400 mt-2">Solo administradores pueden ver esta página.</p>
          <Link href="/admin">
            <Button className="mt-6 bg-[#00C8E0] text-[#080D18] font-bold">Volver al Admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleCalcular() {
    if (!auctionPrice || parseFloat(auctionPrice) <= 0) return;
    setEnabled(true);
  }

  const fmt = (n: number) => n.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-[#080D18] text-white">
      {/* Header */}
      <div className="bg-[#0B1220] border-b border-[#1F2D45] px-6 py-4 flex items-center gap-4">
        <Link href="/admin">
          <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Admin
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Calculator className="w-5 h-5 text-[#F97316]" />
          <h1 className="text-lg font-bold text-white">Calculadora Interna</h1>
          <span className="text-xs bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30 px-2 py-0.5 rounded font-semibold">SOLO ADMIN</span>
        </div>
      </div>

      <div className="container max-w-3xl py-8 px-4">
        <p className="text-slate-400 text-sm mb-6">
          Calcula el <strong className="text-white">costo real de importación</strong> sin incluir ganancia. 
          Esto te muestra exactamente cuánto te cuesta traer el carro a Guatemala.
        </p>

        {/* Formulario */}
        <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-6 space-y-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Precio de subasta */}
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Precio de Subasta / Buy Now (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <Input
                  type="number"
                  placeholder="8500"
                  value={auctionPrice}
                  onChange={e => { setAuctionPrice(e.target.value); setEnabled(false); }}
                  className="bg-[#141E30] border-[#243048] text-white pl-7"
                />
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Plataforma</Label>
              <Select value={platform} onValueChange={v => { setPlatform(v as "copart" | "iaai"); setEnabled(false); }}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048]">
                  <SelectItem value="copart" className="text-white">Copart</SelectItem>
                  <SelectItem value="iaai" className="text-white">IAAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado USA */}
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Estado USA (ubicación del carro)</Label>
              <Select value={stateCode} onValueChange={v => { setStateCode(v); setEnabled(false); }}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048] max-h-48">
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de carrocería */}
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Tipo de Vehículo</Label>
              <Select value={bodyType} onValueChange={v => { setBodyType(v); setEnabled(false); }}>
                <SelectTrigger className="bg-[#141E30] border-[#243048] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141E30] border-[#243048]">
                  {BODY_TYPES.map(b => (
                    <SelectItem key={b.value} value={b.value} className="text-white">{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCalcular}
            disabled={!auctionPrice || parseFloat(auctionPrice) <= 0 || isLoading}
            className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold text-base py-5 btn-press"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculando...</> : <><Calculator className="w-4 h-4 mr-2" /> Calcular Costo Real</>}
          </Button>
        </div>

        {/* Resultado */}
        {data && !isLoading && (
          <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl overflow-hidden">
            {/* Header resultado */}
            <div className="bg-[#F97316]/10 border-b border-[#F97316]/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#F97316]" />
                <span className="font-bold text-white">Costo Real de Importación</span>
                <span className="text-xs text-[#F97316] font-medium">(sin ganancia)</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[#F97316]">${fmt(data.finalPriceUSD)} USD</div>
                <div className="text-sm text-slate-400">Q{fmt(data.finalPriceGTQ)} GTQ</div>
              </div>
            </div>

            {/* Desglose */}
            <div className="px-6 py-4 space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Desglose de costos</p>

              {data.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1F2D45]/50 last:border-0">
                  <span className="text-slate-300 text-sm">{item.label}</span>
                  <div className="text-right">
                    <span className="text-white font-semibold text-sm">${fmt(item.amountUSD)}</span>
                    <span className="text-slate-500 text-xs ml-2">/ Q{fmt(item.amountGTQ)}</span>
                  </div>
                </div>
              ))}

              {/* Separador y total */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-[#F97316]/30">
                <span className="font-bold text-white">TOTAL COSTO REAL</span>
                <div className="text-right">
                  <span className="text-[#F97316] font-black text-lg">${fmt(data.finalPriceUSD)} USD</span>
                  <div className="text-slate-400 text-xs">Q{fmt(data.finalPriceGTQ)} GTQ</div>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-[#141E30] border-t border-[#1F2D45] px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Tamaño detectado</p>
                <p className="text-white font-medium">{data.vehicleSize.label}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Tipo de cambio</p>
                <p className="text-white font-medium">Q{data.exchangeRate.toFixed(2)} / $1</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Fuente tarifa grúa</p>
                <p className="text-white font-medium capitalize">{data.inlandRateSource ?? "fallback"}</p>
              </div>
            </div>

            {/* Nota de ganancia */}
            <div className="px-6 py-3 bg-emerald-500/5 border-t border-emerald-500/10">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-emerald-400 text-xs">
                  <strong>Nota:</strong> Este es el costo real sin ganancia. 
                  Para calcular el precio al cliente, sumá tu ganancia deseada a <strong>${fmt(data.finalPriceUSD)} USD</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            Error al calcular: {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
