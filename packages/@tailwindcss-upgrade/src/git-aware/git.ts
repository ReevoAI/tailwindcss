import { execSync } from 'node:child_process'

export interface GitInfo {
  currentBranch: string
  hasUncommittedChanges: boolean
  isGitRepository: boolean
}

/**
 * Check if current directory is a git repository
 */
export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Get current branch name
 */
export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Check if there are uncommitted changes
 */
export function hasUncommittedChanges(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    return status.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Get git repository information
 */
export function getGitInfo(): GitInfo {
  return {
    currentBranch: getCurrentBranch(),
    hasUncommittedChanges: hasUncommittedChanges(),
    isGitRepository: isGitRepository(),
  }
}

/**
 * Check if a commit exists in the repository
 */
export function commitExists(commitSha: string): boolean {
  try {
    execSync(`git rev-parse ${commitSha}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Get the merge-base between two commits
 */
export function getMergeBase(commit1: string, commit2: string): string | null {
  try {
    return execSync(`git merge-base ${commit1} ${commit2}`, {
      encoding: 'utf-8',
    }).trim()
  } catch {
    return null
  }
}

/**
 * Check if commit1 is an ancestor of commit2
 * Returns true if commit1 comes before commit2 in the git history
 */
export function isAncestor(commit1: string, commit2: string): boolean {
  try {
    execSync(`git merge-base --is-ancestor ${commit1} ${commit2}`, {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Get files that differ between two commits
 */
export function getFileDiff(
  fromCommit: string,
  toCommit: string = 'HEAD',
  options: {
    filter?: string // e.g., 'A' for added, 'M' for modified
    nameOnly?: boolean
  } = {}
): string[] {
  try {
    const args = ['git', 'diff', '--name-only']

    if (options.filter) {
      args.push(`--diff-filter=${options.filter}`)
    }

    args.push(`${fromCommit}..${toCommit}`)

    const result = execSync(args.join(' '), { encoding: 'utf-8' })
    return result.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Get files added after a specific commit
 */
export function getFilesAddedAfter(commitSha: string): string[] {
  return getFileDiff(commitSha, 'HEAD', { filter: 'A' })
}

/**
 * Get files modified after a specific commit
 */
export function getFilesModifiedAfter(commitSha: string): string[] {
  return getFileDiff(commitSha, 'HEAD', { filter: 'M' })
}

/**
 * Get all files changed in the current branch since it diverged from another branch
 */
export function getBranchChanges(baseBranch: string = 'origin/main'): string[] {
  const mergeBase = getMergeBase(baseBranch, 'HEAD')
  if (!mergeBase) return []

  return getFileDiff(mergeBase, 'HEAD')
}

/**
 * Check if current branch diverged before a specific commit
 */
export function branchDivergedBefore(
  migrationCommit: string,
  baseBranch: string = 'origin/main'
): boolean {
  const mergeBase = getMergeBase(baseBranch, 'HEAD')
  if (!mergeBase) return false

  // Check if merge-base is an ancestor of migration commit
  // If true, branch diverged before the migration
  return isAncestor(mergeBase, migrationCommit)
}

/**
 * Get commit SHA
 */
export function getCommitSha(ref: string = 'HEAD'): string | null {
  try {
    return execSync(`git rev-parse ${ref}`, { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

/**
 * Get commit date
 */
export function getCommitDate(commitSha: string): Date | null {
  try {
    const timestamp = execSync(`git show -s --format=%ct ${commitSha}`, {
      encoding: 'utf-8',
    }).trim()
    return new Date(parseInt(timestamp) * 1000)
  } catch {
    return null
  }
}
