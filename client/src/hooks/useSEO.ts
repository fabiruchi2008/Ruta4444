/**
 * useSEO — Hook para actualizar dinámicamente el título y meta tags de la página.
 * Usado en páginas de detalle de vehículo para SEO dinámico.
 */
import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT_TITLE = "Ruta Cars GT - Importación de Vehículos USA a Guatemala";
const DEFAULT_DESC = "Importa tu vehículo de subastas americanas a Guatemala. Cotización automática, calculadora de costos y asesoría personalizada.";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({ title, description, image, url }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Ruta Cars GT` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;

    document.title = fullTitle;
    setMeta("description", desc);

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    if (image) setMeta("og:image", image, true);
    if (url) setMeta("og:url", url, true);

    // Twitter Card
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    if (image) setMeta("twitter:image", image);

    // Restaurar al desmontar
    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESC);
      setMeta("og:title", DEFAULT_TITLE, true);
      setMeta("og:description", DEFAULT_DESC, true);
    };
  }, [title, description, image, url]);
}
