# project

2026-10-10; whole-project migration via shadcn golden pairs; all Radix-backed shadcn wrappers now use Base UI.

## Changed

- `components.json`: switched the shadcn style from `radix-maia` to `base-maia`.
- `package.json` and `bun.lock`: added `@base-ui/react`; removed `radix-ui` and the eight direct `@radix-ui/react-*` packages.
- Migrated 10 Radix-backed wrappers: `alert-dialog`, `button`, `dropdown-menu`, `item`, `label`, `navigation-menu`, `progress`, `select`, `separator`, and `tooltip`.
- Updated consumers: `src/app/_index/accounts.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/page.tsx`, `src/app/tools/ajl-simulator/page.tsx`, `src/app/tools/mod/page.tsx`, `src/app/tools/page.tsx`, `src/components/mode-toggle.tsx`, and `src/components/nav.tsx`.
- Select now supplies the Japanese selected-value label explicitly; linked Base UI Buttons set `nativeButton={false}`.
- Final `radix-ui|@radix-ui` and Radix CSS-variable scan in `src`, `package.json`, and `bun.lock`: clean. **0 wrappers remain on Radix.**
- Verification: `bun run typecheck`, `bun run build`, `bun run lint`, `bun test` (8 pass), and Oxfmt check all passed.

## Left alone

- `src/components/ui/chart.tsx` uses Recharts; `sonner.tsx` uses Sonner. These are not Radix components and were intentionally untouched.
- `card`, `field`, `input`, `input-group`, `spinner`, `textarea`, and other wrappers without Radix imports were not rewritten.
- `spinning-text.tsx` and `word-rotate.tsx` remain custom components, not Radix primitives.

## Behavior changes

- AlertDialog initial focus differs: Base UI focuses the first tabbable element instead of Radix's Cancel button.
- Base UI DropdownMenu CheckboxItem/RadioItem have different `closeOnClick` defaults. Current consumers use regular items only.
- Base UI NavigationMenu's default hover delay is 50 ms rather than Radix's 200 ms; current navigation contains links only.
- Base UI Separator is always semantic; the old wrapper defaulted `decorative` to true.
- Select's raw-value display difference is handled at the existing consumer, preserving Japanese labels.

## Verify by hand

- Visit `/`, `/tools`, `/tools/mod`, and `/tools/ajl-simulator`; exercise links and responsive navigation.
- On `/tools/mod`, use the method Select, tooltips, progress indicator, and the large-limit confirmation; check focus, Escape behavior, and both dialog actions.
- Open the theme dropdown; test pointer and keyboard selection plus focus return.
- Review separator semantics with assistive technology and confirm no visual regression on narrow screens.
