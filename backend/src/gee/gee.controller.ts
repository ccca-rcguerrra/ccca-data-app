import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Res,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiProduces,
  ApiBody,
} from '@nestjs/swagger';
import { GeeService } from './services/gee.service';
import { GeeImagesSentinel2Service } from './services/gee-images-sentinel2.service';
import { GeeImagesSentinel2TimeSeriesService } from './services/gee-images-sentinel2-timeseries.service';
import { GetSentinelImageFeaturesQueryDto } from './dto/get-sentinel-image-features-query.dto';
import { GetSentinelImageMapLayerResponseDto } from './dto/get-sentinel-image-map-layer-response.dto';
import { GetSentinelImagePngQueryDto } from './dto/get-sentinel-image-png-query.dto';
import { GetSentinelImagePngResponseDto } from './dto/get-sentinel-image-png-response.dto';
import { GetGeeStatusResponseDto } from './dto/get-gee-status-response.dto';
import { GetSentinelImageFeaturesResponseDto } from './dto/get-sentinel-image-features-response.dto';
import { GetSentinelIndexesTimeSeriesQueryDto } from './dto/get-sentinel-index-timeseries-query.dto';
import { GetSentinelIndexesTimeSeriesResponseDto } from './dto/get-sentinel-index-timeseries-response.dto';
import { GetSentinelTimelineSummaryQueryDto } from './dto/get-sentinel-timeline-summary-query.dto';
import { GetSentinelTimelineSummaryResponseDto } from './dto/get-sentinel-timeline-summary-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('gee')
@Controller('api/gee')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GeeController { 
  constructor(
    private readonly geeService: GeeService,
    private readonly geeImagesSentinel2Service: GeeImagesSentinel2Service,
    private readonly geeImagesSentinel2TimeSeriesService: GeeImagesSentinel2TimeSeriesService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get GEE initialization status',
    description: 'Returns the current status of Google Earth Engine initialization and authentication',
  })
  @ApiOkResponse({
    description: 'GEE status returned successfully',
    type: GetGeeStatusResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  getStatus(): GetGeeStatusResponseDto {
    const status = this.geeService.getStatus();
    return new GetGeeStatusResponseDto(
      status.initialized,
      status.authenticated,
      status.ready,
    );
  }

  @Post('images/sentinel/features')
  @ApiOperation({
    summary: 'Get Sentinel-2 images',
    description: 'Returns Sentinel-2 images as FeatureCollection filtered by date range and optional geometry from Google Earth Engine. Each feature contains the image footprint geometry and all image properties.',
  })
  @ApiBody({
    description: 'Filter parameters for Sentinel-2 images',
    type: GetSentinelImageFeaturesQueryDto,
  })
  @ApiOkResponse({
    description: 'Sentinel-2 images returned successfully as FeatureCollection with unique dates',
    type: GetSentinelImageFeaturesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getSentinelImagesFeatures(
    @Body() body: GetSentinelImageFeaturesQueryDto,
  ): Promise<GetSentinelImageFeaturesResponseDto> {
    const featureCollection = await this.geeImagesSentinel2Service.findImageFeatures({
      startDate: body.startDate,
      endDate: body.endDate,
      geometry: body.geometry,
      cloudCoverPercentage: body.cloudCoverPercentage,
    });

    return new GetSentinelImageFeaturesResponseDto(featureCollection);
  }

  @Post('images/sentinel/mosaic/maplayer')
  @ApiOperation({
    summary: 'Get Sentinel-2 mosaic map layer',
    description: 'Returns Google Earth Engine map layer data for visualizing a mosaic of Sentinel-2 images filtered by date range and optional geometry',
  })
  @ApiBody({
    description: 'Filter parameters for Sentinel-2 images',
    type: GetSentinelImageFeaturesQueryDto,
  })
  @ApiOkResponse({
    description: 'Map layer data returned successfully',
    type: GetSentinelImageMapLayerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getSentinelMosaicMapLayer(
    @Body() body: GetSentinelImageFeaturesQueryDto,
  ): Promise<GetSentinelImageMapLayerResponseDto> {
    const mapLayer = await this.geeImagesSentinel2Service.getMosaicMapLayer(
      {
        startDate: body.startDate,
        endDate: body.endDate,
        geometry: body.geometry,
        cloudCoverPercentage: body.cloudCoverPercentage,
        cloudMask: body.cloudMask,
      },
      body.visualization,
    );

    if (!mapLayer) {
      return new GetSentinelImageMapLayerResponseDto();
    }

    return new GetSentinelImageMapLayerResponseDto(
      mapLayer.mapid,
      mapLayer.token,
      mapLayer.urlFormat,
    );
  }

  @Post('images/sentinel/mosaic/png')
  @ApiOperation({
    summary: 'Get Sentinel-2 mosaic PNG image',
    description: 'Returns a square PNG image of a mosaic of Sentinel-2 images filtered by date range and optional geometry. The image size (width = height) can be specified in pixels.',
  })
  @ApiBody({
    description: 'Filter parameters for Sentinel-2 images with PNG dimensions',
    type: GetSentinelImagePngQueryDto,
  })
  @ApiOkResponse({
    description: 'PNG image URL returned successfully',
    type: GetSentinelImagePngResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format, parameters, or image dimensions',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getSentinelMosaicPng(
    @Body() body: GetSentinelImagePngQueryDto,
  ): Promise<GetSentinelImagePngResponseDto> {
    const pngUrl = await this.geeImagesSentinel2Service.getMosaicPng(
      {
        startDate: body.startDate,
        endDate: body.endDate,
        geometry: body.geometry,
        cloudCoverPercentage: body.cloudCoverPercentage,
        cloudMask: body.cloudMask,
      },
      body.size,
      body.visualization,
    );

    return new GetSentinelImagePngResponseDto(pngUrl ?? undefined);
  }

  @Get('images/sentinel/mosaic/png/raw/:token')
  @Public()
  @ApiOperation({
    summary: 'Proxy the Sentinel-2 mosaic PNG bytes',
    description:
      'Streams the actual PNG image referenced by a token previously returned from POST images/sentinel/mosaic/png. The backend downloads the image from Google Earth Engine and relays the bytes, so the frontend never talks to GEE directly. Public by design (browsers cannot send the JWT on an <img> request); the opaque token acts as a capability.',
  })
  @ApiParam({
    name: 'token',
    description: 'Opaque capability token from the PNG proxy URL',
  })
  @ApiProduces('image/png')
  @ApiOkResponse({
    description: 'PNG image bytes streamed successfully',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({
    description: 'Unknown or expired token',
  })
  async getSentinelMosaicPngRaw(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const image = await this.geeImagesSentinel2Service.getMosaicPngBytes(token);

    if (!image) {
      throw new NotFoundException('PNG not found or token expired');
    }

    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Cache-Control', 'public, max-age=43200');
    res.status(200).send(image.buffer);
  }

  @Get('images/sentinel/mosaic/maplayer/tiles/:token/:z/:x/:y')
  @Public()
  @ApiOperation({
    summary: 'Proxy a Sentinel-2 mosaic map tile',
    description:
      'Streams a single XYZ map tile referenced by a token previously returned from POST images/sentinel/mosaic/maplayer. The backend downloads the tile from Google Earth Engine and relays the bytes, so MapLibre never talks to GEE directly. Public by design (map tile requests cannot carry the JWT); the opaque token acts as a capability.',
  })
  @ApiParam({ name: 'token', description: 'Opaque capability token from the map-layer proxy URL' })
  @ApiParam({ name: 'z', description: 'Tile zoom level', example: 12 })
  @ApiParam({ name: 'x', description: 'Tile column', example: 2045 })
  @ApiParam({ name: 'y', description: 'Tile row', example: 2812 })
  @ApiProduces('image/jpeg', 'image/png')
  @ApiOkResponse({
    description: 'Map tile bytes streamed successfully (JPEG from GEE)',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({ description: 'Unknown or expired token' })
  async getSentinelMosaicTileRaw(
    @Param('token') token: string,
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y', ParseIntPipe) y: number,
    @Res() res: Response,
  ): Promise<void> {
    const tile = await this.geeImagesSentinel2Service.getMosaicTile(token, z, x, y);

    if (!tile) {
      throw new NotFoundException('Map layer not found or token expired');
    }

    res.setHeader('Content-Type', tile.contentType);
    res.setHeader('Cache-Control', 'public, max-age=43200');
    res.status(200).send(tile.buffer);
  }

  @Post('images/sentinel/timeseries/indexes')
  @ApiOperation({
    summary: 'Get Sentinel-2 spectral indexes mean daily time series',
    description: 'Returns a daily time series of mean values for one or more spectral indexes calculated from Sentinel-2 images. Creates one data point per day by aggregating multiple images per day using median, then calculating mean values over the geometry. Uses cloud masking via QA60 band (bits 10 and 11) to filter clouds and cirrus. Available indexes: NDVI = (B8 - B4) / (B8 + B4), NBR = (B8 - B12) / (B8 + B12), NDMI = (B8 - B11) / (B8 + B11). Days with no images or fully masked data are excluded from results.',
  })
  @ApiBody({
    description: 'Filter parameters for Sentinel-2 images with spectral indexes and optional scale',
    type: GetSentinelIndexesTimeSeriesQueryDto,
  })
  @ApiOkResponse({
    description: 'Spectral indexes time series returned successfully',
    type: GetSentinelIndexesTimeSeriesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getSentinelIndexesTimeSeries(
    @Body() body: GetSentinelIndexesTimeSeriesQueryDto,
  ): Promise<GetSentinelIndexesTimeSeriesResponseDto> {
    const timeSeries = await this.geeImagesSentinel2TimeSeriesService.getIndexesTimeSeries({
      startDate: body.startDate,
      endDate: body.endDate,
      geometry: body.geometry,
      cloudCoverPercentage: body.cloudCoverPercentage,
      scale: body.scale,
      indexes: body.indexes,
      temporalResolution: body.temporalResolution,
    });

    return new GetSentinelIndexesTimeSeriesResponseDto(timeSeries);
  }

  @Post('images/sentinel/timeline/summary')
  @ApiOperation({
    summary: 'Get Sentinel-2 timeline summary (NDVI + cloud per period)',
    description:
      'Returns a per-period (default month) summary used to drive the data heatmap under the map timeline slider: mean NDVI over the AOI, mean scene cloud cover (CLOUDY_PIXEL_PERCENTAGE — the same property the cloud-cover filter uses) and image count. No cloud filter is applied, so the cloud value reflects the real cloudiness and helps pick a clear, change-bearing month. NDVI is computed on a QA60 cloud-masked median composite. Periods with no images are omitted.',
  })
  @ApiBody({
    description: 'Filter parameters for the Sentinel-2 timeline summary',
    type: GetSentinelTimelineSummaryQueryDto,
  })
  @ApiOkResponse({
    description: 'Timeline summary returned successfully',
    type: GetSentinelTimelineSummaryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getSentinelTimelineSummary(
    @Body() body: GetSentinelTimelineSummaryQueryDto,
  ): Promise<GetSentinelTimelineSummaryResponseDto> {
    const summary = await this.geeImagesSentinel2TimeSeriesService.getTimelineSummary({
      startDate: body.startDate,
      endDate: body.endDate,
      geometry: body.geometry,
      scale: body.scale,
      temporalResolution: body.temporalResolution,
    });

    return new GetSentinelTimelineSummaryResponseDto(summary);
  }
}

