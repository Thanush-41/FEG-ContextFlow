# Shared Layouts

The current bare React Native prototype has no shared application shell, header,
drawer, tab navigator, sidebar, or footer. `apps/mobile/App.tsx` directly renders its only
screen inside `SafeAreaProvider` and `SafeAreaView`; it is therefore treated as
a page entry in `pages.md`, not a reusable layout.

The new sportsbook/voice shell is a Sprint 3 implementation target and must be
designed before it is added to source.
