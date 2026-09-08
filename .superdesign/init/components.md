# Shared UI Components

The current prototype has no shared component directory or exported reusable UI
primitives. `CounterButton` is a private helper inside `App.tsx`, so it is
catalogued as page-local rather than represented here as a shared component.

The Sprint 2 monorepo will introduce `packages/ui`; Superdesign context should
be regenerated after those primitives exist.
