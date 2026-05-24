import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Clock, Phone, Truck, XCircle, AlertCircle, Car, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const STATUS_STEPS = [
  { key: "pending",    label: "Cotización Recibida",  icon: Clock,        color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/30" },
  { key: "contacted",  label: "Asesor Asignado",      icon: Phone,        color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/30" },
  { key: "in_process", label: "En Proceso",           icon: Truck,        color: "text-[#00C8E0]",   bg: "bg-[#00C8E0]/10 border-[#00C8E0]/30" },
  { key: "completed",  label: "Completado",           icon: CheckCircle2, color: "text-green-400",   bg: "bg-green-400/10 border-green-400/30" },
];

const STATUS_ORDER = ["pending", "contacted", "in_process", "completed"];

function getStatusIndex(status: string) {
  return STATUS_ORDER.indexOf(status);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400">
      <XCircle className="w-4 h-4" /> Cancelado
    </span>
  );
  const step = STATUS_STEPS.find(s => s.key === status);
  if (!step) return null;
  const Icon = step.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${step.bg} ${step.color}`}>
      <Icon className="w-4 h-4" /> {step.label}
    </span>
  );
}

export default function Seguimiento() {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.quotes.track.useQuery(
    { trackingCode: searchCode! },
    { enabled: !!searchCode, retry: false }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 3) setSearchCode(trimmed);
  }

  const currentStep = data ? getStatusIndex(data.status) : -1;
  const isCancelled = data?.status === "cancelled";

  return (
    <div className="min-h-screen bg-[#080D18] text-white">
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C8E0]/10 border border-[#00C8E0]/20 text-[#00C8E0] text-sm font-medium mb-4">
              <Search className="w-4 h-4" />
              Seguimiento de Cotización
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              RASTREAR MI <span className="text-[#00C8E0]">COTIZACIÓN</span>
            </h1>
            <p className="text-slate-400">
              Ingresa tu código de seguimiento para ver el estado de tu cotización en tiempo real.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSearch}
            className="flex gap-3 mb-8"
          >
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: RC-1A2B3C"
              className="bg-[#141E30] border-[#243048] text-white placeholder:text-slate-500 text-center text-lg font-mono tracking-widest h-12"
              maxLength={10}
            />
            <Button
              type="submit"
              className="bg-[#00C8E0] text-[#080D18] font-bold h-12 px-6 hover:bg-[#00b0c8] btn-press"
              disabled={isLoading || code.trim().length < 3}
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#080D18] border-t-transparent rounded-full animate-spin" /> Buscando...</span>
              ) : (
                <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Buscar</span>
              )}
            </Button>
          </motion.form>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center"
            >
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-medium">Código no encontrado</p>
              <p className="text-slate-400 text-sm mt-1">
                Verifica que el código sea correcto. Si tienes dudas, contáctanos por WhatsApp.
              </p>
              <a
                href="https://wa.me/50231220803?text=Hola%2C+necesito+ayuda+con+mi+cotizaci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
              </a>
            </motion.div>
          )}

          {/* Result */}
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Vehicle Card */}
              <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-sm font-mono">#{data.trackingCode}</p>
                    <h2 className="text-xl font-bold text-white mt-1">
                      {data.vehicleYear} {data.vehicleMake} {data.vehicleModel}
                    </h2>
                    {data.vehicleTitle && (
                      <p className="text-slate-400 text-sm mt-0.5">{data.vehicleTitle}</p>
                    )}
                  </div>
                  <StatusBadge status={data.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#0F1624] rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">Plataforma</p>
                    <p className="text-white font-medium capitalize">{data.platform}</p>
                  </div>
                  <div className="bg-[#0F1624] rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">Precio Subasta</p>
                    <p className="text-white font-medium">${Number(data.auctionPrice).toLocaleString()}</p>
                  </div>
                  {data.totalUSD && (
                    <div className="bg-[#0F1624] rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-1">Total USD</p>
                      <p className="text-[#00C8E0] font-bold">${Number(data.totalUSD).toLocaleString()}</p>
                    </div>
                  )}
                  {data.totalGTQ && (
                    <div className="bg-[#0F1624] rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-1">Total GTQ</p>
                      <p className="text-[#F97316] font-bold">Q{Number(data.totalGTQ).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-500 flex justify-between">
                  <span>Cotización creada: {new Date(data.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  <span>Actualizado: {new Date(data.updatedAt).toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Progress Steps */}
              {!isCancelled && (
                <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-5">Estado del Proceso</h3>
                  <div className="relative">
                    {/* Progress line */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#243048]" />
                    <div
                      className="absolute left-5 top-5 w-0.5 bg-[#00C8E0] transition-all duration-700"
                      style={{ height: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%` }}
                    />

                    <div className="space-y-6">
                      {STATUS_STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const isDone = i <= currentStep;
                        const isCurrent = i === currentStep;
                        return (
                          <div key={step.key} className="flex items-center gap-4 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                              isDone
                                ? `border-[#00C8E0] bg-[#00C8E0]/20 ${step.color}`
                                : "border-[#243048] bg-[#0F1624] text-slate-600"
                            } ${isCurrent ? "ring-2 ring-[#00C8E0]/30 ring-offset-2 ring-offset-[#141E30]" : ""}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`font-medium ${isDone ? "text-white" : "text-slate-500"}`}>{step.label}</p>
                              {isCurrent && (
                                <p className="text-[#00C8E0] text-xs mt-0.5">Estado actual</p>
                              )}
                            </div>
                            {isCurrent && (
                              <div className="ml-auto">
                                <span className="w-2 h-2 rounded-full bg-[#00C8E0] inline-block animate-pulse" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes from advisor */}
              {data.notes && (
                <div className="bg-[#00C8E0]/5 border border-[#00C8E0]/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-[#00C8E0]" />
                    <p className="text-[#00C8E0] font-medium text-sm">Nota de tu Asesor</p>
                  </div>
                  <p className="text-slate-300 text-sm">{data.notes}</p>
                </div>
              )}

              {/* WhatsApp CTA */}
              <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">¿Tienes preguntas?</p>
                  <p className="text-slate-400 text-sm">Tu asesor está disponible en WhatsApp</p>
                </div>
                <a
                  href={`https://wa.me/50231220803?text=Hola%2C+tengo+una+consulta+sobre+mi+cotizaci%C3%B3n+${data.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-colors btn-press"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </motion.div>
          )}

          {/* Info box when no search yet */}
          {!searchCode && !data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 text-center"
            >
              <Car className="w-12 h-12 text-[#243048] mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Tu código de seguimiento fue enviado después de completar tu cotización.<br />
                Tiene el formato <span className="font-mono text-[#00C8E0]">RC-XXXXXX</span>
              </p>
              <p className="text-slate-500 text-xs mt-3">
                ¿No tienes tu código? Contáctanos por WhatsApp al{" "}
                <a href="https://wa.me/50231220803" className="text-[#00C8E0] hover:underline" target="_blank" rel="noopener noreferrer">
                  +502 3122-0803
                </a>
              </p>
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
