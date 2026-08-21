<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dattix — Agent Contract

## Project Purpose

Local-first hierarchical data-entry application for manual Facebook post, comment, and reply collection. Output is a normalized Excel workbook (.xlsx) for academic research.

## Commands

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint

## Architecture Boundaries

| Layer | Responsibility | Must NOT do |
|---|---|---|
| `src/components/` | UI rendering, form state | Write files, access filesystem |
| `src/lib/schemas.ts` | Zod validation, types | Contain business logic or file I/O |
| `src/lib/ids.ts` | ID generation/validation | Depend on UI state |
| `src/lib/domain.ts` | Business rules, normalization | Render UI or access files directly |
| `src/lib/workbook/` | Excel read/write, backups | Render UI components |
| `src/app/api/` | Bridge UI ↔ domain/persistence | Implement inline ExcelJS logic |

## Critical Safety Rules

1. **No client-side filesystem access.** All file I/O happens in server-side API routes only.
2. **Atomic workbook writes.** Always write to a temp file, verify, backup the original, then replace.
3. **Never silently discard data.** If a save fails, the form must retain its state and show the error.
4. **No schema drift.** Do not add fields unless explicitly instructed. The CODEBOOK sheet is the source of truth.
5. **Preserve original text.** Never clean, trim, or transform user-entered text during storage.

## Testing Requirements

- Business logic (IDs, validation, mapping) must have unit tests.
- Workbook operations must have integration tests.
- UI changes should be smoke-tested visually.

## Naming Conventions

- IDs: `FB_000001` (posts), `C_000001` (comments), `R_000001` (replies), `S_000001` (sources)
- Files: camelCase for TypeScript files, PascalCase for React components
- Branches: `phase-N/description`

## Before Editing

Always inspect the existing code, schemas, and this file before making changes. Every task must leave the repository in a runnable state.
