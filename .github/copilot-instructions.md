# UI Guidelines

These guidelines apply to the React UI in `ui/`.

## Component System

- Use the project's shared UI primitives and follow their established composition patterns.
- Create custom reusable wrappers for shared components when application-specific behavior or styling is needed.
- Keep wrappers in `ui/src/components/ui/` and give them application-facing names and APIs.
- Import wrappers from feature code; keep shared component implementation details inside the wrapper layer.
- Keep product-specific defaults, variants, accessibility behavior, and styling in the wrapper so they remain consistent.
- Extend a wrapper before adding one-off styles or duplicated component behavior.
- Preserve accessibility semantics and keyboard behavior when customizing a component.

## Implementation Rules

- No bullshit text. FOCUS.
- Prefer composition and small focused components over large page-level components.
- Use existing project utilities and design tokens before introducing new patterns.
- Keep wrapper APIs minimal, typed, and compatible with the underlying component when practical.
- Add or update focused tests when a wrapper contains non-trivial behavior.
- When a required shared component is missing, add it through the project's normal component workflow before implementing a replacement.

## Responsive Design

- Design and implement every view mobile first, starting with a usable narrow-screen layout before adding larger-screen enhancements.
- Use progressive breakpoints for wider layouts and verify that content, controls, and navigation remain accessible without horizontal scrolling at each size.