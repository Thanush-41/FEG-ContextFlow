# Routes

## Current route map

| Path | Entry | Summary |
| --- | --- | --- |
| `sport` | `apps/mobile/App.tsx` | Offer, event detail, odds and voice session |
| `live` | `apps/mobile/App.tsx` | Live score and markets |
| `tickets` | `apps/mobile/App.tsx` | Empty or draft demo ticket state |
| `casino` | `apps/mobile/App.tsx` | Dense dummy-game catalogue |
| `menu` | `apps/mobile/App.tsx` | Account, content, help and settings hierarchy |

The native URL handler recognizes `fegcontextflow://voice`, restores the saved
word count, expands the voice panel and starts capture when a Live Activity is
active. The first bottom-tab and event-detail hierarchy is implemented with
local state; URL-backed navigation can be added without changing the screens.
