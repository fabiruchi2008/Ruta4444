import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Contacto() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("¡Mensaje enviado! Te contactaremos pronto.");
      const waMsg = encodeURIComponent(`Hola Ruta Cars GT! Me llamo ${form.name} y acabo de enviar un mensaje desde su web. ${form.message}`);
      window.open(`https://wa.me/50231220803?text=${waMsg}`, "_blank");
      setForm({ name: "", phone: "", email: "", message: "" });
    },
    onError: () => toast.error("Error al enviar. Intenta de nuevo."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Nombre y teléfono son requeridos");
    createContact.mutate({ name: form.name, phone: form.phone, email: form.email || undefined, message: form.message || undefined });
  }

  return (
    <>
    <SEOHead
      title="Contacto - Importa tu Vehículo"
      description="Contáctanos para importar tu vehículo de subastas americanas a Guatemala. Asesoría personalizada por WhatsApp, teléfono o formulario."
      url="/contacto"
    />
    <div className="min-h-screen bg-[#080D18] pt-20">
      <div className="bg-[#0F1624] border-b border-[#243048]/40 py-12">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4">CONTÁCTANOS</h1>
          <p className="text-slate-400 text-lg">Estamos listos para ayudarte a importar tu vehículo ideal</p>
        </div>
      </div>

      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-3xl text-white mb-2">HABLEMOS</h2>
              <p className="text-slate-400">Nuestro equipo está disponible para responder todas tus preguntas sobre importación de vehículos.</p>
            </div>

            {[
              { icon: Phone, color: "#25D366", label: "WhatsApp", value: "+502 3122-0803", href: "https://wa.me/50231220803" },
              { icon: Mail, color: "#00C8E0", label: "Email", value: "info@rutacarsgt.com", href: "mailto:info@rutacarsgt.com" },
              { icon: MapPin, color: "#F97316", label: "Ubicación", value: "5ta Calle 1-44 Zona 9, Guatemala", href: null },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 bg-[#141E30] border border-[#243048] rounded-xl card-hover"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-[#00C8E0] transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white font-medium">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}

            <div className="p-6 bg-[#141E30] border border-[#243048] rounded-xl">
              <h3 className="font-semibold text-white mb-3">Horario de Atención</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Lunes - Viernes</span><span className="text-white">8:00 AM - 6:00 PM</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Sábado</span><span className="text-white">9:00 AM - 2:00 PM</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Domingo</span><span className="text-slate-500">Cerrado</span></div>
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <form onSubmit={handleSubmit} className="bg-[#141E30] border border-[#243048] rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white text-xl mb-2">Envíanos un Mensaje</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-300 text-sm mb-1.5 block">Nombre completo *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500 focus:border-[#00C8E0]/50" required />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Teléfono / WhatsApp *</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+502 XXXX-XXXX" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" required />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Email (opcional)</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500" />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-300 text-sm mb-1.5 block">Mensaje</Label>
                  <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="¿Qué vehículo te interesa importar? ¿Tienes alguna pregunta?" className="bg-[#0F1624] border-[#243048] text-white placeholder:text-slate-500 min-h-[120px] resize-none" />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-bold btn-press w-full" disabled={createContact.isPending}>
                  {createContact.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar Mensaje
                </Button>
                <a href="https://wa.me/50231220803?text=Hola%20Ruta%20Cars%20GT!" target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 w-full btn-press">
                    <MessageCircle className="w-4 h-4 mr-2" /> O escríbenos por WhatsApp
                  </Button>
                </a>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
