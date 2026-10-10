# button

2026-10-10; golden pair via shadcn CLI; migrated to the Base UI Button primitive.

## Changed

- `src/components/ui/button.tsx`: replaced Radix Slot/asChild with `@base-ui/react/button` and Base UI `render` props; retained the existing variants and classes.
- `src/app/_index/accounts.tsx:108`, `src/app/not-found.tsx:12`, `src/app/page.tsx:34`: render links through Button and set `nativeButton={false}` for anchor targets.
- Leftover scan (`radix-ui|@radix-ui`) on changed component and consumers: clean.

## Left alone

- `src/components/ui/alert-dialog.tsx` was migrated separately and uses the new Button API internally.
- Non-Radix components such as `chart` and `sonner` were not changed.

## Behavior changes

None observed. Link destinations and button variants are preserved.

## Verify by hand

- Open `/` and activate the Tools button.
- Open `/not-found` and activate Home.
- Check each account icon link opens its external destination in a new tab.
