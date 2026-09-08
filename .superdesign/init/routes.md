# Routes

## Current route map

| Path | Entry | Layout | Summary |
| --- | --- | --- | --- |
| `/` | `App.tsx` | Inline safe-area wrapper | Counter, iOS Live Activity, voice and notification controls |

There is no navigation library or router configuration in the current source.
The native URL handler recognizes `fegcontextflow://voice` in `App.tsx` and
starts voice capture when a Live Activity is active.

## Planned routes

The approved target hierarchy is documented in
`docs/sprint-1/information-architecture.md`. It is product specification, not
current rendered source, and is intentionally not presented as implemented.
