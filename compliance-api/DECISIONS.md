# Decisions — Use Cases Considered, Not Built

Records use cases from the `Jonathan_Vision_Ideation.docx` §7 catalog that
were evaluated and deliberately not built, so the reasoning doesn't get
re-litigated later.

## Prompt library restructuring / redundant-question detection — dropped

Not deferred — dropped outright. Evan's reasoning: every citizen's question
to Claude is slightly different, so a fixed-prompt match against a library
entry would misfire often and would read as invasive when it did — flagging
"you asked something like this before" on a genuinely different question
erodes trust in the whole convergence-detection effort for little payoff.
Redundant-question detection (catalog use case, titles-depth) is dropped for
the same reason: it's the same mechanism applied to one citizen's own
history instead of across citizens.

## Course content gap detection — stays ad hoc, no standing build

Real value (surfaces where the course under-covered something, from patterns
across citizens' confused/basic questions), but Evan isn't concerned enough
about it to want a cron or a daily/weekly job for it. Run it periodically —
before a course revision cycle, or ahead of a large influx of new citizens —
as a one-off pull, not a standing pipeline. No code needed until one of those
moments actually arrives.
