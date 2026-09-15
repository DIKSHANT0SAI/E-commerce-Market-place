import { describe, it, expect } from "vitest";
import { parseAdminEmails } from "@/lib/adminEmails";

describe("parseAdminEmails (ADMIN_EMAILS allowlist parsing)", () => {
  it("splits a comma-separated list", () => {
    expect(parseAdminEmails("a@x.com,b@y.com")).toEqual(["a@x.com", "b@y.com"]);
  });

  it("trims spaces and lowercases (matching is case-insensitive)", () => {
    expect(parseAdminEmails("  Admin@X.com , B@Y.com ")).toEqual([
      "admin@x.com",
      "b@y.com",
    ]);
  });

  it("ignores empty entries / trailing commas", () => {
    expect(parseAdminEmails("a@x.com,,")).toEqual(["a@x.com"]);
  });

  it("returns an empty list when unset or empty (fail-closed: nobody is admin)", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails("   ")).toEqual([]);
  });
});
