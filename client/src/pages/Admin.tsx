import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Car, FileText, Settings, Users, TrendingUp, DollarSign, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [exchangeRate, setExchangeRate] = useState("7.75");
  const [minProfit, setMinProfit] = useState("10000");
  const [customDutyRate, setCustomDutyRate] = useState("0.20");

  const { data: settingsData } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Sync settings from DB to local state
  useEffect(() => {
    if (settingsData) {
      const s = settingsData as Record<string, string>;
      if (s.exchange_rate) setExchangeRate(s.exchange_rate);
      if (s.min_profit_gtq) setMinProfit(s.min_profit_gtq);
      if (s.custom_duty_rate) setCustomDutyRate(s.custom_duty_rate);
    }
  }, [settingsData]);

  const updateSetting = trpc.settings.update.useMutation({
    onSuccess: () => toast.success("Configuración guardada correctamente"),
    onError: () => toast.error("Error al guardar configuración"),
  });

  async function handleSaveSettings() {
    await Promise.all([
      updateSetting.mutateAsync({ key: "exchange_rate", value: exchangeRate }),
      updateSetting.mutateAsync({ key: "min_profit_gtq", value: minProfit }),
      updateSetting.mutateAsync({ key: "custom_duty_rate", value: customDutyRate }),
    ]);
  }

  const { data: quotes, isLoading: quotesLoading } = trpc.admin.getQuotes.useQuery(undefined, { enabled: isAuthenticated });
  const { data: contacts, isLoading: contactsLoading } = trpc.admin.getContacts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated });

  const updateQuoteStatus = trpc.admin.updateQuoteStatus.useMutation({
    onSuccess: () => toast.success("Estado actualizado"),
    onError: () => toast.error("Error al actualizar"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080D18] pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white mb-4">ACCESO RESTRINGIDO</h2>
          <p className="text-slate-400 mb-6">Debes iniciar sesión como administrador para acceder a este panel.</p>
          <Link href="/"><Button className="bg-[#00C8E0] text-[#080D18] font-bold">Volver al Inicio</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-8">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-white">PANEL <span className="text-[#00C8E0]">ADMIN</span></h1>
            <p className="text-slate-400 mt-1">Bienvenido, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: "Cotizaciones", value: stats?.totalQuotes || 0, color: "#00C8E0" },
              { label: "Contactos", value: stats?.totalContacts || 0, color: "#F97316" },
              { label: "Pendientes", value: stats?.pendingQuotes || 0, color: "#22C55E" },
            ].map(s => (
              <div key={s.label} className="bg-[#141E30] border border-[#243048] rounded-xl px-4 py-3 text-center">
                <p className="font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-slate-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="quotes">
          <TabsList className="bg-[#141E30] border border-[#243048] mb-6">
            <TabsTrigger value="quotes" className="data-[state=active]:bg-[#00C8E0] data-[state=active]:text-[#080D18]">
              <FileText className="w-4 h-4 mr-2" /> Cotizaciones
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#00C8E0] data-[state=active]:text-[#080D18]">
              <Users className="w-4 h-4 mr-2" /> Contactos
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#00C8E0] data-[state=active]:text-[#080D18]">
              <Settings className="w-4 h-4 mr-2" /> Configuración
            </TabsTrigger>
          </TabsList>

          {/* Quotes Tab */}
          <TabsContent value="quotes">
            {quotesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00C8E0] animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {quotes?.length === 0 && <p className="text-slate-400 text-center py-8">No hay cotizaciones aún.</p>}
                {quotes?.map((q: any) => (
                  <div key={q.id} className="bg-[#141E30] border border-[#243048] rounded-xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white">{q.clientName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.status === "pending" ? "bg-[#F97316]/10 text-[#F97316]" : q.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" : q.status === "cancelled" ? "bg-red-500/10 text-red-400" : "bg-[#00C8E0]/10 text-[#00C8E0]"}`}>
                            {q.status === "pending" ? "Pendiente" : q.status === "contacted" ? "Contactado" : q.status === "in_process" ? "En Proceso" : q.status === "completed" ? "Completado" : "Cancelado"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{q.clientPhone} {q.clientEmail && `· ${q.clientEmail}`}</p>
                        {q.vehicleTitle && <p className="text-slate-300 text-sm mt-1">{q.vehicleTitle}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Subasta: <span className="text-[#00C8E0] font-medium">${q.auctionPrice?.toLocaleString()}</span></span>
                          <span>Total: <span className="text-white font-medium">${q.totalUSD?.toFixed(2)}</span></span>
                          <span>GTQ: <span className="text-white font-medium">Q{q.totalGTQ?.toFixed(0)}</span></span>
                          <span className="capitalize">{q.platform}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`https://wa.me/502${q.clientPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${q.clientName}! Soy de Ruta Cars GT. Vi tu cotización de ${q.vehicleTitle || "vehículo"} por $${q.totalUSD?.toFixed(2)}. ¿Quieres proceder?`)}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-[#25D366] hover:bg-[#1ea952] text-white text-xs">WhatsApp</Button>
                        </a>
                        {q.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 text-xs" onClick={() => updateQuoteStatus.mutate({ id: q.id, status: "contacted" })}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Contactar
                            </Button>
                            <Button size="sm" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs" onClick={() => updateQuoteStatus.mutate({ id: q.id, status: "cancelled" })}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            {contactsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00C8E0] animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {contacts?.length === 0 && <p className="text-slate-400 text-center py-8">No hay contactos aún.</p>}
                {contacts?.map((c: any) => (
                  <div key={c.id} className="bg-[#141E30] border border-[#243048] rounded-xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{c.name}</h3>
                        <p className="text-slate-400 text-sm">{c.phone} {c.email && `· ${c.email}`}</p>
                        {c.message && <p className="text-slate-300 text-sm mt-2 italic">"{c.message}"</p>}
                        <p className="text-slate-500 text-xs mt-2">{new Date(c.createdAt).toLocaleDateString("es-GT")}</p>
                      </div>
                      <a href={`https://wa.me/502${c.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${c.name}! Soy de Ruta Cars GT. Vi tu mensaje y quiero ayudarte.`)}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#25D366] hover:bg-[#1ea952] text-white text-xs">WhatsApp</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-white text-lg">Configuración de Cálculos</h3>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Tipo de Cambio (Q por $1 USD)</Label>
                  <Input value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white" type="number" step="0.01" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Ganancia Mínima (Q)</Label>
                  <Input value={minProfit} onChange={e => setMinProfit(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white" type="number" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Arancel de Importación (0.15 = 15%)</Label>
                  <Input value={customDutyRate} onChange={e => setCustomDutyRate(e.target.value)} className="bg-[#0F1624] border-[#243048] text-white" type="number" step="0.01" min="0.10" max="0.30" />
                </div>
                <Button className="bg-[#00C8E0] text-[#080D18] font-bold btn-press w-full" onClick={handleSaveSettings} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar en Base de Datos
                </Button>
              </div>
              <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6">
                <h3 className="font-semibold text-white text-lg mb-4">Información del Negocio</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">WhatsApp</span><span className="text-white">+502 3122-0803</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Servicio Ruta Cars</span><span className="text-[#F97316] font-medium">$500 USD</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Shipping a Guatemala</span><span className="text-white">$2,800 USD</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">IVA Guatemala</span><span className="text-white">12%</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Aranceles</span><span className="text-white">15% - 25%</span></div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
