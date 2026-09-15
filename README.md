# 🛒 QuickCart — Full-Stack E-Commerce Platform

[![CI](https://github.com/Nitin75408/E-commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/Nitin75408/E-commerce/actions/workflows/ci.yml)

A production-style, multi-role e-commerce marketplace built with **Next.js 15 (App Router)**. It goes well beyond a CRUD demo: **secure online payments** with server-side cart locking, **role-based access control** (buyer / seller / delivery / admin), a **self-service seller onboarding with admin approval**, an **own-fleet delivery system**, **order-status tracking**, **event-driven emails**, **Redis rate-limiting & caching**, and a **CI pipeline with unit tests**.

🔗 **Live demo:** https://e-commerce-lovat-ten-78.vercel.app/

---

## ✨ Highlights (the engineering, not just the screens)

- 💳 **Razorpay payments (COD + online) — hardened.** The server computes the price from the database (never trusts the client), **locks the priced cart server-side** before payment, and verifies the **HMAC-SHA256 signature** in constant time. The order is created **only** from the server-stored cart — so a user can't pay for a cheap cart and swap in an expensive one.
- 🔁 **Idempotent orders.** Double-clicks, network retries, and replayed webhooks can't create duplicate orders — enforced atomically by **partial unique indexes** (Razorpay order id for online, a client key for COD).
- 🔐 **Role-based access control (RBAC).** Four roles gated at the **middleware** *and* API layers, fail-closed by default.
- 🧾 **Self-service seller onboarding → admin approval.** Users apply to sell; an admin approves, which is the *only* code path that grants the seller role.
- 🚚 **Own-fleet delivery.** Sellers assign orders to delivery agents who get a scoped portal to update delivery status.
- 📦 **Live order tracking.** A Flipkart-style status timeline that **auto-updates without a refresh** as the seller/delivery agent advances the order — using visibility-aware polling that pauses on hidden tabs and stops once the order is delivered/cancelled.
- ⚡ **Built for scale.** Upstash Redis rate-limiting + caching, a warm MongoDB connection pool, compound/text/partial indexes, paginated + viewport-batched lists, and CDN cache headers.
- ✅ **Tested & CI'd.** Vitest unit tests on the money math and auth logic, run automatically on every push via GitHub Actions.

---

## 🧰 Tech Stack

| Area | Tech |
|------|------|
| **Framework** | Next.js 15.5 (App Router, Turbopack), React 19 |
| **State** | Redux Toolkit + redux-persist |
| **Database** | MongoDB + Mongoose 8 |
| **Auth & RBAC** | Clerk (`publicMetadata.role` + email allowlist) |
| **Payments** | Razorpay (Checkout + server-side verification) |
| **Background jobs / events** | Inngest |
| **Email** | Resend |
| **Media** | Cloudinary |
| **Rate-limit & cache** | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| **AI** | Google Generative AI (product description generation) |
| **Charts** | Chart.js + react-chartjs-2 |
| **Styling** | Tailwind CSS |
| **Testing / CI** | Vitest + GitHub Actions |

---

## 👥 Roles & Features

### 🛍️ Buyer (default)
- Browse with search (debounced, text-indexed), category/price filters, and pagination.
- Product pages with images, reviews, and AI-assisted descriptions.
- Persistent cart (saved to DB + redux-persist) with a **live navbar count badge** and a bottom-center "added to cart" toast.
- Checkout via **Cash on Delivery** or **Razorpay online payment**.
- **Live order tracking** page — the status timeline updates automatically (no refresh) while the order is in progress, with a toast when the status changes; plus full order history.
- Reviews & ratings; "notify me" emails when out-of-stock items return.
- Saved shipping addresses.

### 🏪 Seller
- Dashboard with revenue/orders analytics and charts.
- Product CRUD (Cloudinary image upload, activate/deactivate, units-sold).
- View & manage orders for their products; update order status.
- Assign orders to delivery agents.

### 🚚 Delivery agent
- Scoped delivery portal showing only assigned orders.
- Update delivery status (Shipped → Out for Delivery → Delivered).

### 🛡️ Admin
- Review **seller applications** and approve/reject them.
- Approval grants the Clerk seller role (the single source of role writes).

### 🔑 How someone becomes each role
| Role | How |
|------|-----|
| Buyer | Default on sign-up |
| Seller | Apply at `/become-seller` → admin approves at `/admin/seller-applications` |
| Delivery | Assigned by an admin in Clerk (`publicMetadata.role = "delivery"`) |
| Admin | Email listed in the `ADMIN_EMAILS` allowlist |

---

## 🔒 Security & Correctness (interview-ready details)

- **Payment integrity:** `/api/payment/create-order` prices the cart from DB values and persists a short-lived `PaymentIntent` (TTL 1h). `/api/payment/verify` checks the Razorpay signature with `crypto.timingSafeEqual` and builds the order **only** from that stored intent — the client never gets to dictate items or amount after paying.
- **Idempotency:** unique partial indexes on `Order.razorpayOrderId` and `Order.idempotencyKey`, plus duplicate-key catches, guarantee **one order per intent** even under concurrent requests.
- **RBAC everywhere:** `middleware.js` gates `/seller`, `/delivery`, `/admin`; every privileged API independently re-checks `authSeller` / `authDelivery` / `authAdmin`. All are **fail-closed** (deny if unconfigured).
- **Input validation** on all write endpoints; server is the source of truth for prices and totals.
- **Rate limiting** on API routes via Upstash (no-op/fail-open when not configured, so local dev still works).

## ⚡ Performance

- **Warm MongoDB pool** (`minPoolSize`) to avoid cold-reconnect latency spikes; capped `maxPoolSize`.
- **Smart indexes:** compound (`category+date`, `offerPrice+date`), a **text index** for search, partial unique indexes for idempotency, and `estimatedDocumentCount` for O(1) unfiltered counts.
- **Lean queries** + pagination + viewport batching on product/order lists.
- **CDN cache headers** (`s-maxage`, `stale-while-revalidate`) on the product list.
- **Redis caching layer** (fail-open) and Next.js Image optimization + code splitting.

## 🔄 Event-Driven (Inngest)

- `order.confirmation` → Resend email with a **full tax breakdown** (subtotal / tax / shipping / total) that always reconciles to what was charged.
- Clerk `user.created/updated/deleted` → sync user records.
- `review/added` → notify the seller.
- `product.activated` → email everyone who asked to be notified.
- Scheduled cleanup of stale data.

---

## 🗂️ Project Structure

```
E-commerce/
├── app/
│   ├── api/                       # Route handlers (REST-style)
│   │   ├── payment/               # create-order, verify (Razorpay)
│   │   ├── seller/                # apply, application, analytics
│   │   ├── admin/                 # seller-applications, review
│   │   ├── delivery/              # agents, orders, update-status
│   │   ├── order/ product/ review/ cart/ user/
│   │   └── inngest/               # Inngest entrypoint
│   ├── become-seller/             # Seller onboarding form
│   ├── admin/seller-applications/ # Admin approval UI
│   ├── delivery/                  # Delivery agent portal
│   ├── order/[id]/                # Order status timeline
│   ├── seller/                    # Add product, dashboard, orders, product-list
│   ├── cart/ my-orders/ product/[id]/ all-products/
│   ├── redux/                     # Store, slices, selectors
│   └── customhooks/               # Data-fetching hooks
├── components/                    # UI (Navbar, OrderSummary, ...)
├── models/                        # Mongoose schemas
│   ├── Order.js PaymentIntent.js SellerApplication.js
│   ├── Product.js Review.js NotifyMe.js user.js address.js
├── lib/                           # pricing, createOrder, auth*, ratelimit, cache, adminEmails
├── config/                        # db.js (Mongo), inngest.js
├── tests/                         # Vitest unit tests
└── .github/workflows/ci.yml       # CI: lint + test
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ (20 recommended)
- MongoDB (Atlas works great)
- Accounts: **Clerk**, **Razorpay** (test mode), **Resend**, **Cloudinary**, and optionally **Upstash Redis** + **Google AI**

### Setup
```bash
git clone https://github.com/Nitin75408/E-commerce.git
cd E-commerce
npm install
```

Create a **`.env`** in the project root (Next.js loads it only from the root — not from subfolders). See **`.env.example`** for the full list:

```env
# Database & auth
MONGODB_URI=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# Payments (Razorpay test mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Email, media, AI
RESEND_API_KEY=...
RESEND_FROM_EMAIL=orders@yourdomain.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_API_KEY=...

# Performance (optional — features fail-open if unset)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Admin allowlist (who can approve seller applications)
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_ADMIN_EMAILS=you@example.com

# Misc
NEXT_PUBLIC_CURRENCY=₹
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> For online payments, also allow your IP (or `0.0.0.0/0`) in MongoDB Atlas → Network Access, and configure the Clerk session token to include `metadata` for the fast role-check path.

### Run
```bash
npm run dev     # start the app at http://localhost:3000
```

---

## 🧪 Testing & CI

```bash
npm test          # run all unit tests once
npm run test:watch  # re-run on change while developing
```

38 unit tests (Vitest) cover the logic where a bug is most expensive:

| Module | What's covered |
|---|---|
| `lib/pricing.js` | tax/total math, and that the email breakdown always reconciles to the exact amount charged |
| `lib/adminEmails.js` | allowlist parsing, including the fail-closed guarantee (unset ⇒ nobody is admin) |
| `lib/pagination.js` | `limit` is clamped, and `skip` can never go negative (a negative skip made MongoDB throw, turning `?page=-1` into a 500) |
| `lib/productValidation.js` | positive prices, offer ≤ list price, required fields — shared by the product create **and** update routes so they can't drift |

Each was deliberately extracted into a **pure, dependency-free module** so it can be tested without a DB, secrets, or a browser.

**CI:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint + tests on every push and pull request to `main` (the badge above reflects the latest run).

---

## 🔮 Future Enhancements

- Migrate to **TypeScript** for end-to-end type safety.
- **Real-time** order/delivery updates (WebSockets / SSE).
- Component + E2E tests (Testing Library / Playwright).
- Wishlist, coupons, and multi-seller cart splitting.
- Add a CI **build** job (with secrets) on top of lint + test.

---

**Built with ❤️ using Next.js 15, MongoDB, Clerk, Razorpay, Inngest, and modern web tooling.**
