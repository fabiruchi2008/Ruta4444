import { describe, expect, it } from "vitest";
import { calculateCopartFees, calculateIAAIFees, calculateImportCost, getTransportRate, detectVehicleSize } from "./importCalculator";

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
  it("detects large size from SUV body type", () => {
    const size = detectVehicleSize("SUV");
    expect(size.size).toBe("large");
    expect(size.needsManualQuote).toBe(false);
  });

  it("detects large size from Pickup body type", () => {
    const size = detectVehicleSize("Pickup");
    expect(size.size).toBe("large");
  });

  it("detects small size from Sedan", () => {
    const size = detectVehicleSize("Sedan");
    expect(size.size).toBe("small");
    expect(size.needsManualQuote).toBe(false);
  });

  it("defaults to medium for unknown body type", () => {
    const size = detectVehicleSize(null);
    expect(size.size).toBe("medium");
    expect(size.needsManualQuote).toBe(false);
  });

  it("marks vans as special (manual quote)", () => {
    const size = detectVehicleSize("Van");
    expect(size.size).toBe("special");
    expect(size.needsManualQuote).toBe(true);
  });
});

describe("Transport rate lookup", () => {
  it("returns rate for Florida large vehicle", () => {
    const result = getTransportRate("FL", "large");
    expect(result.needsManualQuote).toBe(false);
    expect(result.rate).toBeGreaterThan(0);
  });

  it("returns manual quote for special vehicles", () => {
    const result = getTransportRate("FL", "special");
    expect(result.needsManualQuote).toBe(true);
  });

  it("returns a rate for Texas medium vehicle", () => {
    const result = getTransportRate("TX", "medium");
    expect(result.rate).toBeGreaterThan(0);
  });

  it("California rate is higher than Florida rate (distance)", () => {
    const fl = getTransportRate("FL", "medium");
    const ca = getTransportRate("CA", "medium");
    expect(ca.rate).toBeGreaterThan(fl.rate);
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
    const result = calculateImportCost(baseInput);
    expect(result.auctionPrice).toBe(5000);
    expect(result.maritimeShipping).toBe(2800);
    expect(result.rutaCarsServiceUSD).toBe(500);
    expect(result.finalPriceUSD).toBeGreaterThan(5000);
    expect(result.finalPriceGTQ).toBeGreaterThan(result.finalPriceUSD * 7);
    expect(result.cifValue).toBeGreaterThan(0);
  });

  it("applies 32% Guatemala tax on CIF value", () => {
    const result = calculateImportCost(baseInput);
    const expectedCif = result.auctionPrice + result.platformFees.total + result.usaTransport + result.maritimeShipping;
    expect(result.cifValue).toBe(expectedCif);
    expect(result.guatemalaTax).toBe(Math.round(expectedCif * 0.32));
  });

  it("miscExpensesGTQ is fixed at Q5,000", () => {
    const result = calculateImportCost(baseInput);
    expect(result.miscExpensesGTQ).toBe(5000);
  });

  it("Servicio Ruta Cars GT is $500 in breakdown (visible al cliente)", () => {
    const result = calculateImportCost(baseInput);
    const servicioItem = result.breakdown.find(b => b.label.includes("Ruta Cars"));
    expect(servicioItem).toBeDefined();
    expect(servicioItem?.amountUSD).toBe(500);
  });

  it("final price includes internal profit (min Q10,000) oculto", () => {
    const result = calculateImportCost(baseInput);
    const baseCostGTQ = result.totalCostUSD * result.exchangeRate + result.miscExpensesGTQ;
    expect(result.finalPriceGTQ).toBeGreaterThanOrEqual(Math.round(baseCostGTQ) + 10000);
  });

  it("higher internalProfitGTQ produces higher final price", () => {
    const r1 = calculateImportCost({ ...baseInput, internalProfitGTQ: 10000 });
    const r2 = calculateImportCost({ ...baseInput, internalProfitGTQ: 20000 });
    expect(r2.finalPriceGTQ).toBeGreaterThan(r1.finalPriceGTQ);
    expect(r2.internalProfitGTQ).toBe(20000);
  });

  it("breakdown does NOT expose internal profit to client", () => {
    const result = calculateImportCost(baseInput);
    const labels = result.breakdown.map(b => b.label.toLowerCase());
    expect(labels.some(l => l.includes("ganancia") || l.includes("profit") || l.includes("internal"))).toBe(false);
  });

  it("marks special vehicles (Van) as needing manual quote", () => {
    const result = calculateImportCost({ ...baseInput, bodyType: "Van" });
    expect(result.needsManualQuote).toBe(true);
  });

  it("calculates IAAI fees correctly", () => {
    const result = calculateImportCost({ ...baseInput, platform: "iaai" });
    expect(result.auctionPrice).toBe(5000);
    expect(result.platformFees.virtualBidFee).toBe(75);
    expect(result.finalPriceUSD).toBeGreaterThan(5000);
  });

  it("CIF includes auction price, fees, transport and shipping", () => {
    const result = calculateImportCost({ ...baseInput, auctionPrice: 4000 });
    const expectedCIF = result.auctionPrice + result.platformFees.total + result.usaTransport + result.maritimeShipping;
    expect(result.cifValue).toBe(expectedCIF);
  });

  it("breakdown has all expected line items", () => {
    const result = calculateImportCost(baseInput);
    const labels = result.breakdown.map(b => b.label);
    expect(labels.some(l => l.includes("Subasta"))).toBe(true);
    expect(labels.some(l => l.includes("Fees") || l.includes("Copart") || l.includes("IAAI"))).toBe(true);
    expect(labels.some(l => l.includes("Transporte"))).toBe(true);
    expect(labels.some(l => l.includes("Shipping") || l.includes("Mar\u00edtimo"))).toBe(true);
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
