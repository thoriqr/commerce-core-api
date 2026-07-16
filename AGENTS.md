# AGENTS.md

# Commerce API - AI Agent Guide

This document defines the development rules for AI coding assistants working on this repository.

Follow these instructions unless explicitly overridden by the developer.

---

# Project Overview

* Runtime: Node.js
* Language: TypeScript
* Framework: Express
* Database: PostgreSQL
* SQL: Raw SQL
* Migration: Knex
* Validation: Zod
* Architecture: Module-based (Feature-based)

This project is production-ready.

Preserve the existing architecture, coding style, and project conventions.

---

# Project Architecture

Features are organized by module.

Typical structure:

```text
src/
    modules/
        auth/
        cart/
        product/
        user/
```

Each module generally contains:

* controller
* service
* repository
* validation
* types
* routes

Keep the existing project structure.

Do not move, rename, or reorganize files unless explicitly requested.

---

# Coding Style

Follow the existing coding style throughout the project.

Requirements:

* Keep changes minimal.
* Preserve naming conventions.
* Preserve folder structure.
* Preserve API response format.
* Preserve existing error handling.
* Preserve repository → service → controller separation.
* Reuse existing utilities whenever possible.
* Follow the existing dependency injection pattern.

Do not introduce new architectural patterns unless explicitly requested.

---

# Database

Database: PostgreSQL

The project uses:

* Raw SQL for application queries.
* Knex for database connection, transactions, and migrations.

The AI may inspect package.json and project configuration files to determine the correct development commands.

Do not assume commands that do not exist in the project.

## Allowed

* Generate migration files using the project's existing Knex migration command.
* Follow the existing migration naming convention.
* Modify migration files created for the current task.

## Forbidden

Do not execute database migrations.

Do not run:

* migrate:latest
* migrate:rollback
* any production migration command
* any production database command

Migration execution is always performed manually by the developer.

---

# SQL

The project uses PostgreSQL with raw SQL.

Requirements:

* Preserve the existing raw SQL style.
* Keep SQL formatting consistent with the project.
* Prefer parameterized queries.
* Reuse existing SQL helpers when available.
* Extend existing queries instead of rewriting them whenever possible.

Do not:

* replace raw SQL with Knex Query Builder
* introduce Prisma
* introduce Drizzle ORM
* introduce TypeORM
* introduce any ORM unless explicitly requested

---

# Dependencies

* Prefer existing project dependencies.
* Do not introduce new packages unless explicitly requested.
* Avoid unnecessary dependencies when existing utilities already solve the problem.

---

# Refactoring

Only refactor the requested scope.

Do not:

* refactor unrelated modules
* rename files unless explicitly requested
* rename public APIs
* change API contracts
* change response structures
* perform formatting-only refactors

Preserve backward compatibility whenever possible.

---

# Production Safety

Never:

* execute production database commands
* modify production configuration
* edit deployment configuration
* edit CI/CD configuration
* edit production environment variables

Assume every production resource is sensitive.

---

# Authentication

Authentication is security-sensitive.

Before making authentication changes:

* Explain the implementation plan.
* Highlight any security implications.
* Wait for approval before performing large refactors affecting multiple modules.

Always preserve backward compatibility unless explicitly instructed otherwise.

---

# Scope of Work

Only modify files that are necessary for the requested task.

Avoid touching unrelated modules.

Avoid speculative improvements.

Avoid changing existing implementations unless required by the task.

Prefer extending existing code over rewriting working code.

---

# Communication

If requirements are unclear:

* Ask for clarification before making assumptions.

Never guess business rules.

Prefer preserving the existing implementation over introducing a different style.

---

# Before Completing

Before finishing a task:

* Summarize the implementation.
* List all modified files.
* Mention any manual steps required.
* Never execute deployment, migration, or production commands automatically.
