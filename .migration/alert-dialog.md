# alert-dialog

2026-10-10; golden pair via shadcn CLI; migrated to Base UI AlertDialog parts.

## Changed

- `src/components/ui/alert-dialog.tsx`: replaced Overlay/Content with Backdrop/Popup, Cancel with Close, and Action with a regular styled Button; preserved wrapper exports and layout classes.
- The Radix reference scan on the wrapper is clean.

## Left alone

- `src/hooks/useConfirm.tsx` keeps the existing controlled open state and handlers; they close the dialog after either action.
- `sonner` and other non-Radix wrappers were intentionally untouched.

## Behavior changes

Base UI focuses the first tabbable element by default, while Radix AlertDialog focused Cancel. This was not overridden; verify the initial focus is acceptable.

## Verify by hand

- Trigger the oversized-limit confirmation on `/tools/mod`.
- Confirm Tab starts at the expected action and Escape does not dismiss the alert.
- Test Cancel and Continue; each should resolve the promise and close the dialog.
