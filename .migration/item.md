# item

2026-10-10; golden pair via shadcn CLI; replaced Radix Slot with Base UI useRender.

## Changed

- `src/components/ui/item.tsx`: migrated the polymorphic Item to `useRender`/`mergeProps` and the `render` prop while preserving variants and classes.
- `src/app/tools/page.tsx:65`: renders the existing internal or external link through Item; href, target, and rel behavior remain intact.
- Leftover scan (`radix-ui|@radix-ui`) on changed files: clean.

## Left alone

- `src/components/ui/separator.tsx` is a separate Base UI wrapper and remains ItemSeparator's dependency.
- Non-Radix wrappers were not changed.

## Behavior changes

None observed. Item remains a polymorphic container with the same link destinations.

## Verify by hand

- Open `/tools` and activate both internal and external tool items.
- Confirm external links still open safely in a new tab.
- Check focus-visible styling with keyboard navigation.
