# Design Review

## Foundation draft

- Target: `sports/home`
- Draft: `05763945-1fbe-4e71-b80f-aa13476386f4`
- Canvas: <https://superdesign.dev/teams/adcbf1a2-c167-4852-a818-09bb2d8a8d9d/projects/2269be2a-7fd0-41cd-a203-2ff5589a9bbc>
- Preview: <https://p.superdesign.dev/draft/05763945-1fbe-4e71-b80f-aa13476386f4>
- Status: Version 2 awaiting product-owner review

Version 2 is based on representative frames extracted from the supplied 3:34
mobile recording. It matches the compact royal-blue header, charcoal time rail,
promo carousel, category shortcuts, dense event/odds card, league rail and fixed
Live/Sport/Tickets/Casino/Menu navigation. Voice is reduced to a header action so
it does not disturb the reference hierarchy. It is a design artifact only; the
working React Native counter remains unchanged until this direction is approved.

## Approved screen flow

| Target | Preview |
| --- | --- |
| Sports offer | <https://p.superdesign.dev/draft/05763945-1fbe-4e71-b80f-aa13476386f4> |
| Menu / drawer | <https://p.superdesign.dev/draft/98dbe0c4-fb8b-4385-859f-f6608a21787c> |
| Event detail | <https://p.superdesign.dev/draft/59317cad-7d8c-4b7f-90f7-ebf08f655c06> |
| Demo bet slip | <https://p.superdesign.dev/draft/2b32604d-e34e-43dd-8680-eecb8a17c84a> |
| Ticket detail | <https://p.superdesign.dev/draft/94f9c8f9-e533-42b4-8895-455fa58af00b> |
| Live hub | <https://p.superdesign.dev/draft/f31bc79a-13bd-4572-b3b4-a0c312129599> |
| Casino lobby | <https://p.superdesign.dev/draft/c5a2d507-b8df-4edb-83c2-5c27989034ed> |
| Profile and wallet | <https://p.superdesign.dev/draft/6660833f-9970-4299-a5f7-fd149a1b0924> |
| Voice assistant | <https://p.superdesign.dev/draft/4b159a87-47e8-4ec6-ba3c-0b93964d2ab6> |

The live `psk.hr` URL currently returns a geographic-block interstitial from the
build environment, so the supplied recording remains the authoritative mobile
reference. Generated screens were checked to contain ContextFlow/FEG identity
and no PSK or captured provider name.

## Review checklist

- Original, trademark-safe ContextFlow identity.
- Dense event information remains legible on iPhone 16 dimensions.
- Demo balance and demo-slip language cannot be mistaken for real money.
- Voice is a primary navigation surface and does not obscure event odds.
- Selection, live, changed-price and active-agent states are distinguishable
  without relying on color alone.
- Bottom controls respect native safe areas and minimum touch targets.
- Direction can extend coherently to drawer, event, bet slip, ticket detail,
  live hub, casino lobby, profile, widget and Live Activity.
