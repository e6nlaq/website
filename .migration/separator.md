# separator

2026-10-10; golden pair via shadcn CLI; migrated to Base UI Separator.

## Changed

- `src/components/ui/separator.tsx`: replaced Radix `Separator.Root` with Base UI's callable Separator and removed the unsupported `decorative` prop.
- Existing orientation and styling API remain available; leftover scan (`radix-ui|@radix-ui`) on the wrapper is clean.

## Left alone

- `src/components/ui/item.tsx` continues to use the Separator wrapper for ItemSeparator.
- Non-Radix components were not changed.

## Behavior changes

Base UI Separator is always semantic (`role="separator"`). The old wrapper defaulted to decorative; visual-only separators now expose separator semantics.

## Verify by hand

- Open `/tools` and inspect separators between repeated tool items.
- Check horizontal/vertical sizing where Separator is used.
- Confirm screen-reader semantics are acceptable for visual-only separators.
