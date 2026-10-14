import { describe, it, expect } from "vitest";
import { filterItems, defaultFilters, itemInputSchema, recoveryRate, type Item } from "./items";

const base = (p: Partial<Item>): Item => ({
  id: "x", title: "Thing", description: "desc", category: "Other", location: "Gym", dateOccurred: "2026-01-01",
  image: null, type: "lost", status: "lost", contactInstructions: "desk", createdAt: "2026-01-01T00:00:00Z", updatedAt: "", ...p,
});

describe("filterItems", () => {
  const items = [
    base({ id: "a", title: "Water bottle", category: "Water Bottles", location: "Library", status: "found", createdAt: "2026-01-02" }),
    base({ id: "b", title: "Calculator", description: "graphing", category: "Electronics", location: "Library", status: "lost", createdAt: "2026-01-03" }),
    base({ id: "c", title: "Keys", category: "Accessories", location: "Gym", status: "returned", createdAt: "2026-01-01" }),
  ];
  it("searches description, location and category", () => {
    expect(filterItems(items, { ...defaultFilters, q: "graphing" }).map((i) => i.id)).toEqual(["b"]);
    expect(filterItems(items, { ...defaultFilters, q: "gym" }).map((i) => i.id)).toEqual(["c"]);
    expect(filterItems(items, { ...defaultFilters, q: "electronics" }).map((i) => i.id)).toEqual(["b"]);
  });
  it("combines filters with search", () => {
    expect(filterItems(items, { ...defaultFilters, location: "Library", status: "found" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterItems(items, { ...defaultFilters, location: "Library", q: "keys" })).toEqual([]);
  });
  it("sorts newest and oldest", () => {
    expect(filterItems(items, defaultFilters).map((i) => i.id)).toEqual(["b", "a", "c"]);
    expect(filterItems(items, { ...defaultFilters, sort: "oldest" }).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });
});

describe("validation", () => {
  it("rejects missing required fields", () => {
    const r = itemInputSchema.safeParse({ title: "", description: "", category: "", location: "", dateOccurred: "", image: null, type: "", contactInstructions: "" });
    expect(r.success).toBe(false);
  });
  it("accepts a valid input", () => {
    const r = itemInputSchema.safeParse({ title: "Blue bottle", description: "Navy blue water bottle with stickers", category: "Water Bottles", location: "Library", dateOccurred: "2026-01-01", image: null, type: "lost", contactInstructions: "Hand to library desk" });
    expect(r.success).toBe(true);
  });
  it("rejects future dates", () => {
    const r = itemInputSchema.safeParse({ title: "Keys", description: "Red lanyard with three keys", category: "Accessories", location: "Gym", dateOccurred: "2099-01-01", image: null, type: "lost", contactInstructions: "Gym desk" });
    expect(r.success).toBe(false);
  });
});

describe("recoveryRate", () => {
  it("returns 0 when no lost items exist", () => {
    expect(recoveryRate([base({ type: "found", status: "found" })])).toBe(0);
  });
  it("calculates percentage of lost items returned", () => {
    const items = [
      base({ id: "1", type: "lost", status: "lost" }),
      base({ id: "2", type: "lost", status: "returned" }),
      base({ id: "3", type: "lost", status: "returned" }),
      base({ id: "4", type: "lost", status: "returned" }),
      base({ id: "5", type: "lost", status: "returned" }),
    ];
    expect(recoveryRate(items)).toBe(80);
  });
  it("ignores found items in the calculation", () => {
    const items = [
      base({ id: "1", type: "lost", status: "returned" }),
      base({ id: "2", type: "lost", status: "lost" }),
      base({ id: "3", type: "found", status: "found" }),
      base({ id: "4", type: "found", status: "returned" }),
    ];
    expect(recoveryRate(items)).toBe(50);
  });
});
