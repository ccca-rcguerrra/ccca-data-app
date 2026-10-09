# Central de indicadores — plano de implementação (Indicadores + Estatísticas)

## Estado atual
- **Backend**: `api/semaspa/indicators` completo (summary, `:id/cases`, CSV, saved-filters CRUD, catálogo de 8 indicadores). Não há endpoints de estatísticas gerais.
- **Frontend**: `IndicatorsPage` (rota `/`) completa, com cards, rule panel, filtros, casos inline, saved-filters. Stack: React Router 7, TanStack Query, Zustand, shadcn (`tabs`, `dialog`), ECharts (`echarts-for-react`).
- Views `public_app`: `semaspa_autefs` (com `issue_year`/`issue_month`), `semaspa_forest_guides` (`issued_at`), `semaspa_autef_forest_guides` (ponte `autef_id ↔ forest_guide_id`).

## Decisões
- Filtros: **removidos** (e saved-filters descontinuados).
- Casos: **Dialog** centralizado.
- Escopo: **Indicadores + Estatísticas** (página inteira).
- Aba na URL: `?tab=indicadores|estatisticas`.
- Ano default do "por mês": último ano com dados.

---

## Backend

### A. Estatísticas (novo)
Controller/service no módulo semaspa, com SQL agregado nas views (mesmo padrão do `indicators.service`).

**Endpoints:**
1. `GET /api/semaspa/statistics/summary`
   ```ts
   { generatedAt, totals: { autefs, gfs, autefsSemGf, coveragePct },
     byYear: [{ year, autefs, gfs, autefsSemGf }] }
   ```
2. `GET /api/semaspa/statistics/by-month?year=2024`
   ```ts
   { year, months: [{ month, autefs, gfs, autefsSemGf }] }
   ```

**Queries:**
- AUTEFs: `COUNT(*) FROM semaspa_autefs`, agrupado por `issue_year`/`issue_month`.
- GFs: `COUNT(*) FROM semaspa_forest_guides`, agrupado por `EXTRACT(YEAR/MONTH FROM issued_at)`.
- AUTEF sem GF: `semaspa_autefs a` com `NOT EXISTS (semaspa_autef_forest_guides b WHERE b.autef_id = a.id)`, agrupado por ano/mês.
- `coveragePct = (autefs − autefsSemGf) / autefs`.

**Arquivos:** `statistics.controller.ts`, `statistics.service.ts`, `statistics.dto.ts`; registrar no `semaspa.module.ts`.

### B. Remoção de saved-filters
- Remover endpoints `saved-filters`, `indicator-saved-filters.service.ts`, `saved-filter.dto.ts` e a entidade `indicator-saved-filter.entity.ts` (verificar migração).

---

## Frontend

### 1. Estrutura de abas
- `IndicatorsPage` usa `Tabs` (radix): **Indicadores** (ativa) | **Estatísticas**.
- Aba controlada por URL (`?tab=`).
- Sem mudança de rota.

### 2. Aba Indicadores (redesign)
- Remover `indicator-filters.tsx` e `indicator-saved-filters.tsx`.
- Store/controller: remover estado de filtros e chaves de filtro do url-state; remover hooks/mutations de saved-filters.
- **Casos em Dialog**: novo `IndicatorCasesDialog` (shadcn `Dialog`) — título "Casos — <indicador>", reutiliza as 4 tabelas de casos com paginação; abre ao selecionar card.
- Query de casos só dispara com dialog aberto.

### 3. Aba Estatísticas (nova)
- Tipos em `types/semaspa.ts`.
- `statistics.service.ts` + hooks `useStatisticsSummaryQuery` / `useStatisticsByMonthQuery`.
- Componentes: `StatisticsOverview` (4 cards), `StatisticsByYear` (ECharts barras), `StatisticsByMonth` (tabela + seletor de ano).

---

## Arquivos

**Backend — novos:** `statistics.controller.ts`, `statistics.service.ts`, `statistics.dto.ts`.
**Backend — removidos:** saved-filters (service, dto, endpoints, entidade).

**Frontend — novos:** `statistics/statistics-tab.tsx`, `statistics/components/{overview,by-year,by-month}.tsx`, `indicator-cases-dialog.tsx`, `services/semaspa/statistics.service.ts`.
**Frontend — alterados:** `indicators-page.tsx`, `use-indicators-controller.ts`, `use-indicators-store.ts`, `indicator-url-state.ts`, `use-semaspa.ts`, `types/semaspa.ts`.
**Frontend — removidos:** `indicator-filters.tsx`, `indicator-saved-filters.tsx`.

---

## Ordem de implementação
1. Backend estatísticas (summary + by-month) + DTOs.
2. Frontend types + service + hooks.
3. Aba Estatísticas (overview, by-year, by-month).
4. Estrutura de abas na página.
5. Aba Indicadores: remover filtros + casos em dialog.
6. Cleanup saved-filters (front + back).
