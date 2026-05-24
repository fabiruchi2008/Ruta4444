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

async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": getApiKey(),
      "accept": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AuctionsAPI error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
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
  domain: { name: string; id: number };
  odometer: { km: number; mi: number; status: { name: string; id: number } | null } | null;
  pre_accident_price: number | null;
  clean_wholesale_price: number | null;
  sale_date: string | null;
  bid: number | null;
  buy_now: number;
  buy_now_price: number | null;
  final_bid: number | null;
  status: { name: string; id: number } | null;
  title: { id: number; code: string | null; name: string } | null;
  damage: { main: { id: number; name: string } | null; second: { id: number; name: string } | null } | null;
  condition: { name: string; id: number } | null;
  images: AuctionImage | null;
  location: {
    country: { iso: string; name: string } | null;
    state: { id: number; code: string; name: string } | null;
    city: { id: number; name: string } | null;
    location: { id: number; name: string } | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface AuctionVehicle {
  id: number;
  year: number;
  title: string;
  vin: string;
  manufacturer: { id: number; name: string } | null;
  model: { id: number; name: string; manufacturer_id: number } | null;
  generation: { id: number; name: string } | null;
  body_type: { name: string; id: number } | null;
  color: { name: string; id: number } | null;
  engine: { id: number; name: string } | null;
  transmission: { name: string; id: number } | null;
  drive_wheel: { name: string; id: number } | null;
  vehicle_type: { name: string; id: number } | null;
  fuel: { name: string; id: number } | null;
  cylinders: number | null;
  lots: AuctionLot[];
}

export interface AuctionListResponse {
  data: AuctionVehicle[];
  links: { first: string; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; from: number | null; last_page: number; path: string; per_page: number; to: number | null; total: number };
}

export interface AuctionManufacturer {
  id: number;
  name: string;
  logo: string | null;
}

export interface AuctionModel {
  id: number;
  name: string;
  manufacturer_id: number;
}

// ─── Search params ─────────────────────────────────────────────────────────────

export interface SearchCarsParams {
  page?: number;
  per_page?: number;
  domain_id?: number;            // 1=IAAI, 3=Copart
  manufacturer_id?: number;      // Get IDs from /manufacturers
  model_id?: number;             // Get IDs from /models
  generation_id?: number;
  from_year?: number;
  to_year?: number;
  year?: number;
  vehicle_type?: number;         // 1=automobile (default)
  body_type?: number;            // 1=sedan,2=wagon,3=coupe,4=pickup,5=SUV,6=cabrio,7=VAN,11=hatchback,20=liftback,27=sport_car
  condition?: number;            // 0=run&drives,1=for_repair,3=not_run,6=engine_starts
  transmission?: number;         // 1=auto,2=manual
  drive_wheel?: number;          // 1=rear,2=front,3=all
  fuel_type?: number;            // 1=diesel,2=electric,3=hybrid,4=gasoline
  color?: number;
  cylinders?: number;
  bid_price_from?: number;
  bid_price_to?: number;
  buy_now_price_from?: number;
  buy_now_price_to?: number;
  buy_now?: number;              // 1 = only cars with Buy Now price
  odometer_from_mi?: number;
  odometer_to_mi?: number;
  damage?: string;               // text search: "hail", "burn", etc.
  name?: string;                 // search inside lot title/name (make, model, Corvette, etc.)
  search_query?: string;         // VIN or lot number search
  vin?: string;                  // VIN partial search (use _ for partial: NLM91_)
  state_code?: string;           // state code: CA, FL, TX, etc.
  country?: string;              // US, CA
  exclude_expired_auctions?: number; // 1 = exclude expired
  without_sale_date?: number;
  sale_date_in_days?: number;
  minutes?: number;
  simple_paginate?: number;      // 0 = include total count
  status?: number;
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function searchCars(params: SearchCarsParams = {}): Promise<AuctionListResponse> {
  const { search_query, simple_paginate, ...rest } = params;
  const p: Record<string, string | number | undefined> = {
    per_page: rest.per_page ?? 24,
    page: rest.page ?? 1,
    vehicle_type: 1, // automobiles only
    simple_paginate: 0, // always request total count for pagination
    ...rest,
  };
  // AuctionsAPI: 'search_query' = VIN or lot number; 'name' = free-text title/make/model search
  if (search_query && search_query.trim()) {
    const q = search_query.trim();
    // If it looks like a VIN (17 chars) or lot number (all digits), use search_query
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(q) || /^\d{6,12}$/.test(q)) {
      p.search_query = q;
    } else {
      // Free-text search (make, model, brand name like Mercedes)
      p.name = q;
    }
  }
  return apiFetch<AuctionListResponse>("/cars", p);
}

export async function searchByVin(vin: string): Promise<{ data: AuctionVehicle }> {
  return apiFetch<{ data: AuctionVehicle }>(`/search-vin/${encodeURIComponent(vin)}`);
}

export async function searchByLot(lot: string, domain?: "copart_com" | "iaai_com"): Promise<{ data: AuctionVehicle }> {
  const path = domain ? `/search-lot/${lot}/${domain}` : `/search-lot/${lot}`;
  return apiFetch<{ data: AuctionVehicle }>(path);
}

export async function getManufacturers(): Promise<{ data: AuctionManufacturer[] }> {
  return apiFetch<{ data: AuctionManufacturer[] }>("/manufacturers/cars");
}

export async function getModels(manufacturerId: number): Promise<{ data: AuctionModel[] }> {
  return apiFetch<{ data: AuctionModel[] }>(`/models/${manufacturerId}/cars`);
}

export async function getDamages(): Promise<{ data: Array<{ id: number; name: string }> }> {
  return apiFetch<{ data: Array<{ id: number; name: string }> }>("/usa/damages");
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
