/**
 * AuctionsAPI.com helper — proxy para datos en tiempo real de Copart e IAAI
 * Documentación: https://auctionsapi.com/auction-docs
 * Autenticación: header x-api-key
 */

const BASE_URL = "https://auctionsapi.com/api";

function getApiKey(): string {
  const key = process.env.AUCTIONS_API_KEY;
  if (!key) throw new Error("AUCTIONS_API_KEY not configured");
  return key;
}

// ─── Stale-while-revalidate cache ────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  freshUntil: number;
  staleUntil: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCacheEntry<T>(key: string): CacheEntry<T> | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.staleUntil) { cache.delete(key); return null; }
  return entry as CacheEntry<T>;
}

function setCacheEntry<T>(key: string, data: T, freshTtlMs: number): void {
  cache.set(key, {
    data,
    freshUntil: Date.now() + freshTtlMs,
    staleUntil: Date.now() + freshTtlMs * 6, // stale window = 6x fresh TTL
  });
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ─── In-flight deduplication ──────────────────────────────────────────────────
const inFlight = new Map<string, Promise<unknown>>();

// ─── True serial request queue ────────────────────────────────────────────────
// Only ONE request is active at a time. The next request starts only AFTER
// the previous fetch fully completes (response received). Min 2.5s between calls.
const MIN_GAP_MS = 1200;  // 1.2s entre llamadas (era 2.5s)
let lastCallTime = 0;
let queuePromise: Promise<void> = Promise.resolve();

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function enqueueRequest(urlStr: string): Promise<Response> {
  // Chain onto the existing queue promise so requests are truly serial
  const result = queuePromise.then(async (): Promise<Response> => {
    const elapsed = Date.now() - lastCallTime;
    if (elapsed < MIN_GAP_MS) {
      await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
    }
    lastCallTime = Date.now();
    const res = await fetch(urlStr, {
      headers: { "x-api-key": getApiKey(), "accept": "application/json" },
    });
    return res;
  });
  // Update the shared queue tail (suppress unhandled rejection on the chain)
  queuePromise = result.then(() => {}, () => {});
  return result;
}

// ─── Core fetch with cache + dedup + serial queue + retry ────────────────────
async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>, freshTtlMs = 0): Promise<T> {
  const urlStr = buildUrl(path, params);

  // 1. Fresh cache hit → return immediately, no API call
  if (freshTtlMs > 0) {
    const entry = getCacheEntry<T>(urlStr);
    if (entry && Date.now() < entry.freshUntil) return entry.data;
  }

  // 2. Stale cache hit → return stale immediately AND trigger background refresh
  if (freshTtlMs > 0) {
    const entry = getCacheEntry<T>(urlStr);
    if (entry) {
      // Return stale data right away; refresh in background without blocking
      console.log(`[AuctionsAPI] Returning stale cache, refreshing in background: ${urlStr.slice(0, 80)}`);
      apiFetchBackground(urlStr, freshTtlMs);
      return entry.data;
    }
  }

  // 3. Deduplicate in-flight requests for the same URL
  const existing = inFlight.get(urlStr);
  if (existing) return existing as Promise<T>;

  const promise = (async (): Promise<T> => {
    try {
      // Retry with backoff on 429
      const backoffs = [0, 4000, 10000]; // max 3 attempts
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < backoffs.length; attempt++) {
        if (backoffs[attempt] > 0) {
          console.warn(`[AuctionsAPI] Backoff ${backoffs[attempt]}ms before retry ${attempt + 1}`);
          await new Promise(r => setTimeout(r, backoffs[attempt]));
        }

        const res = await enqueueRequest(urlStr);

        if (res.status === 429) {
          lastError = new Error(`AuctionsAPI error 429: demasiadas solicitudes, intenta de nuevo en unos segundos`);
          console.warn(`[AuctionsAPI] 429 on attempt ${attempt + 1} for: ${urlStr.slice(0, 80)}`);
          continue;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`AuctionsAPI error ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json() as T;
        if (freshTtlMs > 0) setCacheEntry(urlStr, data, freshTtlMs);
        return data;
      }

      throw lastError ?? new Error("AuctionsAPI: máximo de reintentos alcanzado");
    } finally {
      inFlight.delete(urlStr);
    }
  })();

  inFlight.set(urlStr, promise);
  return promise;
}

// Background refresh — fires and forgets, never throws to caller
function apiFetchBackground(urlStr: string, freshTtlMs: number): void {
  // Don't start a background refresh if one is already in flight for this URL
  if (inFlight.has(urlStr)) return;
  const promise = (async () => {
    try {
      const res = await enqueueRequest(urlStr);
      if (res.ok) {
        const data = await res.json();
        setCacheEntry(urlStr, data, freshTtlMs);
        console.log(`[AuctionsAPI] Background refresh done: ${urlStr.slice(0, 80)}`);
      }
    } catch (e) {
      console.warn(`[AuctionsAPI] Background refresh failed: ${e}`);
    } finally {
      inFlight.delete(urlStr);
    }
  })();
  inFlight.set(urlStr, promise);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuctionImage {
  id: number;
  small: string[];
  normal: string[];
  big: string[];
  exterior: string[];
  interior: string[];
  video: string | null;
  video_youtube_id: string | null;
  external_panorama_url: string | null;
  downloaded: string[];
}

export interface AuctionLot {
  id: number;
  lot: string;
  domain: { id: number; name: string; slug: string } | null;
  location: {
    state: { code: string; name: string } | null;
    city: string | null;
    zip: string | null;
  } | null;
  bid: number | null;
  final_bid: number | null;
  /** buy_now is the actual field name returned by AuctionsAPI (a number = Buy Now price, or null) */
  buy_now: number | null;
  /** buy_now_price is an alias some API versions use — keep for compatibility */
  buy_now_price?: number | null;
  condition: { id: number; name: string } | null;
  damage: { main: { id: number; name: string } | null; secondary: { id: number; name: string } | null } | null;
  odometer: { mi: number | null; km: number | null } | null;
  sale_date: string | null;
  images: AuctionImage | null;
  keys: boolean | null;
  highlights: string | null;
  title: { id: number; code: string | null; name: string } | null;
  detailed_title: { id: number; code: string | null; name: string } | null;
}

export interface AuctionVehicle {
  id: number;
  name: string;
  vin: string | null;
  year: number | null;
  manufacturer: { id: number; name: string } | null;
  model: { id: number; name: string } | null;
  body_type: { id: number; name: string } | null;
  fuel: { id: number; name: string } | null;
  transmission: { id: number; name: string } | null;
  drive_wheel: { id: number; name: string } | null;
  color: { id: number; name: string } | null;
  cylinders: number | null;
  engine: string | null;
  lots: AuctionLot[];
}

export interface AuctionListResponse {
  data: AuctionVehicle[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface AuctionManufacturer {
  id: number;
  name: string;
}

export interface AuctionModel {
  id: number;
  name: string;
  manufacturer_id: number;
}

export interface SearchCarsParams {
  page?: number;
  per_page?: number;
  domain_id?: number;
  manufacturer_id?: number;
  model_id?: number;
  generation_id?: number;
  from_year?: number;
  to_year?: number;
  year?: number;
  body_type?: number;
  condition?: number;
  transmission?: number;
  drive_wheel?: number;
  fuel_type?: number;
  color?: number;
  cylinders?: number;
  bid_price_from?: number;
  bid_price_to?: number;
  buy_now_price_from?: number;
  buy_now_price_to?: number;
  buy_now?: number;
  odometer_from_mi?: number;
  odometer_to_mi?: number;
  damage?: string;
  name?: string;
  search_query?: string;
  vin?: string;
  state_code?: string;
  country?: string;
  exclude_expired_auctions?: number;
  without_sale_date?: number;
  sale_date_in_days?: number;
  minutes?: number;
  simple_paginate?: number;
  status?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// ─── TTL constants ────────────────────────────────────────────────────────────
const CACHE_15MIN = 30 * 60 * 1000;  // 30 min (era 15)
const CACHE_1HOUR = 60 * 60 * 1000;

// ─── API functions ─────────────────────────────────────────────────────────────

export async function searchCars(params: SearchCarsParams = {}): Promise<AuctionListResponse> {
  const { search_query, simple_paginate, sort, order, ...rest } = params;
  const p: Record<string, string | number | undefined> = {
    per_page: rest.per_page ?? 24,
    page: rest.page ?? 1,
    vehicle_type: 1,
    simple_paginate: 0,
    ...rest,
  };
  // Pass sort/order to API (AuctionsAPI supports sort param)
  if (sort) p.sort = sort;
  if (order) p.order = order;

  if (search_query && search_query.trim()) {
    const q = search_query.trim();
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(q) || /^\d{6,12}$/.test(q)) {
      // VIN o número de lote: pasar tal cual
      p.search_query = q;
    } else {
      // Búsqueda general: detectar años en el texto (ej. "Silverado 2025", "2020 Toyota Camry")
      // Extraer todos los años de 4 dígitos entre 1980 y 2030
      const yearMatches = q.match(/\b(19[89]\d|20[0-2]\d|2030)\b/g);
      let cleanName = q;
      let extractedFromYear: number | undefined;
      let extractedToYear: number | undefined;

      if (yearMatches && yearMatches.length > 0) {
        const years = yearMatches.map(Number).sort((a, b) => a - b);
        extractedFromYear = years[0];
        extractedToYear = years[years.length - 1];
        // Quitar los años del texto de búsqueda
        cleanName = q.replace(/\b(19[89]\d|20[0-2]\d|2030)\b/g, "").replace(/\s+/g, " ").trim();
      }

      if (cleanName) p.name = cleanName;

      // Solo aplicar años extraídos si el usuario no ya especificó filtros de año
      if (extractedFromYear && !p.from_year) p.from_year = extractedFromYear;
      if (extractedToYear && !p.to_year) p.to_year = extractedToYear;
    }
  }
  const result = await apiFetch<AuctionListResponse>("/cars", p, CACHE_15MIN);

  // Client-side sort fallback: if sort was requested, sort the returned page
  if (sort && result.data && Array.isArray(result.data)) {
    result.data.sort((a: AuctionVehicle, b: AuctionVehicle) => {
      const aLot = a.lots?.[0];
      const bLot = b.lots?.[0];
      let aVal = 0, bVal = 0;
      if (sort === "buy_now_price") {
        // Use buy_now (real field) or buy_now_price (alias) for sorting
        aVal = aLot?.buy_now ?? aLot?.buy_now_price ?? 0;
        bVal = bLot?.buy_now ?? bLot?.buy_now_price ?? 0;
      } else if (sort === "bid") {
        aVal = aLot?.bid ?? aLot?.final_bid ?? 0;
        bVal = bLot?.bid ?? bLot?.final_bid ?? 0;
      }
      return order === "desc" ? bVal - aVal : aVal - bVal;
    });
  }
  return result;
}

export async function searchByVin(vin: string): Promise<{ data: AuctionVehicle }> {
  return apiFetch<{ data: AuctionVehicle }>(`/search-vin/${encodeURIComponent(vin)}`, undefined, CACHE_15MIN);
}

export async function searchByLot(lot: string, domain?: "copart_com" | "iaai_com"): Promise<{ data: AuctionVehicle }> {
  const path = domain ? `/search-lot/${lot}/${domain}` : `/search-lot/${lot}`;
  return apiFetch<{ data: AuctionVehicle }>(path, undefined, CACHE_15MIN);
}

export async function getManufacturers(): Promise<{ data: AuctionManufacturer[] }> {
  return apiFetch<{ data: AuctionManufacturer[] }>("/manufacturers/cars", undefined, CACHE_1HOUR);
}

export async function getModels(manufacturerId: number): Promise<{ data: AuctionModel[] }> {
  return apiFetch<{ data: AuctionModel[] }>(`/models/${manufacturerId}/cars`, undefined, CACHE_1HOUR);
}

export async function getDamages(): Promise<{ data: Array<{ id: number; name: string }> }> {
  return apiFetch<{ data: Array<{ id: number; name: string }> }>("/usa/damages", undefined, CACHE_1HOUR);
}

// ─── Helper to get the primary image of a vehicle ─────────────────────────────

export function getPrimaryImage(vehicle: AuctionVehicle): string | null {
  for (const lot of vehicle.lots) {
    const imgs = lot.images;
    // Prefer downloaded (direct .webp URLs), then small, then normal
    if (imgs?.downloaded?.length) return imgs.downloaded[0];
    if (imgs?.small?.length) return imgs.small[0];
    if (imgs?.normal?.length) return imgs.normal[0];
  }
  return null;
}

export function getPrimaryLot(vehicle: AuctionVehicle): AuctionLot | null {
  return vehicle.lots[0] ?? null;
}

export function getCurrentBid(vehicle: AuctionVehicle): number | null {
  const lot = getPrimaryLot(vehicle);
  return lot?.bid ?? lot?.final_bid ?? null;
}

export function getDomainLabel(domainId: number): string {
  if (domainId === 3) return "Copart";
  if (domainId === 1) return "IAAI";
  return "Subasta";
}
