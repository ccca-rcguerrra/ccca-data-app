import type {
  GeneralStatisticsByMonth,
  GeneralStatisticsSummary,
} from '@/types/semaspa';
import { api } from '@/services/api';

export class StatisticsService {
  private static readonly BASE_URL = '/api/semaspa/statistics';

  static async getSummary(): Promise<GeneralStatisticsSummary> {
    const response = await api.get<GeneralStatisticsSummary>(
      `${StatisticsService.BASE_URL}/summary`,
    );
    return response.data;
  }

  static async getByMonth(year: number): Promise<GeneralStatisticsByMonth> {
    const response = await api.get<GeneralStatisticsByMonth>(
      `${StatisticsService.BASE_URL}/by-month`,
      { params: { year } },
    );
    return response.data;
  }
}
