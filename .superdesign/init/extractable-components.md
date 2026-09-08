# Extractable Components

- `Header`, `NativePrompt`, `PeriodTabs` and `BottomNavigation` form the shell.
- `EventCard` is the reusable event and three-way odds unit.
- `VoicePanel` preserves the word counter, Live Activity, notification and
  speech controls inside the sportsbook visual language.
- The sticky bet-slip bar is shared across offer and event routes.

They remain page-local until navigation lands, avoiding premature public APIs.
