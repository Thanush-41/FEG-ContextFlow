# Shared UI Components

The first recording-matched React Native shell is implemented in
`apps/mobile/App.tsx`. It defines page-local header, native-app prompt, period
tabs, quick links, event/odds cards, voice session panel, bet-slip bar and
bottom navigation. Shared visual tokens live in `packages/ui`.

These boundaries will move into `apps/mobile/src/components` as route support
expands, without changing their compact mobile geometry.
