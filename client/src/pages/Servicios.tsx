import { motion } from "framer-motion";
import { CheckCircle, Clock, FileText, Ship, Car, Wrench, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const steps = [
  { icon: Car, color: "#00C8E0", num: "01", title: "Búsqueda y Selección", desc: "Accede a nuestro catálogo en tiempo real de Copart e IAAI. Filtra por marca, modelo, año, precio y condición. Te asesoramos en la selección del vehículo ideal.", time: "1-2 días" },
  { icon: FileText, color: "#F97316", num: "02", title: "Cotización y Aprobación", desc: "Calcula el costo total de importación con nuestra herramienta automática. Incluye fees, transporte, shipping, aranceles e IVA. Sin sorpresas.", time: "Inmediato" },
  { icon: CheckCircle, color: "#22C55E", num: "03", title: "Compra en Subasta", desc: "Realizamos la puja en tu nombre a través de AutoBid Master. Confirmamos la compra y gestionamos el pago de la subasta.", time: "1-3 días" },
  { icon: Ship, color: "#A855F7", num: "04", title: "Transporte y Shipping", desc: "Coordinamos el transporte interno en USA hasta el puerto de embarque y el envío marítimo a Puerto Quetzal, Guatemala.", time: "15-25 días" },
  { icon: Wrench, color: "#F97316", num: "05", title: "Trámites Aduanales", desc: "Gestionamos todos los documentos de importación, pago de aranceles e IVA ante la SAT. Proceso 100% legal y transparente.", time: "5-7 días" },
  { icon: Car, color: "#00C8E0", num: "06", title: "Entrega en Guatemala", desc: "Recibes tu vehículo en Guatemala con toda la documentación en regla. Listo para plaquear y circular.", time: "1-2 días" },
];

const packages = [
  {
    name: "Básico",
    price: "$500",
    color: "#00C8E0",
    features: ["Búsqueda en catálogo", "Cotización automática", "Compra en subasta", "Transporte a puerto", "Shipping marítimo", "Trámites aduanales básicos"],
    notIncluded: ["Reparación del vehículo", "Entrega a domicilio"],
  },
  {
    name: "Premium",
    price: "Consultar",
    color: "#F97316",
    popular: true,
    features: ["Todo lo del plan Básico", "Análisis de mercado IA", "Asesoría personalizada", "Seguimiento en tiempo real", "Entrega a domicilio GT", "Soporte post-entrega 30 días"],
    notIncluded: [],
  },
];

export default function Servicios() {
  return (
    <div className="min-h-screen bg-[#080D18] pt-20">
      {/* Header */}
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-12">
        <div className="container text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#00C8E0] text-sm font-semibold uppercase tracking-widest mb-3">
            Nuestros Servicios
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl md:text-6xl text-white mb-4">
            PROCESO DE <span className="text-[#00C8E0]">IMPORTACIÓN</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-400 text-lg max-w-2xl mx-auto">
            Importar un vehículo de USA a Guatemala nunca fue tan fácil. Manejamos todo el proceso por ti.
          </motion.p>
        </div>
      </div>

      {/* Process Steps */}
      <section className="py-20 bg-[#080D18]">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}25` }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <span className="font-display text-4xl leading-none" style={{ color: `${step.color}30` }}>{step.num}</span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5" style={{ color: step.color }} />
                  <span style={{ color: step.color }}>Tiempo estimado: {step.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-[#0F1624]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">PAQUETES DE <span className="text-[#F97316]">SERVICIO</span></h2>
            <p className="text-slate-400">Elige el paquete que mejor se adapte a tus necesidades</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-[#141E30] border rounded-2xl p-6 relative ${pkg.popular ? "border-[#F97316]/40" : "border-[#243048]"}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-display text-2xl text-white">{pkg.name}</h3>
                  <p className="text-3xl font-bold mt-1" style={{ color: pkg.color }}>{pkg.price}</p>
                  {pkg.name === "Básico" && <p className="text-slate-400 text-xs mt-1">Por vehículo importado</p>}
                </div>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />{f}
                    </li>
                  ))}
                  {pkg.notIncluded.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="w-4 h-4 flex-shrink-0 text-center text-slate-600">✕</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="https://wa.me/50231220803?text=Hola,%20me%20interesa%20el%20paquete%20de%20importación" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full btn-press" style={{ backgroundColor: pkg.color, color: "#080D18" }}>
                    Consultar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#080D18]">
        <div className="container text-center">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">¿LISTO PARA <span className="text-[#00C8E0]">IMPORTAR</span>?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Contáctanos por WhatsApp y un asesor te guiará en todo el proceso.</p>
          <a href="https://wa.me/50231220803?text=Hola,%20quiero%20importar%20un%20vehículo%20de%20USA" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#25D366] hover:bg-[#1ea952] text-white font-bold px-10 btn-press">
              <MessageCircle className="w-5 h-5 mr-2" /> Hablar con un Asesor
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
