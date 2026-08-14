# Project Map

> One-line directory descriptions. Use this as an index to know where to create or edit files.

```
src/
├── app.tsx              → App entry: provider hierarchy (Query → WS → Theme → Router)
├── main.tsx             → React root, StrictMode in dev only
├── routes.tsx           → createBrowserRouter, public + protected routes
├── navigation.ts        → Sidebar menu items (permission-gated, feature-gated)
│
├── pages/               → Route-level pages (see rules/pages.md for pattern)
│   ├── auth/            → Login, forgot-password, reset-password
│   ├── dashboard/       → Welcome landing page
│   ├── users/management/ → User CRUD (list, create, edit, delete)
│   └── teams/management/ → Team CRUD (list, create, edit, delete)
│
├── components/          → Reusable components (shared across pages)
│   ├── layout/main/     → App shell: sidebar, header, sub-header
│   ├── layout/blank/    → Blank layout (no sidebar)
│   ├── ui/shadcn/       → shadcn/ui primitives (28 components)
│   ├── map/             → MapLibre GL: layers, drawing controls, popups
│   └── comments/        → Generic comment thread by channel
│
├── stores/              → Global Zustand stores
│   ├── auth-store.ts    → User session + tokens (persisted)
│   ├── settings-store.ts → Theme, language, sidebar (persisted)
│   └── app-store.ts     → Transient UI state (loading, error, view)
│
├── services/            → Static API classes (see rules/services.md)
│   ├── api.ts           → Axios instance with auth interceptors
│   ├── storage/         → localStorage abstraction (single entry point)
│   ├── auth/            → Login, me, forgot/reset password
│   ├── users/           → User CRUD + online users
│   ├── teams/           → Team CRUD
│   ├── territories/     → Territory queries
│   ├── comments/        → Comments by channel
│   ├── notifications/   → Notifications CRUD
│   ├── gee/             → Google Earth Engine (Sentinel imagery)
│   ├── app-config/      → Per-initiative configuration
│   └── websocket/       → WebSocket event constants + payload types
│
├── hooks/               → Custom hooks
│   ├── api/             → React Query hooks (one file per domain)
│   ├── websocket/       → Socket.io connection + event listeners
│   ├── use-permissions.ts    → can(), canAny(), canAll()
│   ├── use-language-sync.ts  → Sync i18n language with store
│   ├── use-document-title.ts → Set browser tab title
│   └── use-mobile.ts         → Media query hook
│
├── providers/           → React context providers
│   ├── query-provider.tsx      → React Query client + devtools
│   ├── theme-provider.tsx      → Light/dark class on <html>
│   └── websocket-provider.tsx  → Socket.io connection lifecycle
│
├── types/               → TypeScript interfaces (one file per domain)
│   ├── api/index.ts     → ApiResponse<T>, ApiPaginatedResponse<T>
│   ├── auth.ts          → AuthUser, AuthTokens, LoginPayload
│   ├── users.ts         → User, UsersListParams, CreateUserDto
│   ├── teams.ts         → Team, CreateTeam, UpdateTeam
│   ├── territories.ts   → Territory
│   ├── comments.ts      → Comment, CreateCommentPayload
│   ├── notifications.ts → AppNotification, NotificationData
│   ├── app-config.ts    → AppConfig, InitiativePublicMetadata
│   ├── settings.ts      → AppSettings, ProcessingControlsMode
│   ├── dates.ts         → ISODate, ISODateTime
│   └── sidebar.ts       → MenuItem
│
├── constants/           → Constants (avoid magic values in components)
│   ├── config.ts        → APP_CONFIG (API_BASE_URL, timeout)
│   ├── routes.constants.ts      → ROUTES object, toChildPath()
│   ├── permissions.ts            → PERMISSIONS enum
│   ├── role-permissions.ts       → ROLE_PERMISSIONS mapping
│   ├── query-keys.constants.ts   → QUERY_KEYS factory functions
│   └── storage.constants.ts      → STORAGE_KEYS, storageKey()
│
├── i18n/
│   ├── index.ts         → i18next init with resource loading
│   ├── supported-locales.ts → Locale list + normalize functions
│   └── locales/         → JSON translation files (en-US.json)
│
├── lib/                 → Generic utilities
│   ├── utils.ts         → cn() for Tailwind class merging
│   └── maps/            → Base map definitions, bounds utilities
│
├── utils/               → Domain-specific utilities
│   ├── date.ts          → ISO date parsing/formatting (date-fns)
│   ├── geojson.ts       → GeoJSON helpers
│   ├── mentions.ts      → @mention parsing utilities
│   ├── numbro.ts        → Number/currency formatting defaults
│   └── download.ts      → downloadBlob() helper
│
├── helpers/             → Placeholder for future helpers
└── styles/globals.css   → Tailwind v4 theme + CSS custom properties
```
