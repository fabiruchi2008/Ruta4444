import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Car, Calculator, TrendingUp, Shield, Clock, CheckCircle, ChevronRight, Zap, Gauge, Fuel, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const stats = [
  { value: "500+", label: "Vehículos Importados" },
  { value: "24h", label: "Respuesta en 24 Horas" },
  { value: "100%", label: "Transparencia en Costos" },
  { value: "15 días", label: "Tiempo Promedio de Entrega" },
];

const features = [
  { icon: Car, color: "#00C8E0", title: "Catálogo en Tiempo Real", desc: "Accede a miles de vehículos de Copart e IAAI actualizados al instante. Filtra por marca, precio, condición y más." },
  { icon: Calculator, color: "#F97316", title: "Calculadora Integrada", desc: "Cada vehículo incluye el costo total de importación calculado automáticamente: fees, transporte, impuestos y más." },
  { icon: TrendingUp, color: "#22C55E", title: "Análisis de Mercado GT", desc: "Comparamos precios del mercado guatemalteco para que veas el valor real del vehículo antes de importar." },
  { icon: Shield, color: "#A855F7", title: "Proceso Seguro", desc: "Manejamos todos los trámites aduanales, documentación y transporte desde USA hasta Guatemala." },
];

const steps = [
  { num: "01", title: "Elige tu Vehículo", desc: "Navega nuestro catálogo de Copart e IAAI y encuentra el auto perfecto." },
  { num: "02", title: "Ve el Costo Total", desc: "Cada vehículo muestra automáticamente el costo total puesto en Guatemala. Sin sorpresas." },
  { num: "03", title: "Confirma con Nosotros", desc: "Habla con un asesor por WhatsApp para confirmar tu compra." },
  { num: "04", title: "Recibe tu Vehículo", desc: "Nosotros manejamos todo. Tú recibes tu vehículo en Guatemala." },
];

function normalizeVehicle(v: any) {
  const lot = v.lots?.[0] || {};
  const domainId = lot.domain?.id ?? v.domain_id;
  const images = lot.images?.normal || lot.images?.small || [];
  return {
    id: v.id,
    year: v.year,
    make: v.manufacturer?.name ?? v.make ?? "",
    model: v.model?.name ?? v.model ?? "",
    bidPrice: lot.bid ?? lot.final_bid ?? v.bid_price ?? 0,
    buyNowPrice: (lot.buy_now != null && lot.buy_now > 0 ? lot.buy_now : null) ?? lot.buy_now_price ?? v.buy_now_price ?? null,
    image: images[0] || v.image_url || null,
    platform: domainId === 3 ? "Copart" : "IAAI",
    platformColor: domainId === 3 ? "#00C8E0" : "#F97316",
    state: lot.location?.state?.code ?? v.state_code ?? "FL",
    odometer: lot.odometer?.mi ?? v.odometer ?? null,
    damage: lot.damage?.main?.name ?? v.damage_type ?? null,
    body: v.body_type?.name ?? v.body_type ?? null,
    lot: lot.lot ?? v.lot_number ?? v.id,
  };
}

export default function Home() {
  // Delay featured vehicles load by 2s to avoid competing with other queries on mount
  const [featuredEnabled, setFeaturedEnabled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFeaturedEnabled(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const featuredInput = useMemo(() => ({ per_page: 8, exclude_expired_auctions: 1, bid_price_to: 15000 }), []);
  const { data: featuredData } = trpc.vehicles.search.useQuery(featuredInput, { enabled: featuredEnabled });
  const featuredVehicles = (featuredData as any)?.data?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-[#080D18]">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#00C8E0]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#F97316]/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(0,200,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.5) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        </div>
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C8E0]/10 border border-[#00C8E0]/20 text-[#00C8E0] text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#00C8E0] animate-pulse" />
                  Copart & IAAI en Tiempo Real
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display text-6xl md:text-7xl lg:text-8xl text-white leading-none">
                IMPORTA TU{" "}<span className="text-[#00C8E0]" style={{textShadow:"0 0 20px rgba(0,200,224,0.6)"}}>VEHÍCULO</span>
                <br />IDEAL DE{" "}<span className="text-[#F97316]">USA</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-slate-400 text-lg leading-relaxed max-w-lg">
                Accede a miles de vehículos de subastas americanas con cotización automática, análisis de mercado guatemalteco y desglose completo de todos los costos de importación.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Link href="/catalogo">
                  <Button size="lg" className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold px-8 btn-press" style={{boxShadow:"0 0 20px rgba(0,200,224,0.3)"}}>
                    Ver Catálogo <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/servicios">
                  <Button size="lg" variant="outline" className="border-[#243048] text-white hover:bg-[#141E30] hover:border-[#00C8E0]/50 px-8 btn-press">
                    <Shield className="w-5 h-5 mr-2" /> Cómo Funciona
                  </Button>
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
                {["Copart Oficial", "IAAI Verificado", "Trámites Incluidos"].map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-[#22C55E]" /><span>{badge}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }} className="hidden lg:block">
              <div className="relative">
                <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Ejemplo de Importación</span>
                    <span className="px-2 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium">✓ Buena Inversión</span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-white">2021 Toyota RAV4</h3>
                    <p className="text-slate-400 text-sm">Copart — Texas — SUV</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Precio Subasta", value: "$8,500", color: "text-white" },
                      { label: "Fees Copart", value: "$699", color: "text-slate-300" },
                      { label: "Transporte USA", value: "$750", color: "text-slate-300" },
                      { label: "Shipping Marítimo", value: "$2,800", color: "text-slate-300" },
                      { label: "Impuestos Guatemala (32%)", value: "$3,808", color: "text-slate-300" },
                      { label: "Gastos Varios", value: "$645", color: "text-slate-300" },
                      { label: "Servicio Ruta Cars", value: "$500", color: "text-[#F97316]" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-[#243048]/50 last:border-0">
                        <span className="text-slate-400 text-sm">{item.label}</span>
                        <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#243048]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-semibold">Total Importación</span>
                      <span className="text-[#00C8E0] font-bold text-xl">$16,489 USD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">En Quetzales</span>
                      <span className="text-slate-300 font-medium">Q127,790 GTQ</span>
                    </div>
                  </div>
                  <div className="bg-[#00C8E0]/10 border border-[#00C8E0]/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[#00C8E0] flex-shrink-0" />
                      <div>
                        <p className="text-[#00C8E0] font-semibold text-sm">Precio Final Puesto en Guatemala</p>
                        <p className="text-white font-bold text-lg">Todo incluido · Sin sorpresas</p>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-4 -right-4 bg-[#F97316] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
                  ¡Buy Now Disponible!
                </motion.div>
                <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 bg-[#141E30] border border-[#243048] text-white text-xs font-medium px-3 py-2 rounded-xl shadow-lg">
                  <span className="text-[#00C8E0]">✓</span> Análisis IA incluido
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-[#0F1624] border-y border-[#243048]/40">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="font-display text-4xl md:text-5xl text-[#00C8E0] mb-1">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[#080D18]">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-[#00C8E0] text-sm font-semibold uppercase tracking-widest mb-3">Por qué elegirnos</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-5xl md:text-6xl text-white mb-4">
              LA PLATAFORMA MÁS <span className="text-[#F97316]">COMPLETA</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-2xl mx-auto">
              Somos la única plataforma en Guatemala que combina catálogo en tiempo real, cotización automática y análisis de mercado local.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 card-hover group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${feat.color}15`, border: `1px solid ${feat.color}25` }}>
                  <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-lg">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#0F1624]">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-[#F97316] text-sm font-semibold uppercase tracking-widest mb-3">Proceso Simple</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-5xl md:text-6xl text-white mb-4">
              ¿CÓMO <span className="text-[#00C8E0]">FUNCIONA</span>?
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative">
                <div className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 h-full">
                  <div className="font-display text-5xl text-[#00C8E0]/20 mb-4 leading-none">{step.num}</div>
                  <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 z-10"><ChevronRight className="w-6 h-6 text-[#243048]" /></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED VEHICLES */}
      {featuredVehicles.length > 0 && (
        <section className="py-24 bg-[#080D18]">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <motion.p variants={fadeUp} className="text-[#00C8E0] text-sm font-semibold uppercase tracking-widest mb-3">En Subasta Ahora</motion.p>
                <motion.h2 variants={fadeUp} className="font-display text-5xl md:text-6xl text-white">
                  VEHÍCULOS <span className="text-[#F97316]">DESTACADOS</span>
                </motion.h2>
              </div>
              <motion.div variants={fadeUp}>
                <Link href="/catalogo">
                  <Button variant="outline" className="border-[#243048] text-slate-300 hover:text-white mt-4 md:mt-0">
                    Ver Catálogo Completo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((raw: any, i: number) => {
                const v = normalizeVehicle(raw);
                return (
                  <motion.div key={v.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="bg-[#141E30] border border-[#243048] rounded-2xl overflow-hidden group hover:border-[#00C8E0]/30 transition-colors">
                    <div className="relative aspect-video bg-[#0F1624] overflow-hidden">
                      {v.image ? (
                        <img src={v.image} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Car className="w-12 h-12 text-[#243048]" /></div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2 py-1 rounded text-xs font-bold text-[#080D18]" style={{ backgroundColor: v.platformColor }}>{v.platform}</span>
                        {v.buyNowPrice && <span className="px-2 py-1 rounded text-xs font-bold bg-[#F97316] text-white">Buy Now</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-lg leading-tight mb-1">{v.year} {v.make} {v.model}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        {v.odometer && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{v.odometer.toLocaleString()} mi</span>}
                        {v.state && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.state}</span>}
                        {v.damage && <span className="text-yellow-500/80">{v.damage}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-xs">Precio subasta</p>
                          <p className="text-[#00C8E0] font-bold text-xl">${v.bidPrice.toLocaleString()}</p>
                        </div>
                        <Link href={`/vehiculo/${v.lot || v.id}`}>
                          <Button size="sm" className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold text-xs btn-press">
                            <Calculator className="w-3 h-3 mr-1" /> Ver Costos
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 bg-[#080D18] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00C8E0]/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> Costos de importación calculados automáticamente
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white mb-6">
              EMPIEZA A <span className="text-[#00C8E0]">IMPORTAR</span><br />HOY MISMO
            </h2>
            <p className="text-slate-400 text-lg mb-8">Únete a guatemaltecos que ya importan sus vehículos con Ruta Cars GT. Transparencia total en costos, proceso simple y seguro.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalogo">
                <Button size="lg" className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold px-10 py-6 text-lg btn-press" style={{boxShadow:"0 0 20px rgba(0,200,224,0.3)"}}>
                  Explorar Catálogo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="https://wa.me/50231220803?text=Hola,%20quiero%20importar%20un%20vehículo" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-[#243048] text-white hover:bg-[#141E30] hover:border-[#25D366]/50 px-10 py-6 text-lg btn-press">
                  <svg className="w-5 h-5 mr-2 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
