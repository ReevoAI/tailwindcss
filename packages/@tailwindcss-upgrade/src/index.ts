#!/usr/bin/env node

import { args, type Arg } from './utils/args'
import { help } from './commands/help'
import { init } from './git-aware/commands/init'
import { check } from './git-aware/commands/check'
import { validateBranch } from './git-aware/commands/validate-branch'
import { migrate } from './git-aware/commands/migrate'

const globalOptions = {
  '--help': { type: 'boolean', description: 'Display usage information', alias: '-h' },
  '--version': { type: 'boolean', description: 'Display the version number', alias: '-v' },
} satisfies Arg

const flags = args(globalOptions)

const command = flags._[0] as string | undefined

// Display version
if (flags['--version']) {
  console.log(require('../package.json').version)
  process.exit(0)
}

// Display help
if (flags['--help'] || command === 'help') {
  help({
    usage: [
      'npx tailwindcss-enhanced-upgrade <command>',
      '',
      'Commands:',
      '  init             Initialize git-aware migration tracking',
      '  check            Check for files needing migration',
      '  migrate          Migrate detected files',
      '  validate-branch  Validate current branch before merging',
      '',
      'Legacy (deprecated):',
      '  npx tailwindcss-enhanced-upgrade [files...]  # Direct migration (use "migrate" instead)',
    ],
    options: globalOptions,
  })
  process.exit(0)
}

async function run() {
  try {
    switch (command) {
      case 'init':
        await init({
          commit: flags['--commit'] as string | undefined,
          force: flags['--force'] as boolean | undefined,
        })
        break

      case 'check':
        await check({
          json: flags['--json'] as boolean | undefined,
        })
        break

      case 'migrate':
        await migrate({
          dryRun: flags['--dry-run'] as boolean | undefined,
          verbose: flags['--verbose'] as boolean | undefined,
          force: flags['--force'] as boolean | undefined,
        })
        break

      case 'validate-branch':
        await validateBranch({
          json: flags['--json'] as boolean | undefined,
        })
        break

      case undefined:
        // Legacy mode: run migration directly (for backward compatibility)
        const { runMigration } = await import('./migrate-core')
        await runMigration({
          files: flags._.map(String),
          config: flags['--config'] as string | undefined,
          force: flags['--force'] as boolean | undefined,
        })
        break

      default:
        console.error(`Unknown command: ${command}`)
        console.error('Run "npx tailwindcss-enhanced-upgrade --help" for usage information')
        process.exit(1)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

run()
