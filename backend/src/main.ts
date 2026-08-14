// Load .env BEFORE any app module (and thus entity) is imported, so import-time
// reads like GEOM_SRID (per-initiative geometry projection) see the env values.
// ConfigModule still loads it again for the DI-based config (idempotent).
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { swaggerConfig, swaggerCustomOptions } from './config/setup/swagger.config';

const JSON_BODY_LIMIT = '20mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

  // Configure global interceptor to normalize query params (must be before ValidationPipe)
  // Configure global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure Swagger
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, swaggerCustomOptions);

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.APP_PORT ?? process.env.PORT ?? 3000);
}
bootstrap();
