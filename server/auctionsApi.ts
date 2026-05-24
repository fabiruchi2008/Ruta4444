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
// Entries have two TTLs:
//   freshUntil  → serve directly, no API call
//   staleUntil  → serve stale data immediately AND trigger background refresh
// On 429, we always return stale data if available instead of throwing.
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
    staleUntil: Date.now() + freshTtlMs * 4, // stale window = 4x fresh TTL
  });
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ─── In-flight deduplication ──────────────────────────────────────────────────
// If two requests for the same URL arrive simultaneously, only one hits the API.
const inFlight = new Map<string, Promise<unknown>>();

// ─── Serialized request queue (1 request at a time, 1.2s apart) ──────────────
let lastCallTime = 0;
type QueueTask = () => void;
const queue: QueueTask[] = [];
let queueRunning = false;

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function executeNext(): Promise<void> {
  const task = queue.shift();
  if (!task) { queueRunning = false; return; }
  const elapsed = Date.now() - lastCallTime;
  const MIN_GAP = 1200; // 1.2 seconds between requests
  if (elapsed < MIN_GAP) await new Promise(r => setTimeout(r, MIN_GAP - elapsed));
  lastCallTime = Date.now();
  task();
}

function enqueueRequest(urlStr: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const res = await fetch(urlStr, {
          headers: { "x-api-key": getApiKey(), "accept": "application/json" },
        });
        resolve(res);
      } catch (e) {
        reject(e);
      } finally {
        executeNext();
      }
    };
    queue.push(task);
    if (!queueRunning) {
      queueRunning = true;
      executeNext();
    }
  });
}

// ─── Core fetch with cache + dedup + queue + retry ───────────────────────────
async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>, freshTtlMs = 0): Promise<T> {
  const urlStr = buildUrl(path, params);

  // 1. Fresh cache hit → return immediately
  if (freshTtlMs > 0) {
    const entry = getCacheEntry<T>(urlStr);
    if (entry && Date.now() < entry.freshUntil) return entry.data;
  }

  // 2. Deduplicate in-flight requests for the same URL
  const existing = inFlight.get(urlStr);
  if (existing) return existing as Promise<T>;

  const promise = (async (): Promise<T> => {
    try {
      // 3. Try fetching with queue + retry on 429
      let staleData: T | null = null;
      if (freshTtlMs > 0) {
        const entry = getCacheEntry<T>(urlStr);
        if (entry) staleData = entry.data;
      }

      const delays = [0, 2000, 5000, 10000];
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));

        const res = await enqueueRequest(urlStr);

        if (res.status === 429) {
          lastError = new Error(`AuctionsAPI error 429: demasiadas solicitudes, intenta de nuevo en unos segundos`);
          // If we have stale data, return it immediately instead of retrying forever
          if (staleData !== null) {
            console.warn(`[AuctionsAPI] 429 on attempt ${attempt + 1}, returning stale cache for: ${urlStr}`);
            return staleData;
          }
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

      // All retries exhausted — return stale if available, else throw
      if (staleData !== null) {
        console.warn(`[AuctionsAPI] All retries exhausted, returning stale cache for: ${urlStr}`);
        return staleData;
      }
      throw lastError ?? new Error("AuctionsAPI: máximo de reintentos alcanzado");
    } finally {
      inFlight.delete(urlStr);
    }
  })();

  inFlight.set(urlStr, promise);
  return promise;
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
  buy_now_price: number | null;
  condition: { id: number; name: string } | null;
  damage: { main: { id: number; name: string } | null; secondary: { id: number; name: string } | null } | null;
  odometer: { mi: number | null; km: number | null } | null;
  sale_date: string | null;
  images: AuctionImage | null;
  keys: boolean | null;
  highlights: string | null;
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
}

// ─── TTL constants ────────────────────────────────────────────────────────────
const CACHE_15MIN = 15 * 60 * 1000;
const CACHE_1HOUR = 60 * 60 * 1000;

// ─── API functions ─────────────────────────────────────────────────────────────

export async function searchCars(params: SearchCarsParams = {}): Promise<AuctionListResponse> {
  const { search_query, simple_paginate, ...rest } = params;
  const p: Record<string, string | number | undefined> = {
    per_page: rest.per_page ?? 24,
    page: rest.page ?? 1,
    vehicle_type: 1,
    simple_paginate: 0,
    ...rest,
  };
  if (search_query && search_query.trim()) {
    const q = search_query.trim();
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(q) || /^\d{6,12}$/.test(q)) {
      p.search_query = q;
    } else {
      p.name = q;
    }
  }
  return apiFetch<AuctionListResponse>("/cars", p, CACHE_15MIN);
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
    if (imgs?.normal?.length) return imgs.normal[0];
    if (imgs?.small?.length) return imgs.small[0];
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
