# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Outline is a collaborative knowledge base built with TypeScript. It's a monorepo with a React frontend, Koa backend, and shared code. Uses PostgreSQL, Redis, Sequelize ORM, MobX state management, and Prosemirror for the editor.

## Common Commands

```bash
# Development
make up                      # Docker containers + SSL + full dev environment
yarn dev:watch               # Backend (nodemon) + frontend (Vite) concurrently
yarn dev:backend             # Backend only with auto-reload
yarn vite:dev                # Frontend only with HMR

# Building
yarn build                   # Full production build (clean → vite → i18n → server)
yarn build:server            # Backend only (Babel)

# Testing
yarn test path/to/file.test.ts          # Run a specific test (preferred)
yarn test path/to/file.test.ts --watch  # Watch mode
yarn test:server             # All backend tests
yarn test:app                # All frontend tests
yarn test:shared             # All shared tests

# Test DB setup (if needed)
NODE_ENV=test yarn sequelize db:drop && NODE_ENV=test yarn sequelize db:create && NODE_ENV=test yarn sequelize db:migrate

# Code Quality
yarn lint                    # Oxlint
yarn format                  # Prettier
yarn tsc                     # Type check

# Database
yarn db:migrate              # Run migrations
yarn db:create-migration --name my-migration  # Create migration
yarn db:rollback             # Undo last migration
```

## Architecture

Refer to `docs/ARCHITECTURE.md` for detailed directory structure.

**Monorepo layout:** `app/` (React frontend), `server/` (Koa backend), `shared/` (shared code), `plugins/` (plugin system).

**Backend services** (configured via `SERVICES` env var): web, websockets, collaboration (Y.js/Hocuspocus), worker (Bull queues), cron, admin.

**Key patterns:**
- **Commands** (`server/commands/`): Complex business logic spanning multiple models. Keep API routes thin; use commands for multi-model operations.
- **Policies** (`server/policies/`): Cancan-style authorization. Always verify permissions before data access.
- **Presenters** (`server/presenters/`): Format database models into JSON API responses.
- **Stores** (`app/stores/`): MobX stores hold collections of models + fetch logic. Business logic belongs in stores, not components.
- **Plugins** (`plugins/`): Each has `plugin.json` manifest, optional `server/`, `client/`, `shared/` dirs.

**TypeScript path aliases:** `@server/*` → `server/*`, `@shared/*` → `shared/*`, `~/*` → `app/*`.

## Code Guidelines

See `AGENTS.md` for full guidelines. Key points:

- **Do not create new markdown (.md) files.**
- **Do not replace smart quotes** ("") or ('') with simple quotes.
- **Do not add translation strings manually** — they are extracted automatically.
- **Never use `any`**; avoid `unknown` unless absolutely necessary. Prefer type inference over assertions.
- Always use curly braces for `if` statements.
- Avoid `#` for private properties.
- Prefer `interface` over `type` for object shapes.
- Exported members at top of file; use named exports for components/classes.
- Event handlers prefixed with "handle" (e.g., `handleClick`).
- Do not import React unless used directly.
- Tests are collocated as `.test.ts` files next to source. Do not create new test directories.
- Use `yarn` for all dependency management.
- JSDoc on all public/exported functions (description, `@param`, `@return`, `@throws`).
