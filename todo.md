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

## Correcciones v3 (AuctionsAPI + Catálogo)
- [x] Quitar mención pública de ganancia mínima del frontend (Home, Cotizador) - solo queda en panel admin
- [x] Corregir búsqueda de texto: usar parámetro `name` para búsqueda libre (Mercedes, BMW, etc.)
- [x] Corregir body_type IDs según documentación real de AuctionsAPI (sedan=1, wagon=2, coupe=3, pickup=4, SUV=5...)
- [x] Quitar límite de 60 marcas en dropdown del catálogo - ahora muestra todas
- [x] Agregar búsqueda de texto dentro del dropdown de marcas
- [x] Actualizar SearchCarsParams con todos los parámetros correctos de la API
- [x] Mapeo correcto: search_query=VIN/lote, name=texto libre (marca/modelo)
- [x] simple_paginate=0 para obtener total de resultados en paginación

## Pendientes de Siguiente Iteración
- [x] Página de seguimiento de pedidos para clientes (/seguimiento) - búsqueda por código RC-XXXXXX, progreso visual, notas del asesor
- [x] Notificaciones al owner implementadas con notifyOwner en cada cotización y contacto (incluye código de tracking)

## Reestructura Calculadora v2
- [x] Quitar página /cotizador como ruta separada (eliminado Cotizador.tsx y ruta)
- [x] Quitar enlace "Cotizador" del Navbar (reemplazado por "Ver Catálogo" → /catalogo)
- [x] Quitar planes de servicio $500 de Home y Servicios
- [x] Integrar calculadora automática dentro de VehicleDetail (cada lote)
- [x] Cálculo no modificable por el cliente (solo lectura, no hay inputs editables)
- [x] Impuestos Guatemala: 32% sobre CIF (unificado)
- [x] Gastos varios: Q5,000 fijos
- [x] Ganancia Ruta Cars oculta (mín Q10,000 calculada por IA, solo se muestra $500 Servicio)
- [x] Actualizar importCalculator.ts con nueva lógica
- [x] Rediseñar catálogo estilo AutoBidMaster con filtros de precio

## Mejoras Catálogo v3
- [x] Filtro ordenamiento por precio Buy Now (mayor a menor / menor a mayor) - barra de sort siempre visible
- [x] Filtro ordenamiento por precio de puja (mayor a menor / menor a mayor)
- [x] Filtro por lugar de subasta (estado USA, ej: TX, FL) - input en panel de filtros avanzados
- [x] Persistir posición del catálogo al volver del detalle - sessionStorage + history.back()
- [x] Excluir vehículos ya vendidos del catálogo - status: 0 en queryInput

## Mejoras Catálogo v4 (Copart/IAAI/AutoBidMaster)
- [x] Mostrar etiqueta "Buy Now" con precio cuando el vehículo tiene buy_now_price
- [x] Mostrar etiqueta "Subasta Actual" con precio de puja cuando NO tiene buy_now_price
- [x] Mostrar ambos precios cuando el vehículo tiene los dos
- [x] Filtro Buy Now: mostrar SOLO vehículos con precio Buy Now disponible
- [x] Implementar todos los filtros de Copart/IAAI: condición, tipo de daño, color, combustible, transmisión, cilindros, tracción, odómetro
- [x] Filtro de fecha de subasta (próximas subastas)
- [x] Verificar disponibilidad de vehículos con API (status=0, exclude_expired=1)
- [x] Mejoras visuales de tarjetas de vehículos (badges, precios destacados)

## Mejoras v5 (Calculadora Dual + UI/UX + Español)
- [x] VehicleDetail: calculadora dual — si solo subasta: 1 calculadora con input de monto a pujar; si solo buy now: 1 calculadora fija con precio buy now; si ambos: 2 calculadoras (buy now resaltada + subasta interactiva con input)
- [x] Calculadora de subasta: input donde el usuario escribe cuánto planea pujar → cotización automática en tiempo real
- [x] Botón "Comprar Ahora" (verde prominente) en tarjetas y detalle cuando hay buy now
- [x] Traducir todos los valores de la API al español: gasoline→Gasolina, diesel→Diésel, automatic→Automático, manual→Manual, run_and_drives→Enciende y Maneja, engine_starts→Motor Enciende, not_run→No Enciende, enhanced→Mejorado, etc.
- [x] Traducir tipos de daño al español: Front End→Daño Frontal, Flood→Inundación, Normal Wear→Desgaste Normal, Vandalism→Vandalismo, Theft Recovery→Recuperado de Robo, Rear End→Daño Trasero, etc.
- [x] Mejorar fuentes: revisar y corregir todas las fuentes que se ven como "sitio en desarrollo"
- [x] Mejorar colores: revisar badges, textos y fondos que se ven mal
- [x] Filtros del catálogo: agregar Run & Drive (condición), Daño primario, Combustible, Transmisión visibles en panel básico
- [x] Cambiar "Buy Now" a "Comprar Ahora" en toda la UI
- [x] Actualización automática del catálogo (refetch cada 5 minutos para precios actualizados)

## Mejoras v6 - Royal Shipping Scraping + Calculadora Precisa

- [x] Scraping profundo de Royal Shipping: precios reales por estado USA, tipo de subasta (Copart/IAAI), tamaño de vehículo (sedan/SUV/pickup/van)
- [x] Crear tabla shipping_rates en DB con columnas: state_code, auction_type, vehicle_size, price_usd, port, notes
- [x] Poblar tabla con todos los precios reales de Royal Shipping (206 ubicaciones, 38 estados)
- [x] Actualizar calculadora VehicleDetail: detección automática de estado + tamaño por tipo de carrocería
- [x] Ganancia de Ruta Cars GT ($500 USD) incluida en línea "Transporte USA" (oculta, no visible al cliente)
- [x] Endpoint tRPC para consultar shipping_rates por estado + tamaño
- [x] Mostrar desglose real: Transporte USA (incluye ganancia), Shipping Marítimo (precio real Royal), fees de subasta reales
- [x] Implementar logo nuevo de Ruta Cars GT en navbar (imagen real del logo)

## Mejoras v7 - Ganancia Oculta Correcta (superado por v9)
- [x] importCalculator: "Gestión Internacional" aparece en desglose y SÍ suma al total (ganancia real)
- [x] importCalculator: ganancia mínima Q10,000 incluida en Gestión Internacional (dinámica)
- [x] VehicleDetail: display del desglose actualizado con nueva lógica
- [x] Home.tsx: ejemplo de cotización actualizado con nueva lógica

## Mejoras v8 - Sistema Completo

- [x] Tabla gt_market_prices en DB: precios de mercado GT por marca/modelo/año
- [x] Poblar gt_market_prices con 171 registros de modelos populares
- [x] importCalculator.ts: ganancia dinámica (precio_mercado_gt × 0.87 - costo_real, mínimo Q10,000)
- [x] Línea "Gestión Internacional Ruta Cars" visible en desglose (cubre ganancia oculta)
- [x] Cuando ganancia < Q10,000 (requiresManualQuote): mostrar botón "Solicitar Cotización" en lugar de precio
- [x] Notificaciones al owner via sistema Manus (Forge API) - mejor que Telegram para este proyecto
- [x] Galería de fotos con lightbox en VehicleDetail (todas las fotos del lote, navegación por teclado)
- [x] Botón "Solicitar Cotización" → WhatsApp con datos del carro pre-cargados
- [x] SEO: meta tags dinámicos por vehículo (title, description, og:image) via hook useSEO
- [x] SEO: Open Graph + Twitter Card en index.html
- [x] SEO: sitemap.xml y robots.txt

## Corrección lógica de desglose v9

- [x] importCalculator: línea "Gestión Internacional" = ganancia real dinámica (SÍ suma al total)
- [x] importCalculator: línea "Servicio Ruta Cars GT $500" = decorativa, NO suma al total
- [x] VehicleDetail/CalcPanel: mostrar ambas líneas correctamente en el desglose
- [x] Home.tsx: actualizar ejemplo de cotización con nueva lógica
- [x] SEO: sitemap.xml y robots.txt

## Calculadora Admin (costo real sin ganancia)

- [x] Endpoint admin.calculateReal: costo real sin Gestión Internacional
- [x] Página AdminCalculadora.tsx: inputs + desglose completo sin ganancia
- [x] Ruta /admin/calculadora y enlace en el panel admin (botón naranja)

## Factura / Cotización PDF Admin

- [x] Página AdminFactura.tsx: buscar por lote, campos editables (nombre, DPI, teléfono, notas), vista previa
- [x] Generación de PDF con diseño Ruta Cars GT (logo, colores, desglose, foto del carro)
- [x] Ruta /admin/factura y botón "Cotización PDF" en panel admin

## Mejoras Cotización PDF v2

- [x] Campo "Precio Acordado" editable en AdminFactura (se muestra en el PDF como precio final al cliente)
- [x] Tabla quote_pdfs en DB: guardar historial de cotizaciones generadas (lote, cliente, precio, fecha)
- [x] Endpoint admin.saveQuotePdf y admin.getQuotePdfs
- [x] Historial de cotizaciones PDF en página /admin/factura (tabla con folio, vehículo, cliente, precio acordado, costo real, fecha)

## Mejoras Catálogo v10

- [x] Fecha de subasta visible en tarjetas del catálogo (naranja, col-span-2)
- [x] Sección recomendados Home: carros Buy Now con precio real (filtro buy_now=1, precio verde)

## Correcciones Calculadora v11

- [x] Fees Autobidmaster ($150 transacción + $50 documentación + $25 transferencia) añadidos al CIF y base imponible del 32%
- [x] Base imponible 32%: precio subasta + fees Copart/IAAI + fees Autobidmaster $225 (sin transporte ni flete)
- [x] Ganancia mínima Q10,000 para todos los vehículos sin precio de mercado GT
- [x] Calculadora interna admin: tab "Por Número de Lote" (carga datos automáticos) + tab "Manual"
- [x] Simulador de ganancia en calculadora admin (campo para ingresar ganancia y ver precio al cliente)
- [x] Endpoint admin.getLotForCalc: busca lote en AuctionsAPI y retorna datos para calculadora

## Catalog Data Staleness Issues (v12)

- [ ] Fix: Catalog showing expired auctions (2019 Dodge Charger from 3 months ago)
- [ ] Fix: Implement cache invalidation for expired auctions
- [ ] Fix: Ensure API returns only active/current auctions with exclude_expired_auctions=1
- [ ] Feature: Implement periodic data refresh mechanism (hourly/daily)
- [ ] Feature: Create vehicle search tool with budget calculator
- [ ] Feature: Filter vehicles by viability (price ≤ 40,000 GTQ with 5,000-6,000 profit margin)
- [ ] Test: Verify catalog updates with fresh data
- [ ] Test: Verify vehicle search returns viable candidates

## Client Quote Feature (Cotización Cliente) (v13)

- [ ] Create admin UI: "Cotización Cliente" section in AdminCalculadora
- [ ] Input fields: Lot number + Desired profit margin (GTQ)
- [ ] Fetch lot details from API (photos, vehicle info, VIN, odómetro, location, damage, condition)
- [ ] Calculate total price in GTQ using calculator logic
- [ ] Generate PDF with: vehicle photos, details, and total price (no cost breakdown)
- [ ] PDF download functionality
- [ ] Test with multiple vehicles
