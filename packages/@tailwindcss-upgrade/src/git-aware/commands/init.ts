import { commitExists, isGitRepository } from '../git.js'
import { configExists, createConfig, saveConfig } from '../config.js'
import { installedTailwindVersion } from '../../utils/version.js'
import { logger } from '../utils/logger.js'

export interface InitOptions {
  commit?: string
  force?: boolean
}

export async function init(options: InitOptions = {}) {
  // Check if git repository
  if (!isGitRepository()) {
    logger.error('Not a git repository')
    logger.info('Run this command from the root of your git repository')
    process.exit(1)
  }

  // Check if config already exists
  if (await configExists()) {
    if (!options.force) {
      logger.error('Configuration already exists')
      logger.info('Use --force to overwrite existing configuration')
      process.exit(1)
    }
    logger.warn('Overwriting existing configuration')
  }

  // Get migration commit SHA - MUST be explicitly provided
  if (!options.commit) {
    logger.error('Migration commit must be explicitly specified')
    logger.plain('')
    logger.info('Usage:')
    logger.plain('  npx tailwindcss-enhanced-upgrade init --commit <sha>')
    logger.plain('')
    logger.info('Example:')
    logger.plain('  npx tailwindcss-enhanced-upgrade init --commit abc123def456')
    logger.plain('')
    logger.info('To find your v4 migration commit:')
    logger.plain('  git log --oneline --grep="v4" --grep="upgrade"')
    process.exit(1)
  }

  const migrationCommit = options.commit

  // Validate commit exists
  if (!commitExists(migrationCommit)) {
    logger.error(`Commit ${migrationCommit} not found in repository`)
    process.exit(1)
  }

  // Check Tailwind CSS version
  try {
    const version = installedTailwindVersion()
    if (!version.startsWith('4.')) {
      logger.warn(`Tailwind CSS ${version} is installed`)
      logger.warn('This tool is designed for projects migrated to v4')
    }
  } catch (error) {
    logger.warn('Could not detect Tailwind CSS installation')
  }

  // Create config
  const config = createConfig(migrationCommit)

  // Save config
  await saveConfig(config)

  // Success message
  logger.success(`Initialized migration tracking`)
  logger.plain('')
  logger.info(`Migration commit: ${migrationCommit.slice(0, 7)}`)
  logger.info(`Config file: .tailwindcss-enhanced-upgrade.json`)
  logger.plain('')
  logger.section('Next steps')
  logger.list([
    'Commit the config file',
    `  git add .tailwindcss-enhanced-upgrade.json`,
    `  git commit -m "chore: add migration tracker config"`,
    '',
    'Verify setup',
    `  npx tailwindcss-enhanced-upgrade check`,
  ])
}
