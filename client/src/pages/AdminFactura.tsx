import { useState, useRef } from "react";
import { ArrowLeft, Search, Download, Loader2, AlertTriangle, FileText, User, Car, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import jsPDF from "jspdf";

const LOGO_URL = "/manus-storage/ruta-cars-logo-v2_407315c0.png";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Por confirmar";
  try {
    return new Date(dateStr).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function fmtUSD(n: number | null | undefined): string {
  if (!n) return "$0";
  return `$${n.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtGTQ(n: number | null | undefined): string {
  if (!n) return "Q0";
  return `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const CONDITION_ES: Record<number, string> = {
  0: "Enciende y Avanza", 1: "Enciende y Avanza", 2: "Motor Enciende",
  3: "No Enciende", 4: "Mejorado", 5: "Nuevo", 6: "Motor Enciende",
};

const DAMAGE_ES: Record<string, string> = {
  "Front End": "Daño Frontal", "Rear End": "Daño Trasero", "Side": "Daño Lateral",
  "Flood": "Inundación", "Fire": "Incendio", "Hail": "Granizo",
  "Normal Wear": "Desgaste Normal", "Vandalism": "Vandalismo",
  "Theft Recovery": "Recuperado de Robo", "Mechanical": "Falla Mecánica",
  "Rollover": "Volcadura", "All Over": "Daño General",
};

export default function AdminFactura() {
  const { user, isAuthenticated } = useAuth();
  const [lotInput, setLotInput] = useState("");
  const [searchLot, setSearchLot] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientDPI, setClientDPI] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agreedPriceUSD, setAgreedPriceUSD] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const facturaRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: vehicle, isLoading, error } = trpc.vehicleDetail.getById.useQuery(
    { id: searchLot },
    { enabled: !!searchLot, staleTime: 5 * 60 * 1000 }
  );

  const lot = vehicle?.lots?.[0];
  const auctionPrice = lot?.buy_now ?? lot?.bid ?? lot?.final_bid ?? 0;
  const platform = lot?.domain?.slug?.includes("iaai") ? "iaai" : "copart";
  const stateCode = lot?.location?.state?.code ?? "TX";
  const bodyType = vehicle?.body_type?.name?.toLowerCase() ?? "sedan";

  const { data: calcData } = trpc.admin.calculateReal.useQuery(
    { auctionPrice, platform, stateCode, bodyType },
    { enabled: !!vehicle && auctionPrice > 0, staleTime: 0 }
  );

  const saveQuotePdf = trpc.admin.saveQuotePdf.useMutation({
    onSuccess: () => {
      setSavedOk(true);
      utils.admin.getQuotePdfs.invalidate();
      setTimeout(() => setSavedOk(false), 3000);
    },
  });

  const { data: historial } = trpc.admin.getQuotePdfs.useQuery(undefined, { staleTime: 30000 });

  const agreedUSD = agreedPriceUSD ? parseFloat(agreedPriceUSD) : null;
  const exchangeRate = 7.75;
  const agreedGTQ = agreedUSD ? Math.round(agreedUSD * exchangeRate) : null;

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080D18] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[#F97316] mx-auto mb-4" />
          <p className="text-white text-xl font-bold">Acceso restringido</p>
          <Link href="/admin"><Button className="mt-6 bg-[#00C8E0] text-[#080D18] font-bold">Volver al Admin</Button></Link>
        </div>
      </div>
    );
  }

  async function handleDownloadPDF() {
    if (!vehicle || !calcData || !agreedUSD) return;
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header with logo
      try {
        doc.addImage(LOGO_URL, "PNG", margin, yPos, 15, 15);
      } catch (e) {
        console.warn("Error adding logo", e);
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 200, 224);
      doc.text("COTIZACIÓN", margin + 20, yPos + 5);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Folio: ${folio}`, pageW - margin - 50, yPos + 5);
      doc.text(`Fecha: ${today}`, pageW - margin - 50, yPos + 12);

      yPos += 20;

      // Separator
      doc.setDrawColor(0, 200, 224);
      doc.line(margin, yPos, pageW - margin, yPos);
      yPos += 5;

      // Vehicle image
      if (imageUrl) {
        try {
          doc.addImage(imageUrl, "JPEG", margin, yPos, 60, 45);
          yPos += 50;
        } catch (e) {
          console.warn("Error adding vehicle image", e);
          yPos += 5;
        }
      }

      // Vehicle info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const vehicleDisplayName = vehicle?.name || 'Vehículo';
      doc.text(`${vehicleDisplayName}`, margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`VIN: ${vehicle.vin || "—"}`, margin, yPos);
      yPos += 5;
      doc.text(`Lote: ${lot?.lot || searchLot}`, margin, yPos);
      yPos += 5;
      doc.text(`Plataforma: ${platform.toUpperCase()}`, margin, yPos);
      yPos += 5;
      doc.text(`Condición: ${conditionLabel}`, margin, yPos);
      yPos += 5;
      doc.text(`Daño: ${damageLabel}`, margin, yPos);
      yPos += 8;

      // Client info
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("DATOS DEL CLIENTE", margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      if (clientName) {
        doc.text(`Nombre: ${clientName}`, margin, yPos);
        yPos += 5;
      }
      if (clientDPI) {
        doc.text(`DPI: ${clientDPI}`, margin, yPos);
        yPos += 5;
      }
      if (clientPhone) {
        doc.text(`Teléfono: ${clientPhone}`, margin, yPos);
        yPos += 5;
      }
      yPos += 3;

      // Pricing
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("DETALLES DE PRECIO", margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Costo Real de Importación: ${fmtUSD(calcData.finalPriceUSD)}`, margin, yPos);
      yPos += 5;
      doc.text(`Incluye: placas, trámites aduanales, transporte y entrega en Guatemala`, margin, yPos);
      yPos += 8;

      // Final price box
      doc.setFillColor(0, 200, 224);
      doc.rect(margin, yPos, pageW - margin * 2, 20, "F");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL A PAGAR", margin + 5, yPos + 8);
      doc.setFontSize(16);
      doc.text(`${fmtUSD(agreedUSD)} USD`, margin + 5, yPos + 16);
      doc.setFontSize(10);
      doc.text(`${fmtGTQ(agreedGTQ)}`, pageW - margin - 30, yPos + 16);

      yPos += 25;

      // Notes
      if (notes) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("NOTAS:", margin, yPos);
        yPos += 5;
        const splitNotes = doc.splitTextToSize(notes, pageW - margin * 2);
        doc.text(splitNotes, margin, yPos);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Ruta Cars GT | Importación de Vehículos USA a Guatemala", pageW / 2, pageH - 10, { align: "center" });

      const vehicleName = vehicle?.name ?? "vehiculo";
      const clientSlug = clientName ? `-${clientName.replace(/\s+/g, "_")}` : "";
      const fileName = `RutaCars-Cotizacion-${vehicleName}${clientSlug}.pdf`;

      // Download with blob method
      doc.save(fileName);

      // Save to history
      saveQuotePdf.mutate({
        folio,
        lotNumber: lot?.lot ?? searchLot,
        vehicleName: vehicle?.name ?? "Vehículo",
        vehicleVin: vehicle?.vin ?? null,
        platform,
        stateCode,
        clientName: clientName || null,
        clientDpi: clientDPI || null,
        clientPhone: clientPhone || null,
        agreedPriceUSD: agreedUSD,
        agreedPriceGTQ: agreedGTQ,
        totalCostUSD: calcData?.finalPriceUSD ?? null,
        notes: notes || null,
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setDownloading(false);
    }
  }

  const damageLabel = DAMAGE_ES[lot?.damage?.main?.name ?? ""] ?? lot?.damage?.main?.name ?? "Sin daño mayor";
  const conditionLabel = CONDITION_ES[lot?.condition?.id ?? -1] ?? lot?.condition?.name ?? "Desconocido";
  const imageUrl = lot?.images?.normal?.[0] ?? lot?.images?.small?.[0] ?? null;
  const today = new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" });
  const folio = `RC-${Date.now().toString().slice(-6)}`;

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
          <FileText className="w-5 h-5 text-[#00C8E0]" />
          <h1 className="text-lg font-bold text-white">Generador de Cotizaciones</h1>
          <span className="text-xs bg-[#00C8E0]/20 text-[#00C8E0] border border-[#00C8E0]/30 px-2 py-0.5 rounded font-semibold">SOLO ADMIN</span>
        </div>
      </div>

      <div className="container max-w-5xl py-8 px-4 grid lg:grid-cols-2 gap-8">
        {/* Panel izquierdo: formulario */}
        <div className="space-y-6">
          {/* Búsqueda por lote */}
          <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Car className="w-4 h-4 text-[#00C8E0]" /> Buscar Vehículo</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Número de lote (ej. 12345678)"
                value={lotInput}
                onChange={e => setLotInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearchLot(lotInput.trim())}
                className="bg-[#141E30] border-[#243048] text-white flex-1"
              />
              <Button
                onClick={() => setSearchLot(lotInput.trim())}
                disabled={!lotInput.trim() || isLoading}
                className="bg-[#00C8E0] text-[#080D18] font-bold btn-press shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm">No se encontró el lote. Verificá el número.</p>}
            {vehicle && (
              <div className="flex items-center gap-3 bg-[#141E30] rounded-xl p-3 border border-[#243048]">
                {imageUrl && <img src={imageUrl} alt={vehicle.name} className="w-16 h-12 object-cover rounded-lg shrink-0" crossOrigin="anonymous" />}
                <div>
                  <p className="font-bold text-white text-sm">{vehicle.name}</p>
                  <p className="text-slate-400 text-xs">{lot?.domain?.name} · {lot?.location?.state?.name ?? stateCode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Datos del cliente */}
          <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-[#F97316]" /> Datos del Cliente</h2>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Nombre completo</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Juan Pérez García" className="bg-[#141E30] border-[#243048] text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">DPI</Label>
              <Input value={clientDPI} onChange={e => setClientDPI(e.target.value)} placeholder="1234567890101" className="bg-[#141E30] border-[#243048] text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Teléfono (opcional)</Label>
              <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+502 1234-5678" className="bg-[#141E30] border-[#243048] text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Notas adicionales (opcional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Entrega estimada: 45-60 días" className="bg-[#141E30] border-[#243048] text-white" />
            </div>
          </div>

          {/* Precio acordado */}
          {vehicle && (
            <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-5 space-y-3">
              <h2 className="font-bold text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#00C8E0]" /> Precio Acordado con Cliente</h2>
              <p className="text-slate-400 text-xs">Opcional. Si ya acordaste un precio, ingresálo aquí para que aparezca en el PDF.</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">$</span>
                <Input
                  type="number"
                  value={agreedPriceUSD}
                  onChange={e => setAgreedPriceUSD(e.target.value)}
                  placeholder="Ej: 18500"
                  className="bg-[#141E30] border-[#243048] text-white"
                />
              </div>
              {agreedUSD && (
                <p className="text-[#00C8E0] text-sm font-semibold">= Q{(agreedUSD * 7.75).toLocaleString("es-GT", { maximumFractionDigits: 0 })} GTQ</p>
              )}
            </div>
          )}

          {/* Botón descargar */}
          {vehicle && (
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold text-base py-5 btn-press"
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando PDF...</>
                : <><Download className="w-4 h-4 mr-2" /> Descargar Cotización PDF</>}
            </Button>
          )}
        </div>

        {/* Panel derecho: vista previa de la factura */}
        <div className="overflow-auto">
          {vehicle ? (
            <div ref={facturaRef} style={{ background: "#ffffff", color: "#111827", fontFamily: "Arial, sans-serif", padding: "32px", minWidth: "480px", borderRadius: "8px" }}>
              {/* Header de la factura */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: "3px solid #00C8E0", paddingBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src={LOGO_URL} alt="Ruta Cars GT" style={{ width: "64px", height: "64px", objectFit: "contain" }} crossOrigin="anonymous" />
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: "#080D18", letterSpacing: "1px" }}>RUTA CARS GT</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>Importación de Vehículos USA → Guatemala</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>WhatsApp: +502 3122-0803</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#00C8E0" }}>COTIZACIÓN</div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Folio: <strong style={{ color: "#111827" }}>{folio}</strong></div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>Fecha: <strong style={{ color: "#111827" }}>{today}</strong></div>
                </div>
              </div>

              {/* Datos del cliente */}
              <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "16px", marginBottom: "20px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Datos del Cliente</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Nombre</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>{clientName || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF" }}>DPI</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>{clientDPI || "—"}</div>
                  </div>
                  {clientPhone && (
                    <div>
                      <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Teléfono</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>{clientPhone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info del vehículo */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Vehículo</div>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {imageUrl && (
                    <img src={imageUrl} alt={vehicle.name} crossOrigin="anonymous"
                      style={{ width: "140px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E5E7EB", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#111827", marginBottom: "8px" }}>{vehicle.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {[
                        { label: "Plataforma", value: lot?.domain?.name ?? "—" },
                        { label: "Lote", value: lot?.lot ?? searchLot },
                        { label: "VIN", value: vehicle.vin ?? "—" },
                        { label: "Estado", value: `${lot?.location?.city ?? ""} ${lot?.location?.state?.name ?? stateCode}`.trim() },
                        { label: "Condición", value: conditionLabel },
                        { label: "Daño Principal", value: damageLabel },
                        { label: "Odómetro", value: lot?.odometer?.mi ? `${lot.odometer.mi.toLocaleString()} mi` : "—" },
                        { label: "Fecha de Subasta", value: formatDate(lot?.sale_date) },
                        { label: "Combustible", value: vehicle.fuel?.name ?? "—" },
                        { label: "Transmisión", value: vehicle.transmission?.name ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: "10px", color: "#9CA3AF" }}>{label}</div>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "#111827" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>



              {/* Total a Pagar */}
              {agreedUSD && (
                <div style={{ background: "#ECFDF5", border: "2px solid #10B981", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "8px" }}>Incluye: placas, trámites aduanales, transporte y entrega en Guatemala</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#065F46", textTransform: "uppercase", letterSpacing: "1px" }}>Total a Pagar</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: "#059669" }}>${agreedUSD.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD</div>
                      {agreedGTQ && <div style={{ fontSize: "14px", color: "#10B981", marginTop: "2px" }}>Q{agreedGTQ.toLocaleString("es-GT")} GTQ</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {notes && (
                <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#92400E", marginBottom: "4px" }}>NOTAS</div>
                  <div style={{ fontSize: "12px", color: "#78350F" }}>{notes}</div>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: "2px solid #E5E7EB", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Esta cotización es válida por 7 días hábiles.</div>
                  <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Los precios pueden variar según el tipo de cambio vigente.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#00C8E0" }}>rutacarsgt.com</div>
                  <div style={{ fontSize: "10px", color: "#9CA3AF" }}>+502 3122-0803</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <FileText className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg font-medium">Vista previa de la cotización</p>
              <p className="text-slate-600 text-sm mt-2">Ingresá un número de lote para generar la cotización</p>
            </div>
          )}
        </div>
      </div>

      {/* Historial de cotizaciones */}
      {historial && historial.length > 0 && (
        <div className="container max-w-5xl px-4 pb-12">
          <div className="bg-[#0F1624] border border-[#1F2D45] rounded-2xl p-5">
            <h2 className="font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#00C8E0]" /> Historial de Cotizaciones Generadas
              <span className="text-xs bg-[#243048] text-slate-400 px-2 py-0.5 rounded ml-1">{historial.length}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#243048] text-slate-400 text-xs">
                    <th className="text-left py-2 pr-4">Folio</th>
                    <th className="text-left py-2 pr-4">Vehículo</th>
                    <th className="text-left py-2 pr-4">Cliente</th>
                    <th className="text-left py-2 pr-4">Precio Acordado</th>
                    <th className="text-left py-2 pr-4">Costo Real</th>
                    <th className="text-left py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(q => (
                    <tr key={q.id} className="border-b border-[#1F2D45] hover:bg-[#141E30] transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-[#00C8E0] text-xs">{q.folio}</td>
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold text-white text-xs">{q.vehicleName}</div>
                        <div className="text-slate-500 text-xs">Lote: {q.lotNumber}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="text-white text-xs">{q.clientName || <span className="text-slate-600">Sin nombre</span>}</div>
                        {q.clientDpi && <div className="text-slate-500 text-xs">DPI: {q.clientDpi}</div>}
                      </td>
                      <td className="py-2.5 pr-4">
                        {q.agreedPriceUSD
                          ? <span className="text-green-400 font-bold text-xs">${q.agreedPriceUSD.toLocaleString()}</span>
                          : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        {q.totalCostUSD
                          ? <span className="text-slate-300 text-xs">${q.totalCostUSD.toLocaleString()}</span>
                          : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 text-slate-400 text-xs">
                        {new Date(q.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast guardado */}
      {savedOk && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" /> Cotización guardada en historial
        </div>
      )}
    </div>
  );
}
