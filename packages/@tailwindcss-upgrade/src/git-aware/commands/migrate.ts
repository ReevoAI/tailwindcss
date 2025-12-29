import { loadConfig } from '../config.js'
import { detectFilesNeedingMigration } from '../detection.js'
import { logger } from '../utils/logger.js'
import { runMigration } from '../../migrate-core.js'

export interface MigrateOptions {
  dryRun?: boolean
  verbose?: boolean
  force?: boolean
}

export async function migrate(options: MigrateOptions = {}) {
  // Load configuration
  const config = await loadConfig()

  logger.info('Detecting files needing migration...')

  // Detect files using git-aware logic
  const result = await detectFilesNeedingMigration(config.migrationCommit)

  if (!result.needsMigration) {
    logger.success('No files need migration')
    logger.info(result.reason)
    return
  }

  // Collect all files that need migration
  const allFiles = [
    ...result.newFiles,
    ...result.modifiedFiles,
    ...result.branchFiles,
  ]

  logger.info(`Found ${allFiles.length} file(s) needing migration`)

  if (options.dryRun) {
    logger.section('Files to migrate (dry run)')
    for (const file of allFiles) {
      logger.plain(`  ${file}`)
    }
    return
  }

  // Filter to CSS files (templates are discovered automatically by the CLI)
  const cssFiles = allFiles.filter((f) => f.endsWith('.css'))
  const templateFiles = allFiles.filter((f) => !f.endsWith('.css'))

  logger.info(`CSS files: ${cssFiles.length}`)
  logger.info(`Template files: ${templateFiles.length} (auto-discovered by CLI)`)

  // Determine files to pass to CLI
  let filesToMigrate: string[]

  if (cssFiles.length === 0) {
    // Only templates changed - need to run full migration
    logger.warn('No CSS files changed, but templates detected. Running full project scan...')
    filesToMigrate = [] // Empty array = CLI discovers all CSS files
  } else {
    // Pass CSS files - CLI will discover related templates automatically
    filesToMigrate = cssFiles
  }

  // Run the core migration
  logger.info('Running migration...')
  await runMigration({
    files: filesToMigrate,
    force: options.force,
  })

  logger.success('Migration complete!')
  logger.plain('')
  logger.section('Next steps')
  logger.list([
    'Review the changes',
    '  git diff',
    '',
    'Commit the migrated files',
    '  git add .',
    '  git commit -m "chore: migrate to Tailwind v4"',
  ])
}
