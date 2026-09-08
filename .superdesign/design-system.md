# FEG ContextFlow Mobile Design System

## Product and brand

FEG ContextFlow is an original, trademark-safe, voice-first demo sports
experience for iOS and Android. It combines a dense sportsbook with an assistant
that can find events, explain markets, prepare a demo slip, and continue a short
session through native system surfaces. It must never imply real-money betting.

Voice is a primary tab and persistent state, not a floating novelty button.
Touch and voice must expose equivalent information and safe recovery paths.

## Visual direction

Use a confident native sports-data aesthetic: information-dense but calm,
high-contrast, fast to scan, and free of copied sportsbook branding. The base is
deep navy with cool elevated surfaces; electric lime marks available odds and
confirmed positive states; sky blue marks navigation and voice focus; amber and
red are reserved for warnings, live state and destructive actions.

## Tokens

### Color

- `ink.950 #07111F` — dark canvas and status bars
- `ink.900 #0C1828` — primary background
- `ink.800 #132238` — cards and navigation
- `ink.700 #1C304A` — elevated/pressed surfaces
- `slate.300 #A9B8CB` — secondary text
- `white #F8FBFF` — primary text
- `lime.400 #B7F34A` — odds, success and primary action
- `lime.950 #172608` — text on lime
- `sky.400 #44B9FF` — links, voice focus and selected navigation
- `violet.400 #9B8CFF` — agent reasoning/processing accent
- `amber.400 #FFBE3F` — changed odds and attention
- `red.400 #FF5C66` — live/error/destructive state
- `stroke rgba(255,255,255,0.10)` — dark separators

Light theme uses `#F3F7FC` canvas, white cards, `#10213A` primary text,
`#56677D` secondary text and `#D8E1EC` separators while preserving semantic
accents and WCAG contrast.

### Type

Use the native system sans family (SF Pro on iOS, Roboto on Android) to preserve
platform fidelity and avoid font loading. Scale: 11 metadata, 13 secondary, 15
body, 17 emphasized body, 22 section title, 28 screen title, 36 key score/value.
Use tabular figures for scores, odds, stakes, balances and clocks.

### Spacing and shape

Four-point spacing grid: 4, 8, 12, 16, 20, 24, 32. Screen gutter is 16 on
compact phones and 20 on large phones. Radii: 8 compact controls, 12 odds/card,
16 panels, and full pill for status/actions. Touch targets are at least 44 by 44.
Use borders and tonal elevation before shadows; shadows are subtle and reserved
for the active slip or modal layer.

## Core components

- Top app bar with product mark/name, search, notifications and demo balance.
- Five-item native bottom tab bar with Voice centered and visually persistent.
- Sport/league chips, live badge, event row, score cell, odds button states.
- Collapsible market group, empty/suspended/loading/error variants.
- Bet-slip tray, selection row, stake field, totals and confirmation sheet.
- Voice session bar and full voice screen with listening waveform, concise
  transcript, tool-result cards, disambiguation choices and action preview.
- Toast/banner, skeleton, empty state, offline/reconnecting banner and sheet.

Odds button states are available, selected, pressed, price-up, price-down,
suspended and unavailable. Do not communicate movement or status by color alone.

## Layout and behavior

Prioritize the offer and live data above promotional material. Keep score,
participant and primary odds aligned across rows. Use progressive disclosure for
secondary markets. Bet slip remains reachable without covering navigation.

Small phones use one-column lists and full-screen sheets. Large phones may show
event detail with a persistent slip rail only when both panes retain readable
width. Landscape layouts must respect notches and Dynamic Island safe areas.

Motion is functional: 120–180 ms state transitions, 220–280 ms sheet movement,
reduced-motion alternatives, no endless decorative animation. Voice listening
has a clear live indicator; thinking uses bounded progress and speaking can be
interrupted immediately.

## Native surfaces

Widget, notification, Live Activity and Dynamic Island use platform typography,
spacing and controls. They share semantic colors and product identity but do not
miniaturize full app screens. Show only current session state, a short answer,
the next event or slip count, plus push-to-talk/stop/open actions.

## Accessibility and content

Support dynamic type without truncating teams, odds or confirmation meaning.
Every icon has a label; score and odds updates are announced selectively. Use
plain language such as “demo balance” and “demo bet.” Never present simulated
games, deposits, withdrawals, or returns as real money.
