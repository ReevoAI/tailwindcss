# Development Setup

Complete guide to setting up the local development environment for building and publishing `tailwindcss-enhanced-upgrade`.

---

## Prerequisites

### 1. Install Rust Toolchain

The monorepo requires Rust for building `@tailwindcss/oxide` (the high-performance Rust engine).

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Windows:**
Download and run: https://rustup.rs/

**Verify installation:**
```bash
rustc --version
cargo --version
```

### 2. Install Node.js

**Required**: Node.js 18 or higher

**Using nvm (recommended):**
```bash
nvm install 18
nvm use 18
```

**Or download**: https://nodejs.org/

### 3. Install pnpm

**Required version**: 9.6.0 (specified in `package.json`)

```bash
npm install -g pnpm@9.6.0
```

**Verify:**
```bash
pnpm --version
# Should output: 9.6.0
```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
cd /Users/reevo/Documents/codes/tailwindcss-fork

# Install all dependencies (including Rust builds)
pnpm install
```

This will:
- Install all npm packages
- Build `@tailwindcss/oxide` (Rust compilation)
- Link workspace dependencies

**Note**: First install takes 5-10 minutes due to Rust compilation.

### 2. Build All Packages

```bash
# Build entire monorepo
pnpm run build
```

This builds:
- `@tailwindcss/oxide` (Rust → Node.js bindings)
- `@tailwindcss/node` (Node.js utilities)
- `tailwindcss` (main package)
- `tailwindcss-enhanced-upgrade` (our package)

---

## Development Workflow

### Building the Upgrade Package

**Development build (watch mode):**
```bash
cd packages/@tailwindcss-upgrade
pnpm run dev
```

**Production build:**
```bash
cd packages/@tailwindcss-upgrade
pnpm run build
```

**Output**: `dist/index.mjs` (ESM bundle)

### Type Checking

```bash
cd packages/@tailwindcss-upgrade
pnpm run lint
```

This runs `tsc --noEmit` to check types without emitting files.

### Testing Locally

**Link the package globally:**
```bash
cd packages/@tailwindcss-upgrade
pnpm link --global
```

**Use it in any project:**
```bash
cd ~/my-project
tailwindcss-enhanced-upgrade check
```

**Or use npx directly:**
```bash
# From the monorepo root
npx ./packages/@tailwindcss-upgrade init --commit abc123
```

---

## Common Issues

### Issue: Rust compilation fails

**Symptoms:**
```
error: failed to compile @tailwindcss/oxide
```

**Fix:**
```bash
# Ensure Rust is installed
rustc --version

# Update Rust toolchain
rustup update

# Clean and rebuild
cd packages/@tailwindcss-oxide
cargo clean
cd ../..
pnpm install
```

### Issue: Cannot find module '@tailwindcss/node'

**Symptoms:**
```
Cannot find module '@tailwindcss/node'
```

**Fix:**
```bash
# Build dependencies first
pnpm run build
```

### Issue: TypeScript errors about imports

**Symptoms:**
```
Module '"picocolors"' has no default export
```

**Fix:**
Already fixed in this repo! We added `esModuleInterop: true` to `packages/tsconfig.base.json`.

If you still see errors, run:
```bash
cd packages/@tailwindcss-upgrade
rm -rf node_modules dist
pnpm install
pnpm run build
```

---

## Running Full Test Suite

### Unit Tests

```bash
# From monorepo root
pnpm test
```

This runs:
- Rust tests (`cargo test`)
- JavaScript tests (`vitest`)

### Integration Tests

```bash
pnpm run test:integrations
```

### Lint Everything

```bash
# From monorepo root
pnpm run lint
```

This checks:
- Prettier formatting
- TypeScript compilation (all packages)

---

## Publishing Workflow

### 1. Version Bump

```bash
cd packages/@tailwindcss-upgrade

# Update version in package.json
# Example: 1.0.0 → 1.0.1
```

### 2. Build for Production

```bash
pnpm run build
```

### 3. Verify Package Contents

```bash
# Check what will be published
npm pack --dry-run

# Verify dist/ folder
ls -la dist/
# Should contain: index.mjs, index.d.ts
```

### 4. Publish to npm

**Test publish (verify only):**
```bash
npm publish --dry-run
```

**Actual publish:**
```bash
npm publish
```

**With provenance (recommended):**
```bash
npm publish --provenance
```

### 5. Tag Release

```bash
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

---

## Package Structure

```
packages/@tailwindcss-upgrade/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── migrate-core.ts       # Core migration logic
│   ├── git-aware/            # Git-based detection
│   │   ├── commands/         # CLI commands
│   │   ├── config.ts         # Config management
│   │   ├── detection.ts      # Git detection logic
│   │   └── git.ts            # Git utilities
│   ├── codemods/             # Code transformations
│   │   ├── template/         # Template migrations
│   │   └── css/              # CSS migrations
│   └── utils/                # Shared utilities
├── dist/                     # Build output (generated)
│   └── index.mjs             # ESM bundle
├── package.json              # Package metadata
├── tsconfig.json             # TypeScript config
├── tsup.config.ts            # Build config
└── README.md                 # User documentation
```

---

## Build Configuration

**File**: `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,          // Generate .d.ts files
  clean: true,        // Clean dist/ before build
  shims: true,        // Add Node.js shims
  banner: {
    js: '#!/usr/bin/env node',  // Make executable
  },
})
```

---

## Troubleshooting

### Clear Everything and Start Fresh

```bash
# From monorepo root
pnpm run clean  # If available, or:

# Manual cleanup
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/dist
pnpm install
pnpm run build
```

### Check Workspace Linking

```bash
# Verify workspace dependencies are linked
pnpm list --depth 0
```

Should show:
```
@tailwindcss/node workspace:*
@tailwindcss/oxide workspace:*
tailwindcss workspace:*
```

---

## CI/CD Notes

The GitHub Actions workflow (`.github/workflows/tailwind-migration-check.yml`) automatically:
- Installs pnpm
- Runs `pnpm install`
- Executes `check` command

**No Rust required in CI** for the check command (only for full build).

---

## Questions?

- **Monorepo structure**: See root `package.json` for all scripts
- **TypeScript issues**: Check `packages/tsconfig.base.json`
- **Build issues**: Ensure all workspace deps are built first
- **Git-aware code**: See `src/git-aware/` directory

Happy coding! 🚀
