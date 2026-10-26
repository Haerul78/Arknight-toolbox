# Ideas

Things we decided not to build yet, with what we know so far.

## Drop rates on material pages

The game data only says how likely a drop is in five steps (`ALWAYS`, `ALMOST`, `USUAL`,
`OFTEN`, `SOMETIMES`); `/materials/:id` shows those as Always / High / Medium / Low / Rare.

Real percentages, and "sanity per item" to rank stages, would need the Penguin Statistics
API (an external service, crowd-sourced). The plan if we do it:
- fetch at build time in a script (not from the browser), save next to the other generated
  data and record the date and source in `meta.json`
- show the rate next to the game's own category, never instead of it, with the sample size
- rank "best stage" by expected sanity per item only where the sample is large enough

Decided 2026-10-26: not now.
