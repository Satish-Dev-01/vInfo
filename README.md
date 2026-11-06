# Vinfo Platform

An enterprise-grade, scalable web application architecture built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Zustand**. Engineered with clean architectural boundaries, bounded memory stores, decoupled business logic, and resilient API pipelines.

---

## 🚀 Key Architectural Features

- **Decoupled 3-Tier Architecture:** Strict separation between Presentation (`src/components`), Business Domain Logic (`src/services`), and Infrastructure (`src/lib`).
- **Bounded Memory Stores & Caching:** In-memory LRU cache (`MemoryCacheStore`) with TTL expiration to prevent Node.js memory leaks, coding against an abstract `ICacheStore` interface for seamless Redis/KV pluggability.
- **Global State Management:** Lightweight, selector-optimized **Zustand** store with localStorage persistence and SSR hydration safety.
- **Resilient API Client:** Built-in `AbortController` timeouts, automatic exponential backoff retries, and typed `ApiError` hierarchy.
- **Type-Safe Runtime Validation:** Boundary inputs and environment variables verified with **Zod** schemas.
- **Atomic UI System:** Accessible component primitives (Button, Card, Input, Badge, Skeleton) with modern styling and dark mode support.
- **Production Guardrails:** Strict TypeScript compilation, zero ESLint warnings, and structured logging.

---

## 📁 Directory Structure

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, Error Boundaries, API Routes)
│   ├── api/health/       # System health & telemetry API route
│   ├── error.tsx         # Route-level error boundary
│   ├── loading.tsx       # Suspense fallback skeleton UI
│   ├── not-found.tsx     # Custom 404 handler
│   ├── layout.tsx        # Root HTML, fonts, SEO metadata shell
│   └── page.tsx          # Interactive dashboard & telemetry showcase
├── components/
│   ├── ui/               # Atomic primitives (Button, Card, Input, Badge, Skeleton)
│   └── common/           # Shared widgets (Navbar, Footer, ErrorBoundary, StoreDemo)
├── config/
│   ├── env.ts            # Zod-validated environment config
│   └── site.ts           # Site navigation & metadata
├── hooks/                # React 19 hooks (useMounted, useDebounce, useLocalStorage, useMediaQuery, useHydratedStore)
├── lib/
│   ├── api/              # Resilient ApiClient with backoff retries & ApiError
│   ├── cache/            # Pluggable ICacheStore & Bounded Memory LRU Cache
│   ├── logger.ts         # Structured, environment-aware logger
│   ├── utils.ts          # Tailwind cn helper, formatters, async helpers
│   └── validators/       # Zod schemas for request validation & domain contracts
├── services/             # Domain & Business logic layer
│   ├── base.service.ts   # BaseService with declarative caching & logging
│   └── system.service.ts # System health & metrics domain service
├── stores/               # Zustand global state management
│   └── app.store.ts      # UI layout, modal queue, theme preferences slice
└── types/                # Core TypeScript interfaces & API response envelopes
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**, **pnpm**, or **yarn**

### 2. Installation
Clone the repository and install dependencies:

```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Vinfo Platform"
NEXT_PUBLIC_API_BASE_URL=/api
LOG_LEVEL=info
```

### 4. Development Server
Start the development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Builds and optimizes the app for production |
| `npm run start` | Runs the built production server |
| `npm run lint` | Runs ESLint and TypeScript code analysis |

---

## 🏛️ System Design & Architecture Standards

For detailed architectural principles, memory management strategies, caching layers, and extension guidelines, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📄 License
Private / Proprietary.
