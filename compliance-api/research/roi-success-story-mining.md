# ROI / Success Story Mining — Research, No Build Yet

## The problem

Catalog use case (Jonathan_Vision_Ideation.docx §7a): chats with generated
files/artifacts tied to real business value are candidate material for the
ROI tracker or board narrative. Depth needed: titles + generated files, not
full content by default.

Evan's flagged concern: this needs a cost-of-compute vs. value-of-insight
balance. Reading every citizen's chats looking for "success stories" is a
broad, low-precision search — most chats won't be one, and finding out
requires looking, which is exactly the invasive-relative-to-payoff pattern
Evan wants to avoid unless the use case earns it.

## Candidate approach

Gate on a cheap trigger before any expensive read: only consider chats that
(a) have at least one generated file or artifact attached, and (b) exceed a
minimum length/turn-count threshold (rules out trivial one-off asks). That
combination is available at the titles+metadata depth — no full-content read
needed to decide whether a chat is a candidate.

Only for chats that pass both filters, pull the generated file(s) and enough
surrounding context to judge business value, and produce a short candidate
blurb — not an automated "this is an ROI win," but raw material for Evan to
curate and verify before it goes anywhere near the board narrative or ROI
tracker. Matches the standing rule that AI output here is a draft, not the
final word, and it's especially true for anything client-facing or
board-facing.

## Why not build now

This is real value, but it's a nice-to-have relative to convergence
detection and the 1:1 signals, and the trigger-tuning (what file types count,
what length threshold) needs a first real pass over actual data to calibrate
sensibly rather than guessing thresholds up front. Revisit once the
convergence pipeline's cache (chat titles + metadata for all citizens) is
already being pulled daily — this use case rides on top of that same pull,
it doesn't need its own.
