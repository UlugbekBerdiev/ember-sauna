import { describe, expect, it } from "vitest";
import {
  addressFromEsri,
  formatPostalAddress,
  isCompletePostal,
  normalizeQuery,
  parseManualAddress,
  suggestionsFromEsri,
} from "./address-suggest";

describe("address suggestions", () => {
  it("keeps single street suggestions and skips grouped results", () => {
    expect(suggestionsFromEsri({
      suggestions: [
        { text: "26100 Ridge Rd, Damascus, MD, 20872, USA", magicKey: "abc123==", isCollection: false },
        { text: "Damascus", magicKey: "grouped12", isCollection: true },
        { text: "short", magicKey: "x", isCollection: false },
      ],
    })).toEqual([
      { id: "abc123==", label: "26100 Ridge Rd, Damascus, MD, 20872, USA" },
    ]);
  });

  it("reads the street, city, state, and ZIP from a resolved candidate", () => {
    expect(addressFromEsri({
      candidates: [{
        attributes: {
          StAddr: "26100 Ridge Rd",
          City: "Damascus",
          RegionAbbr: "md",
          Postal: "208721234",
          Addr_type: "StreetAddress",
        },
      }],
    })).toEqual({
      address: "26100 Ridge Rd",
      city: "Damascus",
      state: "MD",
      zip: "20872-1234",
    });
  });

  it("rejects a place that has no street", () => {
    expect(addressFromEsri({
      candidates: [{ attributes: { City: "Damascus", RegionAbbr: "MD", Postal: "20872" } }],
    })).toBeNull();
  });

  it("parses one typed line into the delivery parts", () => {
    const address = {
      address: "26100 Ridge Rd",
      city: "Damascus",
      state: "MD",
      zip: "20872",
    };
    expect(parseManualAddress("26100 Ridge Rd, Damascus, MD 20872")).toEqual(address);
    expect(parseManualAddress("26100 Ridge Rd, Damascus, Maryland, 20872, USA")).toEqual(address);
    expect(formatPostalAddress(address)).toBe("26100 Ridge Rd, Damascus, MD 20872");
    expect(isCompletePostal(address)).toBe(true);
  });

  it("rejects an incomplete line and a query that is too short", () => {
    expect(parseManualAddress("26100 Ridge Rd, Damascus")).toBeNull();
    expect(parseManualAddress("12, Damascus, MD 20872")).toBeNull();
    expect(normalizeQuery("  12 ")).toBeNull();
    expect(normalizeQuery("26100 Ridge")).toBe("26100 Ridge");
  });
});
