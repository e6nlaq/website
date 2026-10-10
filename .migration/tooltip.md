# tooltip

2026-10-10; golden pair via shadcn CLI; migrated to Base UI Tooltip.

## Changed

- `src/components/ui/tooltip.tsx`: migrated Content to Portal > Positioner > Popup and changed provider timing to Base UI's `delay` prop.
- `src/app/layout.tsx:82`: preserved the configured 100 ms delay as `delay={100}`.
- `src/app/_index/accounts.tsx`, `src/app/layout.tsx`, `src/app/tools/ajl-simulator/page.tsx`, and `src/app/tools/mod/page.tsx`: converted TooltipTrigger `asChild` usage to `render`.
- Leftover scan (`radix-ui|@radix-ui`) on changed files: clean.

## Left alone

- The current app does not use Radix-only `disableHoverableContent`; no behavior shim was added.
- Sonner and other non-Radix components were not changed.

## Behavior changes

The app-level 100 ms open delay is preserved. Base UI uses transition starting/ending styles for popup presence rather than Radix state-driven keyframe mounting.

## Verify by hand

- Hover and focus the account, build-year, simulator, and clipboard tooltips.
- Confirm the 100 ms delay feels unchanged and each tooltip dismisses on pointer/focus exit.
- Check tooltip placement near viewport edges.
