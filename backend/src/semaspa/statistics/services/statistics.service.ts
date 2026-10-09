import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import {
  GeneralStatisticsByMonthResponseDto,
  GeneralStatisticsSummaryResponseDto,
} from '../dto/statistics.dto';

interface YearRow {
  year: number;
  autefs: number;
  gfs: number;
  autefsSemGf: number;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(SemaspaAutef)
    private readonly autefRepo: Repository<SemaspaAutef>,
  ) {}

  async getSummary(): Promise<GeneralStatisticsSummaryResponseDto> {
    const generatedAt = new Date().toISOString();
    const manager = this.autefRepo.manager;

    const [totalsRow] = await manager.query(`
      SELECT
        (SELECT COUNT(*)::int FROM public_app.semaspa_autefs) AS autefs,
        (SELECT COUNT(*)::int FROM public_app.semaspa_forest_guides) AS gfs,
        (SELECT COUNT(*)::int FROM public_app.semaspa_autefs a
          WHERE NOT EXISTS (
            SELECT 1 FROM public_app.semaspa_autef_forest_guides b
            WHERE b.autef_id = a.id
          )
        ) AS autefs_sem_gf
    `);

    const [autefByYear, gfByYear, semGfByYear] = await Promise.all([
      manager.query(`
        SELECT issue_year AS year, COUNT(*)::int AS autefs
        FROM public_app.semaspa_autefs
        WHERE issue_year IS NOT NULL
        GROUP BY issue_year
      `),
      manager.query(`
        SELECT EXTRACT(YEAR FROM issued_at)::int AS year, COUNT(*)::int AS gfs
        FROM public_app.semaspa_forest_guides
        WHERE issued_at IS NOT NULL
        GROUP BY 1
      `),
      manager.query(`
        SELECT a.issue_year AS year, COUNT(*)::int AS autefs_sem_gf
        FROM public_app.semaspa_autefs a
        WHERE a.issue_year IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM public_app.semaspa_autef_forest_guides b
            WHERE b.autef_id = a.id
          )
        GROUP BY a.issue_year
      `),
    ]);

    const byYearMap = new Map<number, YearRow>();
    const ensure = (year: number): YearRow => {
      let row = byYearMap.get(year);
      if (!row) {
        row = { year, autefs: 0, gfs: 0, autefsSemGf: 0 };
        byYearMap.set(year, row);
      }
      return row;
    };

    for (const row of autefByYear) ensure(Number(row.year)).autefs = Number(row.autefs);
    for (const row of gfByYear) ensure(Number(row.year)).gfs = Number(row.gfs);
    for (const row of semGfByYear) ensure(Number(row.year)).autefsSemGf = Number(row.autefs_sem_gf);

    const byYear = [...byYearMap.values()].sort((a, b) => a.year - b.year);

    const autefs = Number(totalsRow.autefs ?? 0);
    const gfs = Number(totalsRow.gfs ?? 0);
    const autefsSemGf = Number(totalsRow.autefs_sem_gf ?? 0);
    const coveragePct =
      autefs > 0 ? Math.round(((autefs - autefsSemGf) / autefs) * 1000) / 10 : 0;

    return {
      generatedAt,
      totals: { autefs, gfs, autefsSemGf, coveragePct },
      byYear,
    };
  }

  async getByMonth(year: number): Promise<GeneralStatisticsByMonthResponseDto> {
    const manager = this.autefRepo.manager;

    const [autefByMonth, gfByMonth, semGfByMonth] = await Promise.all([
      manager.query(
        `
        SELECT issue_month AS month, COUNT(*)::int AS autefs
        FROM public_app.semaspa_autefs
        WHERE issue_year = $1
        GROUP BY issue_month
      `,
        [year],
      ),
      manager.query(
        `
        SELECT EXTRACT(MONTH FROM issued_at)::int AS month, COUNT(*)::int AS gfs
        FROM public_app.semaspa_forest_guides
        WHERE EXTRACT(YEAR FROM issued_at) = $1
        GROUP BY 1
      `,
        [year],
      ),
      manager.query(
        `
        SELECT a.issue_month AS month, COUNT(*)::int AS autefs_sem_gf
        FROM public_app.semaspa_autefs a
        WHERE a.issue_year = $1
          AND NOT EXISTS (
            SELECT 1 FROM public_app.semaspa_autef_forest_guides b
            WHERE b.autef_id = a.id
          )
        GROUP BY a.issue_month
      `,
        [year],
      ),
    ]);

    const byMonthMap = new Map<number, { autefs: number; gfs: number; autefsSemGf: number }>();
    const ensure = (month: number) => {
      let row = byMonthMap.get(month);
      if (!row) {
        row = { autefs: 0, gfs: 0, autefsSemGf: 0 };
        byMonthMap.set(month, row);
      }
      return row;
    };

    for (const row of autefByMonth) ensure(Number(row.month)).autefs = Number(row.autefs);
    for (const row of gfByMonth) ensure(Number(row.month)).gfs = Number(row.gfs);
    for (const row of semGfByMonth) ensure(Number(row.month)).autefsSemGf = Number(row.autefs_sem_gf);

    const months = [...byMonthMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([month, values]) => ({ month, ...values }));

    return { year, months };
  }
}
