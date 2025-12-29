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

  // Filter to CSS files and template files
  const cssFiles = allFiles.filter((f) => f.endsWith('.css'))
  const templateFiles = allFiles.filter((f) => !f.endsWith('.css'))

  logger.info(`CSS files: ${cssFiles.length}`)
  logger.info(`Template files: ${templateFiles.length}`)

  if (cssFiles.length === 0 && templateFiles.length === 0) {
    logger.success('No files need migration')
    return
  }

  // IMPORTANT: Pass detected files to prevent full project scan
  // If we pass empty array, migrate-core.ts will scan ALL files with globby!

  // Run the core migration with specific files
  logger.info('Running migration on detected files only...')
  await runMigration({
    files: cssFiles, // CSS files for CSS migration
    templateFiles: templateFiles, // Template files for template migration
    force: options.force,
    gitAwareMode: true, // Tell migrate-core to skip globby scan
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
