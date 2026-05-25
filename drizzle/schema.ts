import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Cotizaciones ──────────────────────────────────────────────────────────────
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 50 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  vehicleId: varchar("vehicleId", { length: 100 }),
  vehicleVin: varchar("vehicleVin", { length: 50 }),
  vehicleLot: varchar("vehicleLot", { length: 50 }),
  vehicleTitle: varchar("vehicleTitle", { length: 500 }),
  vehicleYear: int("vehicleYear"),
  vehicleMake: varchar("vehicleMake", { length: 100 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  vehicleBodyType: varchar("vehicleBodyType", { length: 100 }),
  vehicleStateCode: varchar("vehicleStateCode", { length: 10 }),
  platform: mysqlEnum("platform", ["copart", "iaai"]).notNull(),
  auctionPrice: decimal("auctionPrice", { precision: 10, scale: 2 }).notNull(),
  platformFees: decimal("platformFees", { precision: 10, scale: 2 }),
  usaTransport: decimal("usaTransport", { precision: 10, scale: 2 }),
  maritimeShipping: decimal("maritimeShipping", { precision: 10, scale: 2 }),
  cifValue: decimal("cifValue", { precision: 10, scale: 2 }),
  customsDuty: decimal("customsDuty", { precision: 10, scale: 2 }),
  vat: decimal("vat", { precision: 10, scale: 2 }),
  customsAdminFee: decimal("customsAdminFee", { precision: 10, scale: 2 }),
  rutaCarsService: decimal("rutaCarsService", { precision: 10, scale: 2 }),
  totalUSD: decimal("totalUSD", { precision: 10, scale: 2 }),
  totalGTQ: decimal("totalGTQ", { precision: 12, scale: 2 }),
  exchangeRate: decimal("exchangeRate", { precision: 8, scale: 4 }),
  status: mysqlEnum("status", ["pending", "contacted", "in_process", "completed", "cancelled"]).default("pending").notNull(),
  trackingCode: varchar("trackingCode", { length: 20 }).unique(),
  adminNotes: text("adminNotes"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ─── Configuración del Sistema ─────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// ─── Vehículos Destacados ──────────────────────────────────────────────────────
export const featuredVehicles = mysqlTable("featured_vehicles", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: varchar("vehicleId", { length: 100 }).notNull(),
  vehicleVin: varchar("vehicleVin", { length: 50 }),
  vehicleTitle: varchar("vehicleTitle", { length: 500 }),
  vehicleYear: int("vehicleYear"),
  vehicleMake: varchar("vehicleMake", { length: 100 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  vehicleImage: text("vehicleImage"),
  platform: mysqlEnum("platform", ["copart", "iaai"]).notNull(),
  bidPrice: decimal("bidPrice", { precision: 10, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeaturedVehicle = typeof featuredVehicles.$inferSelect;
export type InsertFeaturedVehicle = typeof featuredVehicles.$inferInsert;

// ─── Contactos / Leads ─────────────────────────────────────────────────────────
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }),
  message: text("message"),
  source: varchar("source", { length: 100 }).default("website"),
  status: mysqlEnum("status", ["new", "contacted", "converted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Tarifas de Transporte (Royal Shipping) ─────────────────────────────────────────────────────────────────────────────────
// Precios reales scrapeados de royalshippinglines.com/guatemala
// Tarifa de grúa (inland) desde subasta hasta puerto en Miami
export const shippingRates = mysqlTable("shipping_rates", {
  id: int("id").autoincrement().primaryKey(),
  brand: mysqlEnum("brand", ["copart", "iaai"]).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  stateCode: varchar("stateCode", { length: 10 }).notNull(),
  inlandRateUsd: int("inlandRateUsd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = typeof shippingRates.$inferInsert;

// Tarifas de flete marítimo por tamaño de vehículo (Royal Shipping - Santo Tomás de Castilla)
export const oceanRates = mysqlTable("ocean_rates", {
  id: int("id").autoincrement().primaryKey(),
  vehicleSize: varchar("vehicleSize", { length: 50 }).notNull().unique(),
  rateUsd: int("rateUsd").notNull(),
  tier: int("tier").notNull(),
  description: varchar("description", { length: 200 }),
  maxLengthFt: decimal("maxLengthFt", { precision: 5, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OceanRate = typeof oceanRates.$inferSelect;
export type InsertOceanRate = typeof oceanRates.$inferInsert;

// ─── Precios de Mercado Guatemala ─────────────────────────────────────────────
// Precios de referencia del mercado guatemalteco (Facebook Marketplace, etc.)
// Usados para calcular la ganancia dinámica de Ruta Cars GT
export const gtMarketPrices = mysqlTable("gt_market_prices", {
  id: int("id").autoincrement().primaryKey(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year"),
  priceGtq: int("price_gtq").notNull(),
  source: varchar("source", { length: 100 }).default("facebook_marketplace"),
  sampleCount: int("sample_count").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GtMarketPrice = typeof gtMarketPrices.$inferSelect;
export type InsertGtMarketPrice = typeof gtMarketPrices.$inferInsert;

// ─── Historial de Cotizaciones PDF (Admin) ──────────────────────────────────
export const quotePdfs = mysqlTable("quote_pdfs", {
  id: int("id").autoincrement().primaryKey(),
  folio: varchar("folio", { length: 30 }).notNull(),
  lotNumber: varchar("lotNumber", { length: 50 }).notNull(),
  vehicleName: varchar("vehicleName", { length: 255 }).notNull(),
  vehicleVin: varchar("vehicleVin", { length: 50 }),
  platform: varchar("platform", { length: 20 }),
  stateCode: varchar("stateCode", { length: 10 }),
  clientName: varchar("clientName", { length: 255 }),
  clientDpi: varchar("clientDpi", { length: 50 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  agreedPriceUSD: decimal("agreedPriceUSD", { precision: 10, scale: 2 }),
  agreedPriceGTQ: decimal("agreedPriceGTQ", { precision: 12, scale: 2 }),
  totalCostUSD: decimal("totalCostUSD", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuotePdf = typeof quotePdfs.$inferSelect;
export type InsertQuotePdf = typeof quotePdfs.$inferInsert;
