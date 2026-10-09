import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EtlCancelResult, EtlClient, EtlListResponse, EtlRun } from '../../etl/etl.client';
import { User } from '../../model/entities/user.entity';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { GetColetasQueryDto } from './dto/get-coletas-query.dto';

@ApiTags('semaspa-coletas')
@Controller('api/semaspa/coletas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ColetasController {
  constructor(private readonly etlClient: EtlClient) {}

  @Post()
  @ApiOperation({
    summary: 'Dispara uma coleta SEMAS-PA',
    description:
      'Encaminha a solicitação ao módulo ETL, que enfileira a pipeline (AUTEFs ou GFs) no Celery. O id retornado é o id da task do Celery.',
  })
  @ApiCreatedResponse({ description: 'Coleta enfileirada com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  create(
    @Body() dto: CreateColetaDto,
    @Request() req: { user: User },
  ): Promise<EtlRun> {
    return this.etlClient.createRun({
      base: dto.base,
      filtros: dto.filtros ?? {},
      solicitante: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      pageStart: dto.pageStart,
      pageEnd: dto.pageEnd,
      forceRestart: dto.forceRestart,
      limit: dto.limit,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Lista coletas',
    description:
      'Lista as execuções derivadas do result backend do Celery (apenas runs já finalizados possuem registro).',
  })
  @ApiOkResponse({ description: 'Lista de coletas' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  list(@Query() query: GetColetasQueryDto): Promise<EtlListResponse> {
    return this.etlClient.listRuns({
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalha uma coleta',
    description:
      'Retorna status, contadores e resultado por documento, agregados a partir das tasks do Celery.',
  })
  @ApiParam({ name: 'id', description: 'Id da task do Celery', example: '...' })
  @ApiOkResponse({ description: 'Detalhe da coleta' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  detail(@Param('id') id: string): Promise<EtlRun> {
    return this.etlClient.getRun(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({
    summary: 'Reprocessa uma coleta SEMAS-PA',
    description:
      'Enfileira uma nova execução com os mesmos filtros, a partir da primeira página. Documentos já gravados são ignorados.',
  })
  @ApiParam({ name: 'id', description: 'Id da task do Celery', example: '...' })
  @ApiCreatedResponse({ description: 'Nova coleta enfileirada' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  reprocess(
    @Param('id') id: string,
    @Request() req: { user: User },
  ): Promise<EtlRun> {
    return this.etlClient.reprocessRun(id, {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    });
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancela uma coleta SEMAS-PA',
    description:
      'Revoga a task raiz e as tasks de documento da coleta no Celery.',
  })
  @ApiParam({ name: 'id', description: 'Id da task do Celery', example: '...' })
  @ApiOkResponse({ description: 'Cancelamento solicitado' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  cancel(@Param('id') id: string): Promise<EtlCancelResult> {
    return this.etlClient.cancelRun(id);
  }
}
