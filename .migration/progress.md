# progress

2026-10-10; golden pair via shadcn CLI; migrated to Base UI Progress.

## Changed

- `src/components/ui/progress.tsx`: added Base UI Track structure and let the primitive compute Indicator fill instead of applying the Radix translateX style.
- Existing `Progress` wrapper API and consumer remain unchanged.
- Leftover scan (`radix-ui|@radix-ui`) on the wrapper: clean.

## Left alone

- The `chart` wrapper uses Recharts and is unrelated to Radix Progress.
- Other non-Radix UI wrappers were not changed.

## Behavior changes

None observed for the determinate percentage value used by the current consumer.

## Verify by hand

- Run a calculation on `/tools/mod` and confirm the progress fill advances and reaches completion.
- Check the bar remains full-width at narrow viewport widths.
