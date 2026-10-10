# label

2026-10-10; golden pair via shadcn CLI; replaced Radix Label with native label.

## Changed

- `src/components/ui/label.tsx`: removed the Radix primitive and retained the existing label styling on a native `<label>`.
- Leftover scan (`radix-ui|@radix-ui`) on the wrapper: clean.

## Left alone

- `src/components/ui/field.tsx` continues to compose the public Label wrapper.
- Third-party/non-Radix UI wrappers remain unchanged.

## Behavior changes

Base UI has no Label primitive; the native label is always semantic. No current consumer relied on Radix-only behavior.

## Verify by hand

- Open `/tools/mod` and activate each field label.
- Confirm clicking a label focuses its associated input.
- Check disabled field label styling.
