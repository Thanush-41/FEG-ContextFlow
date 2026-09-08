# FEG ContextFlow Mobile Design System

## Product and brand

FEG ContextFlow is an original, trademark-safe, voice-first demo sports
experience for iOS and Android. It combines a dense sportsbook with an assistant
that can find events, explain markets, prepare a demo slip, and continue a short
session through native system surfaces. It must never imply real-money betting.

Voice is a primary tab and persistent state, not a floating novelty button.
Touch and voice must expose equivalent information and safe recovery paths.

## Visual direction — recording-matched

The supplied “Mobile View & Native apps” recording is the visual ground truth.
Match its compact, dark, mobile sportsbook structure: a saturated royal-blue
brand bar; charcoal time filters; near-black canvas; edge-to-edge promotional
tiles; a compact icon category row; dense slate event cards; small rectangular
odds cells; horizontal league chips; and a fixed black five-item bottom bar.

Preserve the recording's tight vertical rhythm and small information scale. Do
not reinterpret it as a spacious modern card layout, introduce large rounded
panels, or add a persistent assistant panel over event content. Replace the PSK
name, logo and third-party artwork with original FEG ContextFlow/demo-safe
content while retaining position, proportion, density and interaction hierarchy.

## Tokens

### Color

- `brand.600 #1264C5` — recording-matched primary header blue
- `brand.500 #1976D2` — active underline, icon and focus blue
- `brand.800 #0A4789` — pressed header state
- `canvas #05090D` — page and rail background
- `surface.900 #111823` — bottom navigation and deepest cards
- `surface.800 #182131` — event and ticket cards
- `surface.700 #303642` — time filter and odds-strip backgrounds
- `surface.600 #5A5F68` — inactive/summary strips
- `text.primary #F4F6F9` — primary labels and values
- `text.secondary #A8AFBA` — metadata and secondary labels
- `line #252D39` — separators
- `success #20A20E` — demo submit button and success state
- `warning #F4CB18` — casino jackpot/value bars only
- `live #E22B33` — live/jackpot/error badge
- `voice #1976D2` — microphone focus within the existing header/action grammar

The demo follows the recording's dark theme. A light palette may be defined for
later accessibility work but must not appear in the reference-matched demo.

### Type

Use Roboto/system sans to match the Android recording and native system sans on
iOS. Scale: 9–10 bottom labels and metadata, 11 odds labels, 12 body, 13 card
emphasis, 15 section labels, and 18 brand/header. Avoid oversized page titles.
Use tabular figures for scores, odds, stakes, balances and clocks.

### Spacing and shape

Four-point spacing grid: 2, 4, 8, 12, 16. Major content is edge-to-edge with
8-pixel inner gutters. Time/category bars are 36–44 high. Event cards use 4–6
pixel radii; odds cells are compact rectangles, not pills. League chips use an
8-pixel radius. Bottom navigation is 52–58 high plus the safe area. Preserve a
44-point hit target through invisible padding even when the visible icon is small.
Use separators and tonal elevation; do not add floating shadows.

## Core components

- Thin royal-blue app bar with left-aligned FEG mark, search, notifications,
  compact demo balance/account action and an optional microphone action.
- Charcoal time filter immediately below: Live, Today, 1H, 3H, Tomorrow.
- Edge-to-edge horizontal promo tiles followed by a compact icon category row.
- Five-item recording-matched bottom bar: Live, Sport, Tickets, Casino, Menu.
- League chips, live badge, dense event card, score cell and compact odds states.
- Collapsible market group, empty/suspended/loading/error variants.
- Bet-slip tray, selection row, stake field, totals and confirmation sheet.
- Voice uses the header microphone, dedicated full screen, notification/widget,
  or Live Activity. It must not cover sportsbook content in the reference demo.
- Toast/banner, skeleton, empty state, offline/reconnecting banner and sheet.

Odds button states are available, selected, pressed, price-up, price-down,
suspended and unavailable. Do not communicate movement or status by color alone.

## Layout and behavior

Follow the recording order exactly: brand bar, time filters, promotions,
category shortcuts, event cards, horizontal league chips, then fixed bottom
navigation. Keep score, participant and odds aligned. The bet slip rises from
the bottom above navigation and uses compact gray stake presets with a full-width
green demo-submit bar, matching the reference hierarchy.

Small phones use the recording's narrow single-column layout and horizontally
scrolling rails. Larger phones increase side gutters but do not inflate card
height or typography. Landscape layouts respect notches and Dynamic Island safe
areas without changing the content order.

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
