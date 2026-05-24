# Ruta Cars GT - TODO

## Base de Datos y Backend
- [x] Schema: tablas users, quotes, contacts, settings, featuredVehicles
- [x] Migración y aplicación de SQL
- [x] Helpers de DB en server/db.ts
- [x] Integración AuctionsAPI (server/auctionsApi.ts) - Copart (domain 3) + IAAI (domain 1)
- [x] Fees automáticos Copart/IAAI (tablas reales 2024-2025 para Licensed Buyers via Autobid Master)
- [x] Calculadora de costos de importación completa (server/importCalculator.ts)
- [x] Análisis de mercado guatemalteco con LLM (IA)
- [x] Detección automática de tamaño de vehículo (sedan/SUV/pickup/especial)
- [x] Tarifas RoyalShipping por estado y tamaño de vehículo
- [x] Notificaciones al owner en cada cotización (notifyOwner)
- [x] Panel admin: gestión de cotizaciones, contactos, configuración
- [x] Secreto AUCTIONS_API_KEY configurado
- [x] Corrección de errores TypeScript (0 errores)

## Frontend - Diseño y Tema
- [x] Paleta dark mode: cian #00C8E0, naranja #F97316, verde tropical, fondo oscuro
- [x] Tipografía: Bebas Neue (títulos) + Space Grotesk (cuerpo) via Google Fonts
- [x] index.css con variables CSS del tema, shimmer, btn-press, card-hover
- [x] Animaciones suaves (framer-motion)
- [x] Botón flotante WhatsApp (+502 3122-0803) en todas las páginas
- [x] Navbar responsive con logo y navegación completa
- [x] Footer con información de contacto

## Frontend - Páginas
- [x] Landing page con hero asimétrico, stats, features, how-it-works, CTA
- [x] Catálogo de vehículos con búsqueda y filtros avanzados
- [x] Normalización de datos de AuctionsAPI (nested objects → flat display)
- [x] Página de detalle de vehículo con galería de imágenes
- [x] Cotizador automatizado con desglose completo visible
- [x] Comparativa con precios de mercado Guatemala (IA)
- [x] Página de Servicios (proceso paso a paso)
- [x] Página de contacto con redirección a WhatsApp
- [x] Panel Admin (cotizaciones, contactos, configuración)

## Funcionalidades Específicas
- [x] Búsqueda por VIN o número de lote
- [x] Filtros: año, precio, plataforma (Copart/IAAI)
- [x] Paginación de resultados
- [x] Cotizador con desglose completo: subasta + fees + transporte + shipping + aranceles + IVA + Ruta Cars
- [x] Buy Now / Solicitar cotización → WhatsApp
- [x] Análisis automático de ganancia mínima Q10,000
- [x] Comparativa con precios de mercado Guatemala
- [x] Redirección a WhatsApp después de cotización

## Testing
- [x] Tests de calculadora de costos (21 tests)
- [x] Tests de auth logout (1 test)
- [x] Total: 22 tests pasando

## Mejoras Pendientes
- [x] Integrar settings persistentes en panel admin (guardar tipo de cambio en DB) - useEffect + trpc.settings.update
- [x] Agregar filtro de tipo de carrocería en Catálogo
- [x] Búsqueda inteligente por VIN/lote en Catálogo (detección automática)
- [x] Agregar filtro por marca/modelo con manufacturers de AuctionsAPI (Select dinámico con datos reales)
- [x] Agregar sección de vehículos destacados en Home (grid de 6 vehículos con cotizar directo)
- [x] Notificaciones al owner implementadas en quotes.create y contacts.create
- [x] Panel admin con página de seguimiento de cotizaciones y contactos

## Pendientes de Siguiente Iteración
- [ ] Página de seguimiento de pedidos para clientes (consulta pública por email/teléfono)
- [ ] Notificaciones push en tiempo real al owner (WebSocket o polling)
