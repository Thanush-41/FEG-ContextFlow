# Information Architecture

## Primary navigation

Bottom tabs remain reachable with one hand:

1. **Sports** — offer, live, sports, leagues, search and event details.
2. **My Bets** — open/settled tickets and ticket lookup.
3. **Voice** — full conversational session, transcript and pending action.
4. **Explore** — casino, lotto, virtuals, promotions, community and content.
5. **Profile** — authentication, wallet, preferences, help and responsible play.

The app header contains the ContextFlow identity, global search, demo balance,
notifications, and bet-slip count. The drawer provides the complete hierarchy
without duplicating context-specific actions.

## Route map

| Route | Access | Purpose |
| --- | --- | --- |
| `sports/home` | Guest | Featured and upcoming offer |
| `sports/live` | Guest | Live events and market state |
| `sports/:sportId` | Guest | Competition and event list |
| `event/:eventId` | Guest | Scoreboard and grouped markets |
| `search` | Guest | Events, leagues, teams and content |
| `betslip` | Guest draft; auth to place | Selections, stakes and demo confirmation |
| `bets` | Auth | Open and settled demo tickets |
| `ticket/:ticketId` | Owner or valid lookup | Ticket details and timeline |
| `voice` | Guest read; auth for private tools | Voice transcript, answer and action preview |
| `explore` | Guest | Product-category hub |
| `casino`, `lotto`, `virtuals` | Guest | Dummy catalogues and simulations |
| `promotions`, `community`, `news` | Guest | Discovery and first-party content |
| `wallet` | Auth | Demo balance and ledger |
| `profile`, `settings`, `sessions` | Auth | Account management |
| `help`, `responsible-play` | Guest | Support and safety information |

## Global actions and deep links

- `fegcontextflow://event/:id`
- `fegcontextflow://ticket/:id`
- `fegcontextflow://voice?action=start`
- `fegcontextflow://betslip`
- Universal/App Links will map to the same canonical routes later.
- Notifications and native surfaces may open only allow-listed routes.

## System-surface hierarchy

The widget is glanceable, the Live Activity is session-oriented, and the full
Voice tab owns conversation history and complex confirmations. System surfaces
show the current voice state, a short answer or pending selection count, and
push-to-talk/stop/open-app controls; they never attempt to render the entire app.
