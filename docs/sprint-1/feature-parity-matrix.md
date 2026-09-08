# Feature Parity Matrix

| Area | Guest | Signed in | Mobile surface | Voice-agent capability | Real-time |
| --- | --- | --- | --- | --- | --- |
| Sports offer | Browse sports, leagues, events, markets | Personalised ordering and favourites | Home, sport, league, search | Find and summarize events or odds | Odds and availability |
| Live betting | Browse live events and scores | Create a demo live slip | Live hub, event detail | Read live state and add a selection | Scores, clocks, odds |
| Event markets | View grouped markets | Favourite event, add selections | Event detail | Explain markets and compare selections | Market suspension |
| Bet slip | Build local draft | Save and place demo ticket | Collapsible slip and full screen | Add, remove, change stake, calculate return | Price-change warnings |
| My Bets | Ticket lookup by code | Open, settled, cashed-out demo tickets | My Bets, ticket detail | Find and summarize a ticket | Ticket settlement |
| Wallet | View demo explanation | Demo balance, deposit, withdraw, ledger | Wallet and transaction history | Read balance; prepare actions | Balance changes |
| Account | Register and sign in | Profile, sessions, preferences, limits | Auth, profile, settings | Navigate and change low-risk preferences | Session invalidation |
| Promotions | Browse eligible promotions | Opt in to demo offers | Promotions and details | Find and explain offers | Eligibility updates |
| Community | Browse public demo content | Follow, react, copy a shared demo ticket | Feed and shared ticket | Find a post; prepare copied slip | Feed updates |
| Casino | Browse dummy catalogue | Favourite and launch simulation | Casino lobby and game shell | Search games and explain demo-only status | Availability |
| Lotto | Browse draws and results | Build and save demo entry | Lotto lobby, draw detail | Find draw and prepare entry | Draw status |
| Virtual games | Browse schedule | Launch deterministic simulation | Virtual lobby and event | Find next event and explain result model | Simulated event state |
| Results and stats | Browse results | Save favourite competitions | Results, tables, statistics | Answer fixture/result questions | Result corrections |
| Content | Read news and guides | Personalised feed | News list and article | Find and summarize first-party content | New-item notifications |
| Help | Browse FAQs and responsible-play copy | Create a local demo support request | Help and support | Answer from approved help content | Support status |
| Settings | Device defaults | Theme, odds, locale, voice and notification preferences | Settings | Read/change reversible preferences | Cross-device preference sync |
| Native surfaces | Static preview | Personal context after opt-in | Widget, notification, Live Activity, Dynamic Island | Push-to-talk, session state, concise answer/action | Active-session state |
| Admin simulator | No access | Role-gated demo operators | Separate web/API client later | Not exposed to consumer agent | Seed, odds and settlement events |

## Cross-platform parity

Every core product journey must exist on iOS and Android. iOS uses WidgetKit,
ActivityKit, App Intents, and Dynamic Island. Android receives functionally
equivalent Glance/App Widget and foreground-notification controls where platform
capabilities differ; visual parity is not required when native conventions
differ.

## Product boundaries

- Demo balances, bets, games, deposits, and withdrawals only.
- No real-money processing, gambling provider integration, or copied trademarks.
- Deterministic seeded data makes demonstrations and automated tests repeatable.
- Voice actions never bypass authentication, validation, or confirmation rules.
