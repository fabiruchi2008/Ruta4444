import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Car, ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/servicios", label: "Servicios" },
  { href: "/seguimiento", label: "Seguimiento" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080D18]/95 backdrop-blur-md border-b border-[#243048]/60 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#00C8E0] to-[#0099ad] flex items-center justify-center glow-cyan group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-[#080D18]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl text-white tracking-wider">RUTA CARS</span>
              <span className="text-[10px] text-[#00C8E0] font-semibold tracking-[0.2em] uppercase">Guatemala</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location === link.href
                    ? "text-[#00C8E0] bg-[#00C8E0]/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-[#243048] text-slate-300 hover:text-white hover:border-[#00C8E0]/50">
                  Admin
                </Button>
              </Link>
            )}
            <a
              href="https://wa.me/50231220803?text=Hola,%20me%20interesa%20importar%20un%20vehículo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-semibold btn-press glow-cyan"
              >
                Cotizar Ahora
              </Button>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden border-t border-[#243048]/60 bg-[#080D18]/98 backdrop-blur-md overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location === link.href
                      ? "text-[#00C8E0] bg-[#00C8E0]/10"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user?.role === "admin" && (
                <Link href="/admin" className="px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5">
                  Panel Admin
                </Link>
              )}
              <div className="pt-2 border-t border-[#243048]/40 mt-2">
                <a
                  href="https://wa.me/50231220803?text=Hola,%20me%20interesa%20importar%20un%20vehículo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-[#00C8E0] hover:bg-[#0099ad] text-[#080D18] font-semibold">
                    Cotizar Ahora
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
