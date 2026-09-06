# UI Guidelines

These guidelines apply to the React UI in `ui/`.

## Component System

- Use shadcn/ui for shared UI primitives and follow its established composition patterns.
- Create a custom reusable wrapper for every shadcn component used by the application.
- Keep wrappers in `ui/src/components/ui/` and give them application-facing names and APIs.
- Import wrappers from feature code; do not import shadcn components directly outside the wrapper layer.
- Keep product-specific defaults, variants, accessibility behavior, and styling in the wrapper so they remain consistent.
- Extend a wrapper before adding one-off styles or duplicated component behavior.
- Preserve shadcn accessibility semantics and keyboard behavior when customizing a component.

## Implementation Rules

- Prefer composition and small focused components over large page-level components.
- Use existing project utilities and design tokens before introducing new patterns.
- Keep wrapper APIs minimal, typed, and compatible with the underlying shadcn component when practical.
- Add or update focused tests when a wrapper contains non-trivial behavior.
- When a required shadcn component is not installed, add it through the normal shadcn workflow before implementing a replacement.