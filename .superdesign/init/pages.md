# Page Dependency Trees

## `/` — Sports offer shell

Entry: `apps/mobile/App.tsx`

- React Native and safe-area primitives
- recording-matched header, filters, promotional module and event cards
- interactive odds selection and sticky bet-slip summary
- expandable voice session panel
- `NativeModules.CounterLiveActivityModule` for persisted word count, speech,
  notifications, Home Screen widget and Dynamic Island/Live Activity updates

Bottom-tab state renders Sport, Live, Tickets, Casino and Menu views; selecting
an event opens its detail markets, while choosing odds opens the sticky slip.
The screen loads sports data and submits demo bets through
`packages/api-client`; the corresponding endpoints are implemented in
`apps/api`, with offline fixtures retained for resilient demos.
