import { describe, expect, it } from "vitest";
import {
  calculateCopartFees,
  calculateIAAIFees,
  calculateImportCostSync,
  detectVehicleSize,
  USA_TRANSPORT_RATES,
  OCEAN_RATES_BY_SIZE,
} from "./importCalculator";

describe("Copart fees", () => {
  it("calculates buyer fee for $5000 bid", () => {
    const fees = calculateCopartFees(5000);
    expect(fees.buyerFee).toBeGreaterThan(0);
    expect(fees.total).toBeGreaterThan(fees.buyerFee);
    expect(fees.breakdown.length).toBeGreaterThan(0);
  });

  it("calculates buyer fee for $500 bid", () => {
    const fees = calculateCopartFees(500);
    expect(fees.buyerFee).toBeGreaterThan(0);
    expect(fees.total).toBeGreaterThan(0);
  });

  it("calculates buyer fee for very low bid ($50)", () => {
    const fees = calculateCopartFees(50);
    expect(fees.buyerFee).toBe(59);
  });

  it("includes environmental and title fees", () => {
    const fees = calculateCopartFees(3000);
    expect(fees.environmentalFee).toBeGreaterThan(0);
    expect(fees.titleFee).toBeGreaterThan(0);
  });
});

describe("IAAI fees", () => {
  it("calculates buyer fee for $5000 bid", () => {
    const fees = calculateIAAIFees(5000);
    expect(fees.buyerFee).toBeGreaterThan(0);
    expect(fees.total).toBeGreaterThan(fees.buyerFee);
  });

  it("calculates buyer fee for $1000 bid", () => {
    const fees = calculateIAAIFees(1000);
    expect(fees.total).toBeGreaterThan(0);
  });

  it("includes virtual bid fee for Autobid Master ($75)", () => {
    const fees = calculateIAAIFees(2000);
    expect(fees.virtualBidFee).toBe(75);
  });
});

describe("Vehicle size detection", () => {
  it("detects medium_suv size from SUV body type", () => {
    const size = detectVehicleSize("SUV");
    expect(size.size).toBe("medium_suv");
    expect(size.needsManualQuote).toBe(false);
  });

  it("detects medium_suv size from Pickup body type", () => {
    const size = detectVehicleSize("Pickup");
    expect(size.size).toBe("medium_suv");
  });

  it("detects sedan size from Sedan", () => {
    const size = detectVehicleSize("Sedan");
    expect(size.size).toBe("sedan");
    expect(size.needsManualQuote).toBe(false);
  });

  it("defaults to medium_suv for unknown body type", () => {
    const size = detectVehicleSize(null);
    expect(size.size).toBe("medium_suv");
    expect(size.needsManualQuote).toBe(false);
  });

  it("marks large vans as xl_suv (not special)", () => {
    const size = detectVehicleSize("Van");
    expect(size.size).toBe("xl_suv");
    expect(size.needsManualQuote).toBe(false);
  });

  it("marks motorhome as special (manual quote)", () => {
    const size = detectVehicleSize("Motorhome");
    expect(size.size).toBe("special");
    expect(size.needsManualQuote).toBe(true);
  });
});

describe("Transport rate lookup (static fallback)", () => {
  it("has rates for Florida", () => {
    const fl = USA_TRANSPORT_RATES.find(r => r.stateCode === "FL");
    expect(fl).toBeDefined();
    expect(fl!.rate).toBeGreaterThan(0);
  });

  it("has rates for California", () => {
    const ca = USA_TRANSPORT_RATES.find(r => r.stateCode === "CA");
    expect(ca).toBeDefined();
    expect(ca!.rate).toBeGreaterThan(0);
  });

  it("California rate is higher than Florida rate (distance)", () => {
    const fl = USA_TRANSPORT_RATES.find(r => r.stateCode === "FL")!.rate;
    const ca = USA_TRANSPORT_RATES.find(r => r.stateCode === "CA")!.rate;
    expect(ca).toBeGreaterThan(fl);
  });
});

describe("Ocean rates by vehicle size", () => {
  it("sedan rate is $875", () => {
    expect(OCEAN_RATES_BY_SIZE.sedan).toBe(875);
  });

  it("xl_suv rate is higher than sedan rate", () => {
    expect(OCEAN_RATES_BY_SIZE.xl_suv).toBeGreaterThan(OCEAN_RATES_BY_SIZE.sedan);
  });

  it("medium_suv rate is $1100", () => {
    expect(OCEAN_RATES_BY_SIZE.medium_suv).toBe(1100);
  });
});

describe("Full import cost calculation (nueva lógica: 32% GT unificado)", () => {
  const baseInput = {
    auctionPrice: 5000,
    platform: "copart" as const,
    stateCode: "FL",
    bodyType: "Sedan",
    exchangeRate: 7.75,
  };

  it("calculates total import cost for Copart Florida sedan at $5000", () => {
    const result = calculateImportCostSync(baseInput);
    expect(result.auctionPrice).toBe(5000);
    // Maritime shipping for sedan is $875 (Royal Shipping real rate)
    expect(result.maritimeShipping).toBe(875);
    expect(result.rutaCarsServiceUSD).toBe(500);
    expect(result.finalPriceUSD).toBeGreaterThan(5000);
    expect(result.finalPriceGTQ).toBeGreaterThan(result.finalPriceUSD * 7);
    expect(result.cifValue).toBeGreaterThan(0);
  });

  it("applies 32% Guatemala tax on CIF value", () => {
    const result = calculateImportCostSync(baseInput);
    const expectedCif = result.auctionPrice + result.platformFees.total + result.usaTransport + result.maritimeShipping;
    expect(result.cifValue).toBe(expectedCif);
    expect(result.guatemalaTax).toBe(Math.round(expectedCif * 0.32));
  });

  it("miscExpensesGTQ is fixed at Q5,000", () => {
    const result = calculateImportCostSync(baseInput);
    expect(result.miscExpensesGTQ).toBe(5000);
  });

  it("Servicio Ruta Cars GT is $500 in breakdown (visible al cliente)", () => {
    const result = calculateImportCostSync(baseInput);
    const servicioItem = result.breakdown.find(b => b.label.includes("Ruta Cars"));
    expect(servicioItem).toBeDefined();
    expect(servicioItem?.amountUSD).toBe(500);
  });

  it("usaTransport includes base rate + $500 profit (hidden)", () => {
    const result = calculateImportCostSync(baseInput);
    // usaTransportBase is the real Royal Shipping rate, usaTransport adds $500 profit
    expect(result.usaTransport).toBe(result.usaTransportBase + 500);
  });

  it("breakdown does NOT expose internal profit to client", () => {
    const result = calculateImportCostSync(baseInput);
    const labels = result.breakdown.map(b => b.label.toLowerCase());
    expect(labels.some(l => l.includes("ganancia") || l.includes("profit") || l.includes("internal"))).toBe(false);
  });

  it("marks special vehicles (Motorhome) as needing manual quote", () => {
    const result = calculateImportCostSync({ ...baseInput, bodyType: "Motorhome" });
    expect(result.needsManualQuote).toBe(true);
  });

  it("calculates IAAI fees correctly", () => {
    const result = calculateImportCostSync({ ...baseInput, platform: "iaai" });
    expect(result.auctionPrice).toBe(5000);
    expect(result.platformFees.virtualBidFee).toBe(75);
    expect(result.finalPriceUSD).toBeGreaterThan(5000);
  });

  it("CIF includes auction price, fees, transport and shipping", () => {
    const result = calculateImportCostSync({ ...baseInput, auctionPrice: 4000 });
    const expectedCIF = result.auctionPrice + result.platformFees.total + result.usaTransport + result.maritimeShipping;
    expect(result.cifValue).toBe(expectedCIF);
  });

  it("breakdown has all expected line items", () => {
    const result = calculateImportCostSync(baseInput);
    const labels = result.breakdown.map(b => b.label);
    expect(labels.some(l => l.includes("Subasta"))).toBe(true);
    expect(labels.some(l => l.includes("Fees") || l.includes("Copart") || l.includes("IAAI"))).toBe(true);
    expect(labels.some(l => l.includes("Transporte"))).toBe(true);
    expect(labels.some(l => l.includes("Shipping") || l.includes("Marítimo"))).toBe(true);
    expect(labels.some(l => l.includes("Impuesto") || l.includes("32%"))).toBe(true);
    expect(labels.some(l => l.includes("Gastos"))).toBe(true);
    expect(labels.some(l => l.includes("Ruta Cars"))).toBe(true);
  });
});

// ─── auth.logout ─────────────────────────────────────────────────────────────
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1, openId: "sample-user", email: "sample@example.com", name: "Sample User",
    loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/",
    });
  });
});
