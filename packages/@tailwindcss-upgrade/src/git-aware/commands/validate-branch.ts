import { loadConfig } from '../config.js'
import { detectFilesNeedingMigration } from '../detection.js'
import { getCurrentBranch } from '../git.js'
import { logger } from '../utils/logger.js'
import pc from 'picocolors'

export interface ValidateBranchOptions {
  json?: boolean
}

export async function validateBranch(options: ValidateBranchOptions = {}) {
  try {
    // Load config
    const config = await loadConfig()

    // Run detection
    const result = await detectFilesNeedingMigration(config.migrationCommit)

    // JSON output
    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.needsMigration ? 1 : 0)
    }

    // Human-readable output
    const currentBranch = getCurrentBranch()

    if (!result.needsMigration) {
      logger.success(`Branch ${pc.bold(currentBranch)} is up to date with v4 migration`)
      logger.plain('')
      return
    }

    // Branch needs migration
    logger.error('Branch Validation Failed')
    logger.plain('')

    if (result.branchFiles.length > 0) {
      logger.warn(
        `Branch ${pc.bold(currentBranch)} diverged before v4 migration`
      )
      logger.info(`Files affected: ${result.branchFiles.length}`)
      logger.plain('')

      logger.section('Action Required')
      logger.list([
        '1. Rebase on main',
        '   git fetch origin',
        '   git rebase origin/main',
        '',
        '2. Run migration',
        '   npx tailwindcss-enhanced-upgrade migrate',
        '',
        '3. Push changes',
        '   git push --force-with-lease',
      ])
      logger.plain('')
    } else {
      logger.warn('New files added after migration')
      logger.info(
        `${result.newFiles.length} new, ${result.modifiedFiles.length} modified`
      )
      logger.plain('')

      logger.section('Recommendation')
      logger.list([
        'Run migration to ensure consistent v4 patterns',
        '  npx tailwindcss-enhanced-upgrade migrate',
      ])
      logger.plain('')
    }

    process.exit(1)
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
