import {
  getFilesAddedAfter,
  getFilesModifiedAfter,
  getBranchChanges,
  branchDivergedBefore,
  getMergeBase,
} from './git.js'

export interface DetectionResult {
  newFiles: string[]           // Files added AFTER migration commit
  modifiedFiles: string[]      // Files modified AFTER migration commit
  branchFiles: string[]        // Files in branch that diverged BEFORE migration
  needsMigration: boolean
  reason: string
}

/**
 * Filter files to only include relevant file types for migration
 */
function filterRelevantFiles(files: string[]): string[] {
  const relevantExtensions = /\.(tsx?|jsx?|vue|svelte|astro|html|css)$/i
  return files.filter((file) => relevantExtensions.test(file))
}

/**
 * Detect files that need migration based on git history
 *
 * This is the core algorithm that solves the ambiguity problem:
 * - Uses git commit SHA instead of pattern matching
 * - Detects when code was written, not what it looks like
 * - Handles both "new code after migration" and "old branch before migration" cases
 */
export async function detectFilesNeedingMigration(
  migrationCommit: string,
  baseBranch: string = 'origin/main'
): Promise<DetectionResult> {
  // Case 1: Files added AFTER migration on current branch
  const newFiles = filterRelevantFiles(getFilesAddedAfter(migrationCommit))

  // Case 2: Files modified AFTER migration on current branch
  const modifiedFiles = filterRelevantFiles(getFilesModifiedAfter(migrationCommit))

  // Case 3: Check if current branch diverged BEFORE migration
  const divergedBefore = branchDivergedBefore(migrationCommit, baseBranch)

  if (divergedBefore) {
    // This branch was created before v4 migration
    // All code in this branch is v3-era and needs migration
    const mergeBase = getMergeBase(baseBranch, 'HEAD')
    if (mergeBase) {
      const branchFiles = filterRelevantFiles(getBranchChanges(baseBranch))

      return {
        newFiles,
        modifiedFiles,
        branchFiles,
        needsMigration: true,
        reason: `Branch diverged before v4 migration commit (${branchFiles.length} files need migration)`,
      }
    }
  }

  // Combine all detected files
  const allFiles = [...newFiles, ...modifiedFiles]

  return {
    newFiles,
    modifiedFiles,
    branchFiles: [],
    needsMigration: allFiles.length > 0,
    reason:
      allFiles.length > 0
        ? `Found ${allFiles.length} file(s) added or modified after migration`
        : 'All files are up to date',
  }
}

/**
 * Get a summary of detection results for display
 */
export function getDetectionSummary(result: DetectionResult): string {
  const lines: string[] = []

  if (result.branchFiles.length > 0) {
    lines.push(`Branch diverged before v4 migration:`)
    lines.push(`  • ${result.branchFiles.length} file(s) in branch need migration`)
  }

  if (result.newFiles.length > 0) {
    lines.push(`New files added after migration:`)
    lines.push(`  • ${result.newFiles.length} file(s)`)
  }

  if (result.modifiedFiles.length > 0) {
    lines.push(`Modified files after migration:`)
    lines.push(`  • ${result.modifiedFiles.length} file(s)`)
  }

  if (lines.length === 0) {
    lines.push('No files need migration')
  }

  return lines.join('\n')
}

/**
 * Get all files that need migration from detection result
 */
export function getAllFilesNeedingMigration(result: DetectionResult): string[] {
  // If branch diverged before migration, only migrate branch files
  // to avoid duplicates
  if (result.branchFiles.length > 0) {
    return result.branchFiles
  }

  // Otherwise, migrate new and modified files
  return [...result.newFiles, ...result.modifiedFiles]
}
