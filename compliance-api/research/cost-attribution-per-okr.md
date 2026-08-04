# Cost Attribution Per OKR — Research, No Build Yet

## The problem

Catalog use case (Jonathan_Vision_Ideation.docx §7c): attribute Claude spend
per chat to the company objective (OKR) it served, closing a real gap in the
existing ROI tracker. Depth needed: titles + `project_id`, no full content.

Evan's flagged concern: there are many moving initiatives, and attributing an
arbitrary chat to a specific OKR requires knowing how that chat's work
actually ties back to the objective — something an outside observer (or a
model with only a title and a project_id) may not reliably infer. Getting
this wrong produces a confidently-wrong number, which is worse for a
board-facing ROI tracker than no number at all.

## Candidate approaches

**(a) Only chats tied to a Claude Project whose `project_id` maps to a
GitHub-repo OKR.** Cheapest, most defensible — the OKR tag is structured data
from `METADATA.yaml`, not an inference. Weakness: coverage is low. Most
day-to-day Claude use (a quick question, a one-off doc) never happens inside
a named Project, so this only attributes the formalized slice of work, the
same "narrow, filtered slice" limitation the ideation doc flagged for GitHub
as a signal source generally (§4b).

**(b) Semantic classification of chat titles against each citizen's declared
OKR list**, with an explicit confidence score, not a hard attribution. A
model reads a citizen's title and their known OKRs (from GitHub METADATA.yaml
across their repos) and guesses which OKR it most likely serves, or "unclear."
Wider coverage than (a), but introduces real attribution error — the model is
guessing at intent it doesn't have full context on, exactly the risk Evan
named.

**(c) Don't build until better instrumentation exists** — e.g. if citizens
start tagging Claude Projects with an OKR field directly, cost attribution
becomes structured data again instead of an inference. No cost, no coverage.

## Recommendation

Prototype (b) small, but ship it labeled as a heuristic with a confidence
score, never as a hard number — and spot-check a sample (10-15 chats) against
what Evan actually knows about those citizens' work before trusting it for
anything board-facing. If the spot-check error rate is high, fall back to (a)
for the ROI tracker's real numbers and treat (b) as directional only. Don't
build (a) or (b) until the convergence detection and 1:1 signal work (which
this depends on for the underlying chat pull) are validated first — this is
lower priority than either.
