import { CommandFactory } from 'nest-commander';
import { CliModule } from './app.clients';

async function bootstrap() {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn', 'log'],
  });
}

bootstrap();
