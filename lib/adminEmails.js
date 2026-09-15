// Pure helpers for the admin allowlist — kept Clerk-free so they're trivial to unit-test.

// Turn a raw "a@x.com, B@Y.com" string into a clean lowercase list. Trims spaces,
// lowercases (so matching is case-insensitive), and drops empty entries.
export function parseAdminEmails(raw) {
  return (raw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Reads the allowlist from the environment (ADMIN_EMAILS). Empty/unset → [] (fail-closed).
export function getAdminEmails() {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}
