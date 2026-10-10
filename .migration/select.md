# select

2026-10-10; golden pair via shadcn CLI; migrated to Base UI Select.

## Changed

- `src/components/ui/select.tsx`: migrated content positioning to Portal > Positioner > Popup, Viewport to List, and group label/scroll arrow parts to Base UI equivalents; retained the wrapper names and Lucide indicators.
- `src/app/tools/mod/page.tsx:431`: supplied the Japanese option label explicitly because Base UI otherwise displays the raw selected value (`bunshi`/`sum`).
- Leftover scan (`radix-ui|@radix-ui`) on changed files: clean.

## Left alone

- Other form controls are not Radix wrappers and were not changed.
- `src/components/ui/chart.tsx` and `sonner.tsx` remain on their existing third-party libraries.

## Behavior changes

The differing value/label behavior is explicitly handled in the current consumer, preserving its Japanese display. Positioning defaults follow Base UI's item-aligned mode.

## Verify by hand

- Open the calculation-method selector on `/tools/mod`.
- Confirm the Japanese option label appears both in the popup and after selection.
- Check keyboard selection, Escape dismissal, and popup placement.
