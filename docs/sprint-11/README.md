# Sprint 11 — Native demo casino

## Goal

Replace the casino placeholder with three complete, native, playable simulations
while preserving the product's no-cash-value boundary.

## Games

- **Sky Crash** — deterministic flight multiplier result.
- **Lucky Dice** — deterministic two-dice roll with sum/doubles result.
- **Triple Pulse** — deterministic three-reel result with pair/triple detection.

Every game follows `casino lobby → game shell → demo disclosure → play → result →
replay`. No WebView, stake, payout, wallet debit or provider integration is used.
