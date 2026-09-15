import { describe, it, expect } from "vitest";
import { parsePagination, MAX_PAGE_SIZE } from "@/lib/pagination";

// Helper: build the URLSearchParams the route handlers pass in.
const params = (obj) => new URLSearchParams(obj);

describe("parsePagination — defaults", () => {
  it("falls back to page 1 and the caller's default limit when nothing is supplied", () => {
    expect(parsePagination(params({}), { defaultLimit: 5 })).toEqual({ page: 1, limit: 5, skip: 0 });
  });

  it("ignores non-numeric junk", () => {
    expect(parsePagination(params({ page: "abc", limit: "xyz" }), { defaultLimit: 10 })).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("computes skip from page and limit", () => {
    expect(parsePagination(params({ page: "3", limit: "10" }))).toEqual({ page: 3, limit: 10, skip: 20 });
  });
});

describe("parsePagination — limit is clamped (was unbounded)", () => {
  it("caps an oversized limit at the max", () => {
    expect(parsePagination(params({ limit: "100000" })).limit).toBe(MAX_PAGE_SIZE);
  });

  it("respects a caller-supplied lower max", () => {
    expect(parsePagination(params({ limit: "40" }), { maxLimit: 20 }).limit).toBe(20);
  });

  it("rejects zero and negative limits in favour of the default", () => {
    expect(parsePagination(params({ limit: "0" }), { defaultLimit: 10 }).limit).toBe(10);
    expect(parsePagination(params({ limit: "-5" }), { defaultLimit: 10 }).limit).toBe(10);
  });
});

describe("parsePagination — skip can never go negative", () => {
  // A negative skip makes MongoDB throw, which turned `?page=-1` into a 500.
  it.each(["0", "-1", "-999"])("clamps page=%s to 1", (page) => {
    const { page: p, skip } = parsePagination(params({ page, limit: "10" }));
    expect(p).toBe(1);
    expect(skip).toBe(0);
  });

  it("never returns a negative skip for any input", () => {
    for (const page of ["-50", "0", "1", "7", "abc", ""]) {
      expect(parsePagination(params({ page, limit: "5" })).skip).toBeGreaterThanOrEqual(0);
    }
  });
});
