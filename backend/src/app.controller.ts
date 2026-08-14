import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('status')
@Controller()
export class AppController {
  constructor() {}

  @Get()
  @ApiOperation({
    summary: 'Check API status',
    description: 'Endpoint to check if the API is working',
  })
  @ApiResponse({
    status: 200,
    description: 'API working normally',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
      },
    },
  })
  index(): { status: string } {
    return { status: 'ok' };
  }
}
