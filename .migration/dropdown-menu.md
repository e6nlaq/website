# dropdown-menu

2026-10-10; golden pair via shadcn CLI; migrated Radix DropdownMenu to Base UI Menu.

## Changed

- `src/components/ui/dropdown-menu.tsx`: replaced Radix DropdownMenu parts with Base UI Menu parts and Portal > Positioner > Popup; mapped GroupLabel, SubmenuRoot, and indicators; retained Lucide icons and wrapper names.
- `src/components/mode-toggle.tsx:25`: changed Trigger composition from `asChild` to `render`.
- Leftover scan (`radix-ui|@radix-ui`) on changed files: clean.

## Left alone

- `src/components/ui/chart.tsx` (Recharts) and `src/components/ui/sonner.tsx` (Sonner) are not Radix wrappers.

## Behavior changes

Base UI CheckboxItem and RadioItem default `closeOnClick` behavior differs from Radix. No current consumer uses these parts; callers that add them should explicitly choose the desired close behavior. Regular theme menu items still close on click.

## Verify by hand

- Open the theme menu and select Light, Dark, and System.
- Check keyboard navigation, focus return, and popup placement near viewport edges.
- If adding checkbox/radio items, verify whether selection should close the menu.
