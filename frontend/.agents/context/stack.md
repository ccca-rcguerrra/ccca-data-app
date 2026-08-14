# Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | ^18.3.1 | UI library |
| Build | Vite | ^6.3.5 | Dev server + bundler |
| Language | TypeScript | ~5.8.3 | Type checking (strict: false, verbatimModuleSyntax: true) |
| Styling | Tailwind CSS | ^4.1.13 | Utility-first CSS (v4, CSS-based config) |
| UI Kit | shadcn/ui | latest | Component primitives (new-york style, 28 components) |
| State | Zustand | ^5.0.5 | Client state with persist middleware |
| Server State | TanStack React Query | ^5.80.6 | Server state, caching, mutations |
| Routing | React Router | ^7.6.2 | createBrowserRouter, nested routes |
| HTTP | Axios | ^1.9.0 | HTTP client with interceptors |
| Real-time | Socket.io Client | ^4.8.3 | WebSocket connection |
| Forms | react-hook-form | ^7.65.0 | Form state management |
| Validation | zod | ^4.1.12 | Schema validation |
| i18n | i18next + react-i18next | ^25.2.1 | Internationalization |
| Maps | maplibre-gl | ^5.6.2 | Interactive maps |
| Charts | echarts + echarts-for-react | ^5.6.0 | Statistical charts |
| Drawing | terra-draw + adapter | ^1.20.0 | Map drawing tools |
| Icons | lucide-react | ^0.536.0 | Icon library |
| Toasts | sonner | ^2.0.7 | Toast notifications |
| Dates | date-fns | ^4.1.0 | Date manipulation |
| Numbers | numbro | ^2.5.0 | Number/currency formatting |
| Class merging | clsx + tailwind-merge | ^2.1.1 | cn() utility |

## Key Configurations

| Config | Value |
|--------|-------|
| Path alias | `@/` → `./src/` |
| Dev port | 4200 |
| API base | `VITE_API_BASE_URL` (default: `http://localhost:3000`) |
| Prettier | semicolons, single quotes, 80 width, trailing commas ES5 |
| ESLint | Flat config (v9), import order (alphabetical descending, newlines between groups) |
| CSS | Tailwind v4 (`@theme` inline), `&:is(.dark *)` dark mode variant |
