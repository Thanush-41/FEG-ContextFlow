# Page Dependency Trees

## `/` — Counter prototype

Entry: `apps/mobile/App.tsx`

Dependencies:

- `apps/mobile/App.tsx`
  - `react` (external)
  - `react-native` (external)
  - `react-native-safe-area-context` (external)
  - `NativeModules.CounterLiveActivityModule` (runtime native bridge)

The single page renders a centered counter, decrement/increment/reset controls,
and iOS-only Live Activity, voice input, transcript and notification controls.
All JSX, state, handlers, the page-local `CounterButton`, and styles are in the
entry file. It has no local TypeScript imports.
