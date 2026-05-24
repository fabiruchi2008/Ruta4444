import { Link } from "wouter";
import { Car, Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#080D18] border-t border-[#243048]/60 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00C8E0] to-[#0099ad] flex items-center justify-center">
                <Car className="w-5 h-5 text-[#080D18]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl text-white tracking-wider">RUTA CARS</span>
                <span className="text-[10px] text-[#00C8E0] font-semibold tracking-[0.2em] uppercase">Guatemala</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Tu puerta de entrada al mercado automotriz americano. Importamos vehículos de Copart e IAAI a Guatemala con total transparencia y seguridad.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/rutacarsgt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#141E30] border border-[#243048] flex items-center justify-center text-slate-400 hover:text-[#00C8E0] hover:border-[#00C8E0]/50 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com/rutacarsgt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#141E30] border border-[#243048] flex items-center justify-center text-slate-400 hover:text-[#00C8E0] hover:border-[#00C8E0]/50 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg text-white mb-4 tracking-wider">NAVEGACIÓN</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Inicio" },
                { href: "/catalogo", label: "Catálogo de Vehículos" },
                { href: "/cotizador", label: "Cotizador" },
                { href: "/servicios", label: "Servicios" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-[#00C8E0] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg text-white mb-4 tracking-wider">SERVICIOS</h4>
            <ul className="space-y-2">
              {[
                "Importación de Copart",
                "Importación de IAAI",
                "Cotización Automatizada",
                "Trámites Aduanales",
                "Transporte a Guatemala",
                "Asesoría de Compra",
              ].map((service) => (
                <li key={service}>
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#00C8E0]" />
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg text-white mb-4 tracking-wider">CONTACTO</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/50231220803"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-400 hover:text-[#00C8E0] transition-colors text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  </div>
                  <span>+502 3122-0803</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@rutacarsgt.com"
                  className="flex items-center gap-3 text-slate-400 hover:text-[#00C8E0] transition-colors text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00C8E0]/10 border border-[#00C8E0]/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#00C8E0]" />
                  </div>
                  <span>info@rutacarsgt.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  </div>
                  <span>Guatemala City, Guatemala</span>
                </div>
              </li>
            </ul>

            <div className="mt-6 p-4 rounded-xl bg-[#141E30] border border-[#243048]">
              <p className="text-xs text-slate-400 mb-1">Horario de atención</p>
              <p className="text-sm text-white font-medium">Lun - Vie: 8:00 AM - 6:00 PM</p>
              <p className="text-sm text-white font-medium">Sáb: 9:00 AM - 2:00 PM</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#243048]/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 Ruta Cars GT. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>Servicio activo — Copart & IAAI en tiempo real</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
