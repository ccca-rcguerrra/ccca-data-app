import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EtlContadores {
  encontrados: number;
  jaExistentes: number;
  aguardando: number;
  emAndamento: number;
  gravados: number;
  falhas: number;
  semPdf: number;
}

export interface EtlDocumento {
  identificacao: string;
  etapa: string | null;
  resultado: string;
  mensagem: string | null;
}

export interface EtlRun {
  taskId: string;
  base: string | null;
  filtros: Record<string, unknown>;
  solicitante: Record<string, unknown> | null;
  status: string;
  inicioEm: string | null;
  concluidoEm: string | null;
  contadores: EtlContadores;
  documentos?: EtlDocumento[];
}

export interface EtlListResponse {
  runs: EtlRun[];
  total: number;
}

export interface EtlCancelResult {
  taskId: string;
  revoked: number;
  total: number;
}

export interface CreateEtlRunInput {
  base: string;
  filtros: Record<string, unknown>;
  solicitante: Record<string, unknown>;
  pageStart?: number;
  pageEnd?: number;
  forceRestart?: boolean;
  limit?: number;
}

interface RawRun {
  task_id: string;
  base: string | null;
  filtros: Record<string, unknown>;
  solicitante: Record<string, unknown> | null;
  status: string;
  inicio_em: string | null;
  concluido_em: string | null;
  contadores: Record<string, number>;
  documentos?: Array<Record<string, unknown>>;
}

@Injectable()
export class EtlClient {
  private readonly logger = new Logger(EtlClient.name);

  constructor(private readonly httpService: HttpService) {}

  async createRun(input: CreateEtlRunInput): Promise<EtlRun> {
    const { data } = await this.request<RawRun>('post', '/runs', {
      base: input.base,
      filtros: input.filtros ?? {},
      solicitante: input.solicitante ?? null,
      page_start: input.pageStart ?? 1,
      page_end: input.pageEnd ?? null,
      force_restart: input.forceRestart ?? false,
      limit: input.limit ?? null,
    });
    return this.mapRun(data);
  }

  async listRuns(params: {
    limit?: number;
    offset?: number;
  }): Promise<EtlListResponse> {
    const { data } = await this.request<{ runs: RawRun[]; total: number }>(
      'get',
      '/runs',
      undefined,
      { limit: params.limit ?? 50, offset: params.offset ?? 0 },
    );
    return {
      runs: (data.runs ?? []).map((run) => this.mapRun(run)),
      total: data.total ?? 0,
    };
  }

  async getRun(taskId: string): Promise<EtlRun> {
    const { data } = await this.request<RawRun>('get', `/runs/${taskId}`);
    return this.mapRun(data);
  }

  async reprocessRun(
    taskId: string,
    solicitante: Record<string, unknown>,
  ): Promise<EtlRun> {
    const { data } = await this.request<RawRun>(
      'post',
      `/runs/${taskId}/reprocess`,
      { solicitante },
    );
    return this.mapRun(data);
  }

  async cancelRun(taskId: string): Promise<EtlCancelResult> {
    const { data } = await this.request<EtlCancelResult>(
      'post',
      `/runs/${taskId}/cancel`,
    );
    return {
      taskId: data.taskId,
      revoked: data.revoked ?? 0,
      total: data.total ?? 0,
    };
  }

  private async request<T>(
    method: 'get' | 'post',
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<{ data: T }> {
    try {
      return await firstValueFrom(
        this.httpService.request<T>({ method, url: path, data: body, params }),
      );
    } catch (error) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Serviço de coleta (ETL) indisponível';
      this.logger.error(
        `ETL request failed ${method.toUpperCase()} ${path}: ${message}`,
      );
      throw new ServiceUnavailableException(message);
    }
  }

  private mapRun(raw: RawRun): EtlRun {
    const counters = raw.contadores ?? {};
    return {
      taskId: raw.task_id,
      base: raw.base ?? null,
      filtros: raw.filtros ?? {},
      solicitante: raw.solicitante ?? null,
      status: raw.status ?? 'queued',
      inicioEm: raw.inicio_em ?? null,
      concluidoEm: raw.concluido_em ?? null,
      contadores: {
        encontrados: counters.encontrados ?? 0,
        jaExistentes: counters.ja_existentes ?? 0,
        aguardando: counters.aguardando ?? 0,
        emAndamento: counters.em_andamento ?? 0,
        gravados: counters.gravados ?? 0,
        falhas: counters.falhas ?? 0,
        semPdf: counters.sem_pdf ?? 0,
      },
      documentos: (raw.documentos ?? []).map((doc) => ({
        identificacao: (doc.identificacao as string) ?? '',
        etapa: (doc.etapa as string | null) ?? null,
        resultado: (doc.resultado as string) ?? '',
        mensagem: (doc.mensagem as string | null) ?? null,
      })),
    };
  }
}
