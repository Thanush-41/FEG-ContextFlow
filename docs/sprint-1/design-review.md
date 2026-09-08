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
