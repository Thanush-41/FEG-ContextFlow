# Voice-Agent Product Contract

The agent is a first-class navigation and task interface over the same product
capabilities available through touch. It may not invent data, use hidden
privileges, or bypass a domain rule.

## Initial intents

- Search events, teams, competitions and content.
- Summarize live/upcoming events, results and market availability.
- Explain odds, markets, demo stake and possible return.
- Add/remove selections and set a demo stake in the draft slip.
- Read a user's demo tickets, balance and preferences after authentication.
- Navigate to a canonical app route.
- Start, stop, cancel or resume a voice session from supported native surfaces.

## Confirmation policy

No confirmation: search, explanation, navigation, filtering and reading public
data. Local confirmation: changing a reversible draft slip. Explicit server
confirmation: placing a demo ticket, wallet mutations, security/account changes,
publishing community content, or deleting data.

Every consequential preview states the action, affected selections/account,
demo amount, current odds/version, expiry, and a clear cancel path. Confirmation
tokens are short-lived, single-use, bound to the authenticated user and exact
payload, and invalidated by material data changes.

## Native surface contract

- Widget: next relevant event or active voice-session summary and push-to-talk.
- Notification: useful status update with allow-listed actions.
- Live Activity/Dynamic Island: listening/thinking/speaking/error state, short
  answer, slip count, and start/stop/open controls.
- Full app: transcript, disambiguation, action preview, detailed results and
  permission recovery.

The microphone is visibly indicated whenever active. Recording stops on user
request, permission loss, timeout, route policy, or unrecoverable interruption.
Audio is ephemeral by default; transcript storage is off unless the user opts in.
