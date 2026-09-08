# Core User Flows

## Browse to demo bet

`Sports offer → event → market selection → bet slip → sign in if needed → review changed odds → explicit Place demo bet confirmation → ticket detail`

States: skeleton loading, no events, suspended selection, stale price, invalid
stake, insufficient demo balance, expired session, idempotent retry, success.

## Live demo bet

`Live hub → event → live market → selection → slip → price/suspension check → confirmation → live ticket`

The server is authoritative. Suspended markets remain visible but disabled, and
the client explains the reason instead of silently removing a selection.

## Ticket lookup and copy

`My Bets or lookup code → ticket detail → copy selections → unavailable items identified → valid items enter new slip → user reviews`

Copy never submits automatically and never hides missing or repriced selections.

## Demo wallet

`Wallet → choose deposit/withdraw → enter demo amount → validation → explicit confirmation → ledger entry → balance update`

No payment instrument is collected. Repeated submission with the same
idempotency key returns the original result.

## Dummy game launch

`Explore → catalogue → game details → demo-only disclosure → launch deterministic simulation → result → optional replay`

## Voice-assisted flow

`Push-to-talk → permission/session check → speech-to-text → intent + entities → read-only tool or action preview → concise response → confirmation when required → domain API → synchronized UI/native surfaces`

Recovery states include no speech, ambiguous team/event, unavailable market,
network loss, tool timeout, expired auth, changed odds, cancelled confirmation,
and unsupported request. The agent asks a focused follow-up rather than guessing.
