import { useState } from "react";
import {
  Calculator, DollarSign, TrendingDown, ArrowLeft, Loader2,
  AlertTriangle, Search, Hash, SlidersHorizontal, Car, MapPin,
  CheckCircle2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const fmt = (n: number) =>
  n.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

// ─── Componente de resultado compartido ───────────────────────────────────────
function ResultCard({ data, ganancia, setGanancia }: {
  data: any;
  ganancia: string;
  setGanancia: (v: string) => void;
}) {
  const gananciaN = parseFloat(ganancia) || 0;
  const precioCliente = data.finalPriceUSD + gananciaN;
  const precioClienteGTQ = Math.round(precioCliente * data.exchangeRate);

  return (
    <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl overflow-hidden mt-6">
      {/* Header */}
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
        {data.breakdown.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#1F2D45]/50 last:border-0">
            <span className="text-slate-300 text-sm">{item.label}</span>
            <div className="text-right">
              <span className="text-white font-semibold text-sm">${fmt(item.amountUSD)}</span>
              <span className="text-slate-500 text-xs ml-2">/ Q{fmt(item.amountGTQ)}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-[#F97316]/30">
          <span className="font-bold text-white">TOTAL COSTO REAL</span>
          <div className="text-right">
            <span className="text-[#F97316] font-black text-lg">${fmt(data.finalPriceUSD)} USD</span>
            <div className="text-slate-400 text-xs">Q{fmt(data.finalPriceGTQ)} GTQ</div>
          </div>
        </div>
      </div>

      {/* Calculadora de ganancia */}
      <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10">
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" /> Simular precio al cliente
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <Input
              type="number"
              placeholder="Tu ganancia en USD"
              value={ganancia}
              onChange={e => setGanancia(e.target.value)}
              className="bg-[#141E30] border-[#243048] text-white pl-7"
            />
          </div>
          <span className="text-slate-400 text-sm shrink-0">ganancia</span>
        </div>
        {gananciaN > 0 && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-emerald-300 text-sm font-medium">Precio al cliente</span>
              <div className="text-right">
                <span className="text-emerald-400 font-black text-xl">${fmt(precioCliente)} USD</span>
                <div className="text-emerald-300/60 text-xs">Q{fmt(precioClienteGTQ)} GTQ</div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-emerald-500/20">
              <span className="text-slate-400 text-xs">Tu ganancia</span>
              <span className="text-emerald-400 font-bold text-sm">${fmt(gananciaN)} USD / Q{fmt(Math.round(gananciaN * data.exchangeRate))} GTQ</span>
            </div>
          </div>
        )}
      </div>

      {/* Info adicional */}
      <div className="bg-[#141E30] border-t border-[#1F2D45] px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-500 text-xs mb-1">Tamaño detectado</p>
          <p className="text-white font-medium">{data.vehicleSize?.label ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Tipo de cambio</p>
          <p className="text-white font-medium">Q{data.exchangeRate?.toFixed(2)} / $1</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Fuente tarifa grúa</p>
          <p className="text-white font-medium capitalize">{data.inlandRateSource ?? "fallback"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Por Lote ─────────────────────────────────────────────────────────────
function TabPorLote({ isAuth }: { isAuth: boolean }) {
  const [lotInput, setLotInput] = useState("");
  const [lotQuery, setLotQuery] = useState("");
  const [calcEnabled, setCalcEnabled] = useState(false);
  const [ganancia, setGanancia] = useState("");

  const { data: lotData, isLoading: lotLoading, error: lotError } = trpc.admin.getLotForCalc.useQuery(
    { lot: lotQuery },
    { enabled: isAuth && !!lotQuery, staleTime: 60_000, retry: false }
  );

  const { data: calcData, isLoading: calcLoading, error: calcError } = trpc.admin.calculateReal.useQuery(
    {
      auctionPrice: lotData?.auctionPrice ?? 0,
      platform: (lotData?.platform as "copart" | "iaai") ?? "copart",
      stateCode: lotData?.stateCode ?? "TX",
      bodyType: lotData?.bodyType ?? null,
      city: lotData?.city ?? null,
    },
    { enabled: calcEnabled && !!lotData && (lotData.auctionPrice ?? 0) > 0, staleTime: 0 }
  );

  function handleBuscar() {
    const v = lotInput.trim();
    if (!v) return;
    setCalcEnabled(false);
    setGanancia("");
    setLotQuery(v);
  }

  function handleCalcular() {
    setCalcEnabled(true);
  }

  const isLoading = lotLoading || calcLoading;

  return (
    <div className="space-y-5">
      <p className="text-slate-400 text-sm">
        Ingresá el número de lote de <strong className="text-white">Copart o IAAI</strong> y el sistema carga los datos automáticamente.
      </p>

      {/* Búsqueda por lote */}
      <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-6">
        <Label className="text-slate-300 text-sm mb-2 block">Número de Lote</Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Ej: 45036814"
              value={lotInput}
              onChange={e => setLotInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBuscar()}
              className="bg-[#141E30] border-[#243048] text-white pl-9"
            />
          </div>
          <Button
            onClick={handleBuscar}
            disabled={!lotInput.trim() || lotLoading}
            className="bg-[#00C8E0] hover:bg-[#00C8E0]/90 text-[#080D18] font-bold px-5"
          >
            {lotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        {lotError && (
          <p className="text-red-400 text-sm mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {lotError.message}
          </p>
        )}

        {/* Datos del lote encontrado */}
        {lotData && !lotLoading && (
          <div className="mt-4 p-4 bg-[#141E30] border border-[#243048] rounded-xl">
            <div className="flex items-start gap-4">
              {lotData.image && (
                <img src={lotData.image} alt={lotData.title ?? ""} className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase">Lote encontrado</span>
                </div>
                <p className="text-white font-bold text-base truncate">
                  {lotData.year} {lotData.make} {lotData.model}
                </p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {lotData.bodyType ?? "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lotData.stateCode}</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-[#1F2D45] text-slate-300">{lotData.platform}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-400 text-xs">Buy Now / Bid</p>
                <p className="text-[#F97316] font-black text-xl">${fmt(lotData.auctionPrice)}</p>
              </div>
            </div>

            <Button
              onClick={handleCalcular}
              disabled={calcLoading || (lotData.auctionPrice ?? 0) <= 0}
              className="w-full mt-4 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold py-5"
            >
              {calcLoading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculando...</>
                : <><Calculator className="w-4 h-4 mr-2" /> Calcular Costo Real</>}
            </Button>
          </div>
        )}
      </div>

      {calcError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Error al calcular: {calcError.message}
        </div>
      )}

      {calcData && !calcLoading && (
        <ResultCard data={calcData} ganancia={ganancia} setGanancia={setGanancia} />
      )}
    </div>
  );
}

// ─── Tab: Manual ───────────────────────────────────────────────────────────────
function TabManual() {
  const [auctionPrice, setAuctionPrice] = useState("");
  const [platform, setPlatform] = useState<"copart" | "iaai">("copart");
  const [stateCode, setStateCode] = useState("TX");
  const [bodyType, setBodyType] = useState("sedan");
  const [enabled, setEnabled] = useState(false);
  const [ganancia, setGanancia] = useState("");

  const { data, isLoading, error } = trpc.admin.calculateReal.useQuery(
    { auctionPrice: parseFloat(auctionPrice) || 0, platform, stateCode, bodyType },
    { enabled: enabled && !!auctionPrice && parseFloat(auctionPrice) > 0, staleTime: 0 }
  );

  function handleCalcular() {
    if (!auctionPrice || parseFloat(auctionPrice) <= 0) return;
    setEnabled(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-slate-400 text-sm">
        Ingresá los datos manualmente para calcular el costo real de importación.
      </p>

      <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Precio */}
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Precio de Subasta / Buy Now (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input
                type="number"
                placeholder="8500"
                value={auctionPrice}
                onChange={e => { setAuctionPrice(e.target.value); setEnabled(false); setGanancia(""); }}
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

          {/* Estado */}
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Estado USA</Label>
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

          {/* Tipo */}
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
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculando...</>
            : <><Calculator className="w-4 h-4 mr-2" /> Calcular Costo Real</>}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Error al calcular: {error.message}
        </div>
      )}

      {data && !isLoading && (
        <ResultCard data={data} ganancia={ganancia} setGanancia={setGanancia} />
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
// ─── Tab: Cotización Cliente ──────────────────────────────────────────────────
function TabClientQuote({ isAuth }: { isAuth: boolean }) {
  const [lotInput, setLotInput] = useState("");
  const [lotQuery, setLotQuery] = useState("");
  const [ganancia, setGanancia] = useState("");
  const [gananciaN, setGananciaN] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: lotData, isLoading: lotLoading, error: lotError } = trpc.admin.getLotForCalc.useQuery(
    { lot: lotQuery },
    { enabled: isAuth && !!lotQuery, staleTime: 60_000, retry: false }
  );

  const { data: calcData, isLoading: calcLoading } = trpc.admin.calculateReal.useQuery(
    {
      auctionPrice: lotData?.auctionPrice ?? 0,
      platform: (lotData?.platform as "copart" | "iaai") ?? "copart",
      stateCode: lotData?.stateCode ?? "TX",
      bodyType: lotData?.bodyType ?? null,
      city: lotData?.city ?? null,
    },
    { enabled: !!lotData && (lotData.auctionPrice ?? 0) > 0, staleTime: 0 }
  );

  function handleBuscar() {
    const v = lotInput.trim();
    if (!v) return;
    setGanancia("");
    setGananciaN(0);
    setLotQuery(v);
  }

  async function handleGeneratePDF() {
    if (!lotData || !calcData || !gananciaN) return;
    
    setIsGenerating(true);
    try {
      // Usar exactamente la misma fórmula que la UI
      const precioClienteGTQ = Math.round((calcData.finalPriceUSD + gananciaN / calcData.exchangeRate) * calcData.exchangeRate);
      
      // Generar PDF con jsPDF
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const LOGO_URL = "/manus-storage/ruta-cars-logo-v2_407315c0.png";
      const margin = 12;
      let yPos = margin;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // HEADER: Logo + Title (Compact)
      // ═══════════════════════════════════════════════════════════════════════════
      
      try {
        doc.addImage(LOGO_URL, "PNG", margin, yPos, 14, 14);
      } catch (e) {
        console.warn("Error adding logo:", e);
      }
      
      doc.setFontSize(16);
      doc.setTextColor(0, 200, 224);
      doc.text("RUTA CARS GT", margin + 18, yPos + 4);
      
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("Cotización de Importación", margin + 18, yPos + 10);
      
      yPos += 18;
      
      // Línea separadora
      doc.setDrawColor(0, 200, 224);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 3;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // LAYOUT: 2 COLUMNAS (Izq: Info, Der: Foto)
      // ═══════════════════════════════════════════════════════════════════════════
      
      const leftColWidth = 80;
      const rightColWidth = pageWidth - margin * 2 - leftColWidth - 2;
      
      // COLUMNA IZQUIERDA: Información compacta
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`${lotData.year} ${lotData.make} ${lotData.model}`, margin, yPos);
      yPos += 4;
      
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      const infoLines = [
        `VIN: ${lotData.vin || "—"}`,
        `Lote: ${lotData.lot || lotQuery}`,
        `Plataforma: ${lotData.platform?.toUpperCase() || "—"}`,
        `Ubicación: ${lotData.city}, ${lotData.stateCode}`,
        `Tipo: ${lotData.bodyType || "—"}`,
        `Odómetro: ${lotData.odometer ? fmt(lotData.odometer) + " mi" : "—"}`,
        `Condición: ${lotData.condition || "—"}`,
        `Daño: ${lotData.damageMain || "—"}`,
      ];
      
      const leftColStartY = yPos;
      infoLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 3;
      });
      
      // COLUMNA DERECHA: Foto principal (compacta)
      const photoX = margin + leftColWidth + 2;
      const photoY = leftColStartY - 4;
      const photoWidth = rightColWidth;
      const photoHeight = 35;
      
      if (lotData.image) {
        try {
          doc.addImage(lotData.image, "JPEG", photoX, photoY, photoWidth, photoHeight);
        } catch (e) {
          console.warn("Error adding main image:", e);
        }
      }
      
      yPos = Math.max(yPos, photoY + photoHeight + 2);
      yPos += 2;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // MINI GALLERY: Thumbnails compactos (3 columnas)
      // ═══════════════════════════════════════════════════════════════════════════
      
      const allImages = (lotData as any).allImages || [];
      if (allImages.length > 0 && yPos < pageHeight - 40) {
        doc.setDrawColor(0, 200, 224);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 2;
        
        doc.setFontSize(7);
        doc.setTextColor(0, 200, 224);
        doc.text("Galería", margin, yPos);
        yPos += 2.5;
        
        const thumbWidth = (pageWidth - margin * 2 - 4) / 3;
        const thumbHeight = 16;
        const maxThumbs = 6;
        
        for (let i = 0; i < Math.min(allImages.length, maxThumbs); i++) {
          const imgUrl = allImages[i];
          if (!imgUrl) continue;
          
          const col = i % 3;
          const row = Math.floor(i / 3);
          const xPos = margin + col * (thumbWidth + 1.5);
          const currentYPos = yPos + row * (thumbHeight + 1);
          
          try {
            doc.addImage(imgUrl, "JPEG", xPos, currentYPos, thumbWidth, thumbHeight);
          } catch (e) {
            console.warn(`Error adding thumbnail ${i}:`, e);
          }
        }
        
        yPos += (Math.ceil(Math.min(allImages.length, maxThumbs) / 3)) * (thumbHeight + 1) + 2;
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // FINAL PRICE SECTION (Bottom of page)
      // ═══════════════════════════════════════════════════════════════════════════
      
      yPos = Math.max(yPos, pageHeight - 28);
      
      doc.setDrawColor(0, 200, 224);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 3;
      
      doc.setFontSize(8);
      doc.setTextColor(0, 200, 224);
      doc.text("PRECIO TOTAL AL CLIENTE", pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
      
      doc.setFontSize(20);
      doc.setTextColor(249, 115, 22);
      doc.text(`Q${fmt(Math.round(precioClienteGTQ))}`, pageWidth / 2, yPos, { align: "center" });
      
      // Footer
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("Ruta Cars GT | Importación de Vehículos USA a Guatemala", pageWidth / 2, pageHeight - 2, { align: "center" });
      
      // Descargar PDF
      doc.save(`Cotizacion_${lotData.year}_${lotData.make}_${lotData.model}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  const isLoading = lotLoading || calcLoading;

  return (
    <div className="space-y-5">
      <p className="text-slate-400 text-sm">
        Genera una cotización en PDF con el precio total al cliente. Ingresá el número de lote y tu ganancia deseada en quetzales.
      </p>

      {/* Búsqueda por lote */}
      <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-6">
        <Label className="text-slate-300 text-sm mb-2 block">Número de Lote</Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Ej: 45036814"
              value={lotInput}
              onChange={e => setLotInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBuscar()}
              className="bg-[#141E30] border-[#243048] text-white pl-9"
            />
          </div>
          <Button
            onClick={handleBuscar}
            disabled={!lotInput.trim() || lotLoading}
            className="bg-[#00C8E0] hover:bg-[#00C8E0]/90 text-[#080D18] font-bold px-5"
          >
            {lotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        {lotError && (
          <p className="text-red-400 text-sm mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {lotError.message}
          </p>
        )}

        {/* Datos del lote encontrado */}
        {lotData && !lotLoading && (
          <div className="mt-4 p-4 bg-[#141E30] border border-[#243048] rounded-xl">
            <div className="flex items-start gap-4">
              {lotData.image && (
                <img src={lotData.image} alt={lotData.title ?? ""} className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase">Lote encontrado</span>
                </div>
                <p className="text-white font-bold text-base truncate">
                  {lotData.year} {lotData.make} {lotData.model}
                </p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {lotData.bodyType ?? "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lotData.stateCode}</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-[#1F2D45] text-slate-300">{lotData.platform}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-400 text-xs">Buy Now / Bid</p>
                <p className="text-[#F97316] font-black text-xl">${fmt(lotData.auctionPrice)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ganancia deseada */}
      {lotData && calcData && (
        <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-6">
          <Label className="text-slate-300 text-sm mb-2 block">Ganancia Deseada (GTQ)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Q</span>
            <Input
              type="number"
              placeholder="Ej: 5000"
              value={ganancia}
              onChange={e => {
                setGanancia(e.target.value);
                setGananciaN(parseFloat(e.target.value) || 0);
              }}
              className="bg-[#141E30] border-[#243048] text-white pl-7"
            />
          </div>
          
          {gananciaN > 0 && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-300 text-sm font-medium">Precio Total al Cliente</span>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-xl">Q{fmt(Math.round((calcData.finalPriceUSD + gananciaN / calcData.exchangeRate) * calcData.exchangeRate))}</span>
                </div>
              </div>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !gananciaN}
                className="w-full mt-4 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold py-5"
              >
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando PDF...</>
                  : <>📄 Generar Cotización PDF</>
                }
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCalculadora() {
  const { user, isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<"lote" | "manual" | "cotizacion">("lote");
  
  // TEMP: Force auth for testing - remove in production
  const isAuth = true; // isAuthenticated;

  // Mientras carga la sesión, mostrar spinner para evitar queries sin auth
  if (loading && !isAuth) {
    return (
      <div className="min-h-screen bg-[#080D18] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
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
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#0F1624] border border-[#1F2D45] rounded-xl p-1">
          <button
            onClick={() => setTab("lote")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === "lote"
                ? "bg-[#F97316] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Hash className="w-4 h-4" /> Por Número de Lote
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === "manual"
                ? "bg-[#F97316] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Manual
          </button>
          <button
            onClick={() => setTab("cotizacion")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === "cotizacion"
                ? "bg-[#F97316] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📄 Cotización Cliente
          </button>
        </div>

        {tab === "lote" ? <TabPorLote isAuth={isAuth} /> : tab === "manual" ? <TabManual /> : <TabClientQuote isAuth={isAuth} />}
      </div>
    </div>
  );
}
