# navigation-menu

2026-10-10; golden pair via shadcn CLI; migrated to Base UI NavigationMenu.

## Changed

- `src/components/ui/navigation-menu.tsx`: migrated the viewport to Portal > Positioner > Popup > Viewport and Indicator to Icon; retained wrapper exports and trigger/link styles.
- `src/components/nav.tsx:36`: changed the Home and Tools links from `asChild` to `render`.
- Leftover scan (`radix-ui|@radix-ui`) on changed files: clean.

## Left alone

- `src/components/ui/chart.tsx` and `src/components/ui/sonner.tsx` use non-Radix libraries and were not touched.

## Behavior changes

Base UI's default navigation hover delay is 50 ms versus Radix's 200 ms. The current nav uses links only, so this primarily affects future trigger/content menus.

## Verify by hand

- At desktop width, activate Home and Tools and confirm the routes.
- Check the nav remains hidden at the existing small-screen breakpoint.
- If adding menu content, check hover timing and keyboard navigation.
