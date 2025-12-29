# tailwindcss-enhanced-upgrade

Git-aware Tailwind CSS migration tool that solves the "post-migration code" problem by using git history to detect and migrate code added after your v4 migration.

---

## The Problem

After migrating to Tailwind CSS v4, the official `@tailwindcss/upgrade` tool becomes useless because **it won't run migrations when v4 is already installed**.

### The Core Issue

```typescript
// Inside @tailwindcss/upgrade (original version)
if (version.isMajor(3)) {
  // Run config linking
  // Run JS config migration
  // Run stylesheet splitting
  // Run PostCSS migration
}
// If v4 is installed, ALL OF THIS IS SKIPPED! ❌
```

**After v4 is installed:**
- ✅ Tool checks: Is Tailwind v3 installed?
- ❌ Answer: No, v4 is installed
- ❌ Result: Skips all CSS/config migrations
- ⚠️ Template migrations run, but CSS migrations are critical too

### Two Critical Scenarios

**Scenario 1: New Code After v4 Migration**
- New code with v3-style classes (`shadow-sm`) gets added to main
- These classes are valid in BOTH v3 and v4 but have different meanings
- Running `@tailwindcss/upgrade` does nothing (v4 is installed)

**Scenario 2: Old Feature Branches Merging**
- Branch created before v4 migration contains v3 code
- Branch merges without rebasing  
- Main now has v3 code mixed with v4 code
- Running `@tailwindcss/upgrade` does nothing (v4 is installed)

---

## Our Solution

This fork removes the version checks entirely and adds git-based detection.

### What We Changed

**Removed 11 Version Checks:**
- ✅ 4 checks in main migration logic (config linking, JS config, stylesheet splitting, PostCSS)
- ✅ 5 checks in template codemods
- ✅ 2 checks in CSS codemods

**Added Git-Based Detection:**
```typescript
// Track the "v4 migration commit" as baseline
migrationCommit: "abc123def"

// Detect files added/modified AFTER this commit
git diff --diff-filter=A abc123..HEAD  
git diff --diff-filter=M abc123..HEAD

// Detect branches that diverged BEFORE this commit
git merge-base origin/main HEAD
```

**Result:**
- Migrations always run (no version checks!)
- Git history determines what needs migration
- No pattern matching needed

---

## Installation

```bash
npm install -g tailwindcss-enhanced-upgrade
# or
npx tailwindcss-enhanced-upgrade <command>
```

---

## Usage

### 1. Initialize (One-Time Setup)

After your v4 migration PR is merged:

```bash
# Find your v4 migration commit
git log --oneline --grep="v4"

# Initialize with that commit SHA
npx tailwindcss-enhanced-upgrade init --commit abc123d

# Commit the config
git add .tailwindcss-enhanced-upgrade.json
git commit -m "chore: add migration tracker config"
```

### 2. Check for Unmigrated Code

```bash
npx tailwindcss-enhanced-upgrade check
# or with JSON output:
npx tailwindcss-enhanced-upgrade check --json
```

### 3. Migrate Detected Files

```bash
npx tailwindcss-enhanced-upgrade migrate
# or dry run:
npx tailwindcss-enhanced-upgrade migrate --dry-run
```

### 4. Validate Feature Branches

```bash
git checkout feature/old-branch
npx tailwindcss-enhanced-upgrade validate-branch
```

### 5. GitHub Actions Integration

Automatically check for unmigrated code on every PR:

**Step 1: Copy the workflow file**

The workflow is already included in this repository at:
```
.github/workflows/tailwind-migration-check.yml
```

**Step 2: Initialize configuration**

Make sure your repository has the `.tailwindcss-enhanced-upgrade.json` config committed:
```bash
npx tailwindcss-enhanced-upgrade init --commit <your-v4-migration-sha>
git add .tailwindcss-enhanced-upgrade.json
git commit -m "chore: add Tailwind migration config"
git push
```

**Step 3: How it works**

The action will:
- ✅ Run on every PR and push to main/master
- ✅ Check for unmigrated files using git history
- ✅ Fail the build if unmigrated code is detected
- ✅ Upload detailed results as artifacts
- ✅ Provide clear error messages with fix instructions

**Example PR check failure:**
```
❌ Unmigrated Tailwind CSS code detected!

{
  "needsMigration": true,
  "newFiles": ["src/components/Button.tsx"],
  "modifiedFiles": ["src/styles/main.css"],
  "branchFiles": []
}

Run the following command to fix:
  npx tailwindcss-enhanced-upgrade migrate
```

**Customizing the workflow:**

Edit `.github/workflows/tailwind-migration-check.yml` to:
- Change trigger branches
- Add to specific workflows
- Customize error messages
- Skip checks on certain paths

---

## Commands

```bash
# Initialize
init --commit <sha>         Initialize tracking with migration commit

# Check
check [--json]              Check for files needing migration

# Migrate  
migrate [--dry-run]         Migrate detected files
migrate [--verbose]         Verbose output
migrate [--force]           Skip git dirty check

# Validate
validate-branch [--json]    Validate current branch

# Legacy
[files...]                  Direct migration (backward compatible)
```

---

## Configuration

Created by `init` command (`.tailwindcss-enhanced-upgrade.json`):

```json
{
  "version": "1.0.0",
  "migrationCommit": "abc123d",
  "migrationDate": "2024-12-29T10:30:00Z",
  "strategy": "git-aware",
  "includePatterns": [
    "src/**/*.{tsx,jsx,vue,svelte,astro,html}",
    "src/**/*.css"
  ],
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**"
  ]
}
```

---

## How It Works

```
1. Load config → Get migration commit SHA
2. Git detection → Find files added/modified after migration
3. Run migrations → NO version checks, everything runs!
4. Report results → Show what was migrated
```

**Key Difference:**
- **Original**: Checks version, skips migrations if v4 detected
- **Enhanced**: Removed ALL version checks, migrations always run

---

## FAQ

**Q: Why fork instead of wrapping?**  
A: Version checks are embedded throughout the code. Forking gives us full control.

**Q: What's the actual difference?**  
A: We removed 11 version checks. That's it. Everything else is identical.

**Q: Works with monorepos?**  
A: Yes, run `init` in each package that uses Tailwind.

**Q: Maintained?**  
A: Yes, we track upstream and incorporate updates.

---

## Repository

**Fork:** https://github.com/ReevoAI/tailwindcss  
**Package:** `/packages/@tailwindcss-upgrade/`  
**Original:** https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-upgrade

---

## License

MIT (same as Tailwind CSS)
