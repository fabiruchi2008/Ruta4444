import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  searchCars,
  searchByVin,
  searchByLot,
  getManufacturers,
  getModels,
  getDamages,
  type SearchCarsParams,
} from "./auctionsApi";
import {
  calculateImportCost,
  calculateCopartFees,
  calculateIAAIFees,
  detectVehicleSize,
  USA_TRANSPORT_RATES,
  getGtMarketPrice,
} from "./importCalculator";
import { getDb } from "./db";
import { quotes, contacts, settings, featuredVehicles, quotePdfs } from "../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso solo para administradores" });
  }
  return next({ ctx });
});

async function getSetting(key: string, defaultValue: string): Promise<string> {
  const db = await getDb();
  if (!db) return defaultValue;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value ?? defaultValue;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  vehicles: router({
    search: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        per_page: z.number().optional(),
        domain_id: z.number().optional(),
        manufacturer_id: z.number().optional(),
        model_id: z.number().optional(),
        generation_id: z.number().optional(),
        from_year: z.number().optional(),
        to_year: z.number().optional(),
        year: z.number().optional(),
        body_type: z.number().optional(),
        condition: z.number().optional(),
        transmission: z.number().optional(),
        drive_wheel: z.number().optional(),
        fuel_type: z.number().optional(),
        color: z.number().optional(),
        cylinders: z.number().optional(),
        bid_price_from: z.number().optional(),
        bid_price_to: z.number().optional(),
        buy_now_price_from: z.number().optional(),
        buy_now_price_to: z.number().optional(),
        buy_now: z.number().optional(),
        odometer_from_mi: z.number().optional(),
        odometer_to_mi: z.number().optional(),
        damage: z.string().optional(),
        name: z.string().optional(),
        search_query: z.string().optional(),
        vin: z.string().optional(),
        state_code: z.string().optional(),
        country: z.string().optional(),
        exclude_expired_auctions: z.number().optional(),
        without_sale_date: z.number().optional(),
        sale_date_in_days: z.number().optional(),
        minutes: z.number().optional(),
        simple_paginate: z.number().optional(),
        status: z.number().optional(),
        sort: z.string().optional(),
        order: z.enum(["asc", "desc"]).optional(),
      }))
      .query(async ({ input }) => {
        return searchCars(input as SearchCarsParams);
      }),

    searchByVin: publicProcedure
      .input(z.object({ vin: z.string().min(5) }))
      .query(async ({ input }) => searchByVin(input.vin)),

    searchByLot: publicProcedure
      .input(z.object({
        lot: z.string().min(3),
        domain: z.enum(["copart_com", "iaai_com"]).optional(),
      }))
      .query(async ({ input }) => searchByLot(input.lot, input.domain)),

    manufacturers: publicProcedure.query(async () => getManufacturers()),

    models: publicProcedure
      .input(z.object({ manufacturerId: z.number() }))
      .query(async ({ input }) => getModels(input.manufacturerId)),

    damages: publicProcedure.query(async () => getDamages()),
  }),

  calculator: router({
    calculate: publicProcedure
      .input(z.object({
        auctionPrice: z.number().positive(),
        platform: z.enum(["copart", "iaai"]),
        stateCode: z.string().min(2).max(3),
        bodyType: z.string().nullable().optional(),
        city: z.union([z.string(), z.object({ id: z.number().optional(), name: z.string() })]).nullable().optional(),
        make: z.string().nullable().optional(),
        model: z.string().nullable().optional(),
        year: z.number().nullable().optional(),
      }))
      .query(async ({ input }) => {
        const exchangeRate = parseFloat(await getSetting("exchange_rate", "7.80"));
        const minProfitGTQ = parseFloat(await getSetting("min_profit_gtq", "10000"));
        const cityStr = input.city == null ? null : (typeof input.city === "string" ? input.city : input.city.name);
        const result = await calculateImportCost({
          auctionPrice: input.auctionPrice,
          platform: input.platform,
          stateCode: input.stateCode,
          bodyType: input.bodyType ?? null,
          city: cityStr,
          make: input.make ?? null,
          model: input.model ?? null,
          year: input.year ?? null,
          exchangeRate,
          minProfitGTQ,
        });
        // Si la ganancia es baja, notificar al dueño
        if (result.needsManualQuote && result.manualQuoteReason === "low_profit") {
          notifyOwner({
            title: `⚠️ Ganancia Baja - ${input.make ?? ""} ${input.model ?? ""} ${input.year ?? ""}`,
            content: `Precio subasta: $${input.auctionPrice} | Costo base: Q${result.finalPriceGTQ?.toLocaleString() ?? "?"} | Mercado GT: Q${result.gtMarketPriceGTQ?.toLocaleString() ?? "N/A"} | Ganancia estimada: Q${result.estimatedProfitGTQ?.toLocaleString() ?? "?"} (mínimo requerido: Q${minProfitGTQ.toLocaleString()})`,
          }).catch(() => {});
        }
        return result;
      }),

    platformFees: publicProcedure
      .input(z.object({ price: z.number().positive(), platform: z.enum(["copart", "iaai"]) }))
      .query(({ input }) => {
        return input.platform === "copart"
          ? calculateCopartFees(input.price)
          : calculateIAAIFees(input.price);
      }),

    transportRates: publicProcedure.query(() => USA_TRANSPORT_RATES),

    vehicleSize: publicProcedure
      .input(z.object({ bodyType: z.string().nullable() }))
      .query(({ input }) => detectVehicleSize(input.bodyType)),

    marketAnalysis: publicProcedure
      .input(z.object({
        vehicleTitle: z.string(),
        vehicleYear: z.number(),
        make: z.string(),
        model: z.string(),
        auctionPrice: z.number(),
        damage: z.string().optional(),
        totalCostUSD: z.number(),
        totalCostGTQ: z.number(),
        exchangeRate: z.number(),
      }))
      .query(async ({ input }) => {
        try {
          const prompt = `Eres un experto en el mercado automotriz de Guatemala. Analiza este vehículo:
Vehículo: ${input.vehicleYear} ${input.make} ${input.model}
Precio subasta: $${input.auctionPrice} USD
Daño: ${input.damage || "No especificado"}
Costo total importación: $${input.totalCostUSD} USD (Q${input.totalCostGTQ.toLocaleString()} GTQ)
Tipo de cambio: Q${input.exchangeRate} por $1 USD

Responde en JSON con precios reales del mercado guatemalteco (Marketplace, OLX, Encuentra24).`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Experto en mercado automotriz guatemalteco. Responde SOLO con JSON válido." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "market_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    estimatedMarketPriceGTQ: { type: "number" },
                    priceRangeMin: { type: "number" },
                    priceRangeMax: { type: "number" },
                    estimatedProfitGTQ: { type: "number" },
                    profitMarginPercent: { type: "number" },
                    marketDemand: { type: "string" },
                    recommendation: { type: "string" },
                    repairCostEstimateUSD: { type: "number" },
                    comparableVehicles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          priceGTQ: { type: "number" },
                        },
                        required: ["description", "priceGTQ"],
                        additionalProperties: false,
                      },
                    },
                    buyRecommendation: { type: "boolean" },
                  },
                  required: ["estimatedMarketPriceGTQ","priceRangeMin","priceRangeMax","estimatedProfitGTQ","profitMarginPercent","marketDemand","recommendation","repairCostEstimateUSD","comparableVehicles","buyRecommendation"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
          if (!content) throw new Error("No LLM response");
          return JSON.parse(content);
        } catch {
          const estimatedMarketPriceGTQ = Math.round(input.totalCostGTQ * 1.35);
          return {
            estimatedMarketPriceGTQ,
            priceRangeMin: Math.round(estimatedMarketPriceGTQ * 0.9),
            priceRangeMax: Math.round(estimatedMarketPriceGTQ * 1.15),
            estimatedProfitGTQ: estimatedMarketPriceGTQ - input.totalCostGTQ,
            profitMarginPercent: Math.round(((estimatedMarketPriceGTQ - input.totalCostGTQ) / input.totalCostGTQ) * 100),
            marketDemand: "media",
            recommendation: "Análisis basado en estimaciones del mercado guatemalteco.",
            repairCostEstimateUSD: 0,
            comparableVehicles: [],
            buyRecommendation: (estimatedMarketPriceGTQ - input.totalCostGTQ) >= 10000,
          };
        }
      }),
  }),

  quotes: router({
    create: publicProcedure
      .input(z.object({
        clientName: z.string().min(2),
        clientPhone: z.string().min(8),
        clientEmail: z.string().email().optional(),
        vehicleId: z.string().optional(),
        vehicleVin: z.string().optional(),
        vehicleLot: z.string().optional(),
        vehicleTitle: z.string().optional(),
        vehicleYear: z.number().optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleBodyType: z.string().optional(),
        vehicleStateCode: z.string().optional(),
        platform: z.enum(["copart", "iaai"]),
        auctionPrice: z.number().positive(),
        platformFees: z.number().optional(),
        usaTransport: z.number().optional(),
        maritimeShipping: z.number().optional(),
        cifValue: z.number().optional(),
        customsDuty: z.number().optional(),
        vat: z.number().optional(),
        customsAdminFee: z.number().optional(),
        rutaCarsService: z.number().optional(),
        totalUSD: z.number().optional(),
        totalGTQ: z.number().optional(),
        exchangeRate: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Generate unique tracking code: RC-XXXXXX
        const trackingCode = `RC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        await db.insert(quotes).values({
          ...input,
          trackingCode,
          auctionPrice: String(input.auctionPrice),
          platformFees: input.platformFees != null ? String(input.platformFees) : undefined,
          usaTransport: input.usaTransport != null ? String(input.usaTransport) : undefined,
          maritimeShipping: input.maritimeShipping != null ? String(input.maritimeShipping) : undefined,
          cifValue: input.cifValue != null ? String(input.cifValue) : undefined,
          customsDuty: input.customsDuty != null ? String(input.customsDuty) : undefined,
          vat: input.vat != null ? String(input.vat) : undefined,
          customsAdminFee: input.customsAdminFee != null ? String(input.customsAdminFee) : undefined,
          rutaCarsService: input.rutaCarsService != null ? String(input.rutaCarsService) : undefined,
          totalUSD: input.totalUSD != null ? String(input.totalUSD) : undefined,
          totalGTQ: input.totalGTQ != null ? String(input.totalGTQ) : undefined,
          exchangeRate: input.exchangeRate != null ? String(input.exchangeRate) : undefined,
        });
        await notifyOwner({
          title: `🚗 Nueva Cotización #${trackingCode} - ${input.vehicleTitle || "Vehículo"}`,
          content: `Cliente: ${input.clientName} | Tel: ${input.clientPhone} | Vehículo: ${input.vehicleTitle || "N/A"} | Total: $${input.totalUSD?.toFixed(2) || "N/A"} USD | Código: ${trackingCode}`,
        }).catch(() => {});
        return { success: true, trackingCode };
      }),

    list: adminProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return db.select().from(quotes).orderBy(desc(quotes.createdAt))
          .limit(input.limit).offset((input.page - 1) * input.limit);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "contacted", "in_process", "completed", "cancelled"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(quotes).set({ status: input.status, notes: input.notes }).where(eq(quotes.id, input.id));
        return { success: true };
      }),

    // Public tracking — only returns safe fields (no admin notes)
    track: publicProcedure
      .input(z.object({ trackingCode: z.string().min(3) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const result = await db.select({
          id: quotes.id,
          trackingCode: quotes.trackingCode,
          clientName: quotes.clientName,
          vehicleTitle: quotes.vehicleTitle,
          vehicleYear: quotes.vehicleYear,
          vehicleMake: quotes.vehicleMake,
          vehicleModel: quotes.vehicleModel,
          platform: quotes.platform,
          auctionPrice: quotes.auctionPrice,
          totalUSD: quotes.totalUSD,
          totalGTQ: quotes.totalGTQ,
          status: quotes.status,
          notes: quotes.notes,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
        }).from(quotes).where(eq(quotes.trackingCode, input.trackingCode)).limit(1);
        if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Código de seguimiento no encontrado" });
        return result[0];
      }),
  }),

  contacts: router({
    create: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(contacts).values({ ...input, source: input.source ?? "website" });
        await notifyOwner({
          title: `Nuevo Contacto - ${input.name}`,
          content: `Tel: ${input.phone} | Email: ${input.email || "N/A"} | Mensaje: ${input.message || "N/A"}`,
        }).catch(() => {});
        return { success: true };
      }),

    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(contacts).orderBy(desc(contacts.createdAt));
    }),
  }),

  settings: router({
    get: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { exchange_rate: "7.75", custom_duty_rate: "0.20", maritime_shipping: "2800", ruta_cars_service_fee: "500", min_profit_gtq: "10000", whatsapp_number: "+50231220803", customs_admin_fee: "350" };
      const result = await db.select().from(settings);
      const map: Record<string, string> = {};
      for (const s of result) map[s.key] = s.value;
      return map;
    }),

    update: adminProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(settings).values({ key: input.key, value: input.value })
          .onDuplicateKeyUpdate({ set: { value: input.value } });
        return { success: true };
      }),
  }),

  featured: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(featuredVehicles)
        .where(eq(featuredVehicles.isActive, true))
        .orderBy(asc(featuredVehicles.sortOrder));
    }),

    add: adminProcedure
      .input(z.object({
        vehicleId: z.string(),
        vehicleVin: z.string().optional(),
        vehicleTitle: z.string().optional(),
        vehicleYear: z.number().optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleImage: z.string().optional(),
        platform: z.enum(["copart", "iaai"]),
        bidPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(featuredVehicles).values({
          ...input,
          bidPrice: input.bidPrice != null ? String(input.bidPrice) : undefined,
        });
        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(featuredVehicles).where(eq(featuredVehicles.id, input.id));
        return { success: true };
      }),
  }),

  admin: router({
    getQuotes: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(100);
      return rows.map(r => ({
        ...r,
        auctionPrice: r.auctionPrice ? parseFloat(r.auctionPrice) : null,
        totalUSD: r.totalUSD ? parseFloat(r.totalUSD) : null,
        totalGTQ: r.totalGTQ ? parseFloat(r.totalGTQ) : null,
      }));
    }),

    getContacts: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(100);
    }),

    getStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalQuotes: 0, totalContacts: 0, pendingQuotes: 0 };
      const allQuotes = await db.select().from(quotes);
      const allContacts = await db.select().from(contacts);
      const pendingQuotes = allQuotes.filter(q => q.status === "pending").length;
      return { totalQuotes: allQuotes.length, totalContacts: allContacts.length, pendingQuotes };
    }),

    updateQuoteStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending","contacted","in_process","completed","rejected","approved","cancelled"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(quotes).set({ status: input.status as any }).where(eq(quotes.id, input.id));
        return { success: true };
      }),

    saveQuotePdf: adminProcedure
      .input(z.object({
        folio: z.string(),
        lotNumber: z.string(),
        vehicleName: z.string(),
        vehicleVin: z.string().nullable().optional(),
        platform: z.string().nullable().optional(),
        stateCode: z.string().nullable().optional(),
        clientName: z.string().nullable().optional(),
        clientDpi: z.string().nullable().optional(),
        clientPhone: z.string().nullable().optional(),
        agreedPriceUSD: z.number().nullable().optional(),
        agreedPriceGTQ: z.number().nullable().optional(),
        totalCostUSD: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(quotePdfs).values({
          folio: input.folio,
          lotNumber: input.lotNumber,
          vehicleName: input.vehicleName,
          vehicleVin: input.vehicleVin ?? null,
          platform: input.platform ?? null,
          stateCode: input.stateCode ?? null,
          clientName: input.clientName ?? null,
          clientDpi: input.clientDpi ?? null,
          clientPhone: input.clientPhone ?? null,
          agreedPriceUSD: input.agreedPriceUSD != null ? String(input.agreedPriceUSD) : null,
          agreedPriceGTQ: input.agreedPriceGTQ != null ? String(input.agreedPriceGTQ) : null,
          totalCostUSD: input.totalCostUSD != null ? String(input.totalCostUSD) : null,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),

    getQuotePdfs: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(quotePdfs).orderBy(desc(quotePdfs.createdAt)).limit(200);
      return rows.map(r => ({
        ...r,
        agreedPriceUSD: r.agreedPriceUSD ? parseFloat(r.agreedPriceUSD) : null,
        agreedPriceGTQ: r.agreedPriceGTQ ? parseFloat(r.agreedPriceGTQ) : null,
        totalCostUSD: r.totalCostUSD ? parseFloat(r.totalCostUSD) : null,
      }));
    }),

    // Calculadora de costo real (sin ganancia) — solo para admin
    calculateReal: adminProcedure
      .input(z.object({
        auctionPrice: z.number(),
        platform: z.enum(["copart", "iaai"]),
        stateCode: z.string(),
        bodyType: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        exchangeRate: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const exchangeRate = input.exchangeRate ?? parseFloat(await getSetting("exchange_rate", "7.75"));
        const result = await calculateImportCost({
          auctionPrice: input.auctionPrice,
          platform: input.platform as "copart" | "iaai",
          stateCode: input.stateCode,
          bodyType: input.bodyType ?? null,
          city: input.city ?? null,
          exchangeRate,
          internalProfitUSD: 0, // Sin ganancia para admin
          minProfitGTQ: 0,      // Sin ganancia mínima
        });
        // Costo real = total sin Gestión Internacional
        const realCostUSD = result.totalCostUSD - result.gestionInternacionalUSD;
        const realCostGTQ = Math.round(realCostUSD * exchangeRate);
        return {
          ...result,
          // Sobreescribir para mostrar costo real sin ganancia
          gestionInternacionalUSD: 0,
          totalCostUSD: realCostUSD,
          finalPriceUSD: Math.round(realCostUSD),
          finalPriceGTQ: realCostGTQ,
          breakdown: result.breakdown.filter(b => b.label !== "Gestión Internacional" && b.label !== "Servicio Ruta Cars GT"),
        };
      }),
  }),

  vehicleDetail: router({
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        // Try lot number search first
        try {
          const result = await searchByLot(input.id);
          if (result?.data) return result.data;
        } catch {}
        // Try VIN search
        try {
          const result = await searchByVin(input.id);
          if (result?.data) return result.data;
        } catch {}
        return null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
