# Architecture & System Design Standards

## 1. Overview
The **Vinfo Platform** follows a decoupled, 3-tier enterprise architecture built on Next.js, React, TypeScript, and Tailwind CSS. The design prioritizes **scalability**, **system flexibility**, and **bounded resource utilization**.

---

## 2. Directory Structure Conventions

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, Error Boundaries, API Routes)
│   ├── api/              # API Route Handlers (Stateless, validated endpoints)
│   ├── error.tsx         # Global route error boundary
│   ├── loading.tsx       # Suspense fallback skeleton UI
│   ├── not-found.tsx     # 404 handler
│   ├── layout.tsx        # Root HTML & metadata shell
│   └── page.tsx          # Home page / dashboard entry
├── components/           # UI Components
│   ├── common/           # Shared layout widgets (Navbar, Footer, ErrorBoundary)
│   └── ui/               # Atomic reusable primitives (Button, Card, Input, Badge, Skeleton)
├── config/               # Application configuration & validated environment schemas
│   ├── env.ts            # Zod-validated environment config
│   └── site.ts           # Site navigation & metadata
├── hooks/                # Reusable React hooks (useMounted, useDebounce, useLocalStorage, useMediaQuery)
├── lib/                  # Core Utilities & Infrastructure
│   ├── api/              # Resilient ApiClient with backoff retries and ApiError classes
│   ├── cache/            # Abstract ICacheStore with bounded MemoryCacheStore & Redis readiness
│   ├── logger.ts         # Structured, environment-aware logger
│   ├── utils.ts          # Tailwind cn helper, formatting, async helpers
│   └── validators/       # Zod schemas for request validation & domain contracts
├── services/             # Domain & Business Logic layer
│   ├── base.service.ts   # Base service with declarative caching & logging hooks
│   └── system.service.ts # System telemetry & domain services
└── types/                # Core TypeScript interfaces & API response contracts
```

---

## 3. Core Architectural Tenets

### A. Memory Stores & Resource Safety
* **Bounded LRU Cache (`MemoryCacheStore`):** In-memory data structures are capped with configurable `maxEntries` and TTL expiration. When limits are reached, the least recently used keys are evicted, preventing memory exhaustion and memory leaks in server environments.
* **Pluggable Interface (`ICacheStore`):** Business logic and domain services code against `ICacheStore`. Switching from local memory to distributed Redis, Memcached, or Edge KV requires zero domain code changes.

### B. Global Client State Management (Zustand)
* **Lightweight & Modular (`src/stores/app.store.ts`):** Client-side global UI state (sidebar, active modals, theme preferences, notification queues) is managed via Zustand.
* **Granular Selectors:** Prevents unnecessary re-renders across the component tree by subscribing components only to the specific state slice they consume.
* **SSR Hydration Protection (`useHydratedStore`):** Uses custom hydration synchronization to prevent Next.js SSR hydration mismatches when using `persist` middleware with `localStorage`.
* **Framework-Agnostic Access:** Zustand stores can be read and mutated outside React components (e.g., in service classes and API interceptors).

### C. Scalable Business Logic Layer
* **Decoupled Services (`src/services/`):** Business rules, third-party integrations, and data mutations are strictly isolated in service classes extending `BaseService`.
* **Stateless API Routes:** API endpoints (`/app/api/*`) act purely as transport controllers that validate request payloads via Zod, invoke domain services, and return standardized `ApiResponse<T>` envelopes.

### C. Resilient Network & API Client
* **Retry with Exponential Backoff:** `ApiClient` handles transient network blips automatically.
* **Explicit Timeout Controls:** All HTTP requests use `AbortController` timeouts to avoid hanging connections.
* **Standardized Error Handling:** Typed `ApiError` hierarchy ensures predictable error propagation.

### D. Strong Type Safety & Runtime Validation
* **Zod Contracts:** Boundary inputs (environment variables, user query strings, external payloads) are validated at runtime before touching business logic.
* **Unified Envelopes:** All responses follow `ApiResponse<T>` and `ApiErrorResponse` interfaces.

---

## 4. Developer Workflows

* **Start Development:** `npm run dev`
* **Build Production Bundle:** `npm run build`
* **Linting:** `npm run lint`
