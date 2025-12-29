import { loadConfig } from '../config.js'
import { detectFilesNeedingMigration } from '../detection.js'
import { getCurrentBranch } from '../git.js'
import { logger } from '../utils/logger.js'
import pc from 'picocolors'

export interface CheckOptions {
  json?: boolean
  branch?: string
}

export async function check(options: CheckOptions = {}) {
  try {
    // Load config
    const config = await loadConfig()

    // Run detection
    const result = await detectFilesNeedingMigration(
      config.migrationCommit,
      options.branch
    )

    // JSON output
    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.needsMigration ? 1 : 0)
    }

    // Human-readable output
    logger.plain('')
    logger.success(
      `Migration baseline: ${pc.bold(config.migrationCommit.slice(0, 7))}`
    )
    logger.success(`Current branch: ${pc.bold(getCurrentBranch())}`)
    logger.plain('')

    if (!result.needsMigration) {
      logger.success('No migration needed - all files are up to date')
      logger.plain('')
      return
    }

    // Show what needs migration
    logger.warn(result.reason)
    logger.plain('')

    if (result.branchFiles.length > 0) {
      logger.section('Branch files (need migration)')
      logger.list(result.branchFiles.slice(0, 10))
      if (result.branchFiles.length > 10) {
        logger.plain(pc.gray(`  ... and ${result.branchFiles.length - 10} more`))
      }
      logger.plain('')
    }

    if (result.newFiles.length > 0) {
      logger.section('New files (added after migration)')
      logger.list(result.newFiles.slice(0, 10))
      if (result.newFiles.length > 10) {
        logger.plain(pc.gray(`  ... and ${result.newFiles.length - 10} more`))
      }
      logger.plain('')
    }

    if (result.modifiedFiles.length > 0) {
      logger.section('Modified files (changed after migration)')
      logger.list(result.modifiedFiles.slice(0, 10))
      if (result.modifiedFiles.length > 10) {
        logger.plain(pc.gray(`  ... and ${result.modifiedFiles.length - 10} more`))
      }
      logger.plain('')
    }

    logger.info(`Run ${pc.bold('npx tailwindcss-enhanced-upgrade migrate')} to fix`)
    logger.plain('')

    process.exit(1)
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
