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

  it("includes virtual bid fee for Autobid Master", () => {
    const fees = calculateIAAIFees(2000);
    expect(fees.virtualBidFee).toBeGreaterThan(0);
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

  it("detects small/medium size from Sedan", () => {
    const size = detectVehicleSize("Sedan");
    expect(["small", "medium"]).toContain(size.size);
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
});

describe("Full import cost calculation", () => {
  it("calculates total import cost for Copart Florida sedan at $5000", () => {
    const result = calculateImportCost({
      auctionPrice: 5000,
      platform: "copart",
      stateCode: "FL",
      bodyType: "Sedan",
      exchangeRate: 7.75,
      customDutyRate: 0.20,
    });
    expect(result.auctionPrice).toBe(5000);
    expect(result.maritimeShipping).toBe(2800);
    expect(result.rutaCarsService).toBe(500);
    expect(result.totalUSD).toBeGreaterThan(5000);
    expect(result.totalGTQ).toBeGreaterThan(result.totalUSD * 7);
    expect(result.cifValue).toBeGreaterThan(0);
    expect(result.customsDuty).toBeGreaterThan(0);
    expect(result.vat).toBeGreaterThan(0);
  });

  it("tracks minimum profit threshold of Q10000", () => {
    const result = calculateImportCost({
      auctionPrice: 5000,
      platform: "copart",
      stateCode: "FL",
      bodyType: "SUV",
      exchangeRate: 7.75,
      customDutyRate: 0.20,
    });
    // meetsMinimumProfit is derived from Q10000 threshold
    expect(typeof result.meetsMinimumProfit).toBe("boolean");
    expect(result.suggestedSellingPriceGTQ).toBeGreaterThanOrEqual(result.totalGTQ + 10000);
  });

  it("calculates IAAI fees correctly", () => {
    const result = calculateImportCost({
      auctionPrice: 3000,
      platform: "iaai",
      stateCode: "TX",
      bodyType: null,
      exchangeRate: 7.75,
      customDutyRate: 0.15,
    });
    expect(result.auctionPrice).toBe(3000);
    expect(result.totalUSD).toBeGreaterThan(3000);
  });

  it("applies correct exchange rate to GTQ", () => {
    const result = calculateImportCost({
      auctionPrice: 5000,
      platform: "copart",
      stateCode: "FL",
      bodyType: null,
      exchangeRate: 7.75,
      customDutyRate: 0.20,
    });
    // GTQ should be roughly totalUSD * exchangeRate
    const ratio = result.totalGTQ / result.totalUSD;
    expect(ratio).toBeGreaterThan(7);
    expect(ratio).toBeLessThan(9);
  });

  it("CIF includes auction price, fees, transport and shipping", () => {
    const result = calculateImportCost({
      auctionPrice: 4000,
      platform: "copart",
      stateCode: "FL",
      bodyType: "Sedan",
      exchangeRate: 7.75,
    });
    const expectedCIF = result.auctionPrice + result.platformFees.total + result.usaTransport + result.maritimeShipping;
    expect(result.cifValue).toBe(expectedCIF);
  });

  it("VAT is 12% of CIF + duties", () => {
    const result = calculateImportCost({
      auctionPrice: 4000,
      platform: "copart",
      stateCode: "FL",
      bodyType: "Sedan",
      exchangeRate: 7.75,
      customDutyRate: 0.20,
    });
    const expectedVAT = Math.round((result.cifValue + result.customsDuty) * 0.12);
    expect(result.vat).toBe(expectedVAT);
  });
});
