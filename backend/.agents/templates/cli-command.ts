import { Command, CommandRunner, Option } from 'nest-commander';

interface MyCommandOptions {
  force: boolean;
  limit: number;
}

@Command({
  name: 'domain:verb-noun',
  description: 'Description of what this command does.',
})
export class MyCommand extends CommandRunner {
  constructor() {
    super();
  }

  async run(_inputs: string[], options: MyCommandOptions): Promise<void> {
    console.log('Starting domain:verb-noun...');

    if (options.force) {
      console.log('Force mode enabled');
    }

    try {
      // TODO: Call service method(s) here
      console.log('Done.');
    } catch (err) {
      console.error('Failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  @Option({
    flags: '-f, --force',
    description: 'Force execution without confirmation prompt',
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: '-l, --limit <number>',
    description: 'Maximum number of items to process (must be positive)',
  })
  parseLimit(val: string): number {
    const parsed = Number(val);
    if (!Number.isFinite(parsed) || parsed < 1) {
      throw new Error('--limit must be a positive number');
    }
    return parsed;
  }
}
