import { readFile, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

export interface Config {
  version: string
  migrationCommit: string
  migrationDate: string
  strategy: 'git-aware'
  includePatterns: string[]
  excludePatterns: string[]
  codemods: {
    enabled: boolean
    bypassVersionChecks: boolean
  }
}

const CONFIG_FILENAME = '.tailwindcss-enhanced-upgrade.json'

const DEFAULT_CONFIG: Omit<Config, 'migrationCommit' | 'migrationDate'> = {
  version: '1.0.0',
  strategy: 'git-aware',
  includePatterns: [
    'src/**/*.{tsx,jsx,vue,svelte,astro,html}',
    'src/**/*.css',
    'app/**/*.{tsx,jsx,vue,svelte,astro,html}',
    'app/**/*.css',
    'components/**/*.{tsx,jsx,vue,svelte,astro,html}',
    'pages/**/*.{tsx,jsx,vue,svelte,astro,html}',
  ],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/coverage/**',
  ],
  codemods: {
    enabled: true,
    bypassVersionChecks: true,
  },
}

/**
 * Get the path to the config file
 */
export function getConfigPath(base: string = process.cwd()): string {
  return resolve(base, CONFIG_FILENAME)
}

/**
 * Check if config file exists
 */
export async function configExists(base: string = process.cwd()): Promise<boolean> {
  try {
    await access(getConfigPath(base))
    return true
  } catch {
    return false
  }
}

/**
 * Load config from file
 */
export async function loadConfig(base: string = process.cwd()): Promise<Config> {
  const configPath = getConfigPath(base)

  try {
    const content = await readFile(configPath, 'utf-8')
    const config = JSON.parse(content) as Config

    // Validate required fields
    if (!config.migrationCommit) {
      throw new Error('Config is missing migrationCommit field')
    }

    return config
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Configuration file not found: ${CONFIG_FILENAME}\n\n` +
          `This tool requires explicit configuration. To set up:\n\n` +
          `1. Find your v4 migration commit SHA:\n` +
          `   git log --oneline --grep="v4"\n\n` +
          `2. Initialize with that commit:\n` +
          `   npx tailwindcss-enhanced-upgrade init --commit <sha>\n\n` +
          `3. Commit the config file:\n` +
          `   git add ${CONFIG_FILENAME}\n` +
          `   git commit -m "chore: add migration tracker config"`
      )
    }
    throw error
  }
}

/**
 * Save config to file
 */
export async function saveConfig(
  config: Config,
  base: string = process.cwd()
): Promise<void> {
  const configPath = getConfigPath(base)
  const content = JSON.stringify(config, null, 2) + '\n'
  await writeFile(configPath, content, 'utf-8')
}

/**
 * Create a new config with migration commit
 */
export function createConfig(migrationCommit: string): Config {
  return {
    ...DEFAULT_CONFIG,
    migrationCommit,
    migrationDate: new Date().toISOString(),
  }
}

/**
 * Update existing config
 */
export async function updateConfig(
  updates: Partial<Config>,
  base: string = process.cwd()
): Promise<Config> {
  const existing = await loadConfig(base)
  const updated = { ...existing, ...updates }
  await saveConfig(updated, base)
  return updated
}
