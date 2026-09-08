# Extractable Components

The prototype has no reusable layout components to extract. Its only helper,
`CounterButton`, is a page-local circular control specific to the counter demo.
It should not become part of the sportsbook design system.

After the approved application shell and `packages/ui` primitives are
implemented, regenerate this catalogue so the header, bottom navigation, odds
card, market group, slip summary and voice-session bar can become reusable
Superdesign components.
