import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  structuredData?: object;
}

const BASE_URL = "https://rutacarsgt.com";
const DEFAULT_IMAGE = `${BASE_URL}/manus-storage/ruta-cars-logo-v2_407315c0.png`;
const SITE_NAME = "Ruta Cars GT";

export default function SEOHead({
  title,
  description,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Importación de Vehículos USA a Guatemala`;
  const fullDescription = description || "Importa tu vehículo de subastas americanas Copart e IAAI a Guatemala. Cotización automática, calculadora de costos y asesoría personalizada.";
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set meta
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const attr = selector.startsWith("[name") ? "name" : "property";
        const val = selector.match(/["']([^"']+)["']/)?.[1] || "";
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta('[name="description"]', fullDescription);
    setMeta('[property="og:title"]', fullTitle);
    setMeta('[property="og:description"]', fullDescription);
    setMeta('[property="og:image"]', image);
    setMeta('[property="og:url"]', fullUrl);
    setMeta('[property="og:type"]', type);
    setMeta('[name="twitter:title"]', fullTitle);
    setMeta('[name="twitter:description"]', fullDescription);
    setMeta('[name="twitter:image"]', image);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    // Structured data
    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo="dynamic"]');
      if (existingScript) existingScript.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "dynamic");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      // Reset to defaults on unmount
      document.title = `${SITE_NAME} - Importación de Vehículos USA a Guatemala`;
    };
  }, [fullTitle, fullDescription, image, fullUrl, type, structuredData]);

  return null;
}
