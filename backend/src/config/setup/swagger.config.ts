import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('CCCA Data API')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter the JWT token in the field below',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();

export const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    jsonDocumentUrl: 'swagger/json',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    requestInterceptor: (req) => {
      // Add custom headers if necessary
      return req;
    },
    responseInterceptor: (res) => {
      // Process responses if necessary
      return res;
    },
  },
  customSiteTitle: 'CCCA Data API',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; font-size: 36px; font-weight: 600; }
    .swagger-ui .info .description { font-size: 16px; line-height: 1.6; color: #5a6c7d; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #fca130; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
    .swagger-ui .opblock .opblock-summary { border-radius: 4px; }
    .swagger-ui .opblock .opblock-section-header { background: #f7f7f7; }
    .swagger-ui .parameter__name { font-weight: 600; }
    .swagger-ui .response-col_status { font-weight: 600; }
    .swagger-ui .model-title { font-weight: 600; }
    .swagger-ui .model .property { font-size: 13px; }
    .swagger-ui .btn.authorize { background: #49cc90; border-color: #49cc90; }
    .swagger-ui .btn.authorize:hover { background: #3fb883; border-color: #3fb883; }
    .swagger-ui .auth-container { background: #f8f9fa; padding: 15px; border-radius: 4px; }
  `,
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  ],
};
