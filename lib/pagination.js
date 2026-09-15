// Shared, clamped pagination parsing for list endpoints.
//
// Guards two things the raw `parseInt` calls didn't:
//  - `limit` was unbounded, so `?limit=100000` could pull an entire collection.
//  - `page` could be 0 or negative, making `skip` negative — which MongoDB rejects,
//    turning a malformed query string into a 500.
export const MAX_PAGE_SIZE = 50;

export function parsePagination(searchParams, { defaultLimit = 10, maxLimit = MAX_PAGE_SIZE } = {}) {
  const rawPage = parseInt(searchParams.get("page"), 10);
  const rawLimit = parseInt(searchParams.get("limit"), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}
