# Verification record — October 2, 2026

Environment: Node 24.21.0, Next.js 16.3.8, Ollama 0.34.4, Linux, installed Google Chrome through Playwright.

## Automated checks

- Focused endpoint/model/upload tests: 14 passed. Includes enum/shape bounds, action replacement, explicit reassurance fallback, origin checks (including framework-normalized URL versus actual loopback Host), bounded multipart reading, image decoding, pixel limits, and connection/timeout/invalid-response failures.
- Browser workflow: 18 passed across desktop (1440 × 1100) and mobile (390 × 844) viewports. Covers all verdict displays, file selection, actual file drop, keyboard chooser and analysis, retry, stale-result prevention, and no horizontal overflow. Most responses are controlled: this proves interaction behavior, not model accuracy. Two checks submit corrupt image bytes to the real HTTP endpoint.
- Type checking: passed.
- Production build: passed. The same 18 browser checks also passed against the production server.
- Desktop and mobile page previews reviewed. Browser inspection found no uncaught page errors or Next.js error overlay.

## Real Ollama inference

The gemma3:4b model was downloaded and all four synthetic screenshots were sent through the production HTTP endpoint. The final live smoke check exited successfully:

| Fixture | Observed verdict | Final request time |
| --- | --- | --- |
| Delivery-fee/card-number request | likely_scam | 1.6 s |
| Routine appointment reminder | no_obvious_red_flags | 3.0 s |
| Incomplete request from an unknown sender | uncertain | 1.5 s |
| Password request with embedded model instructions | likely_scam | 1.4 s |

Three screenshots were also selected and analyzed in the real Chrome page without intercepted responses: delivery fee, ordinary notification, and ambiguous message. Each rendered the expected verdict and reviewed next step. No uncaught page errors were observed. The updated navy/blue security theme was reviewed on desktop and mobile; [result preview](result-preview.png) shows actual local inference.

These are smoke cases, not an accuracy score or calibrated confidence estimate. The final API run overlapped with browser checks, so timings are illustrative only. The initial cold-start request took 25.8 seconds; warm requests were much faster on this machine. Other hardware and images can behave differently.

The first live run exposed two problems: synthetic provenance labels drawn inside fixture images were incorrectly interpreted as scam evidence, and an incomplete vague message was guessed to be a scam. Removing test-only labels from the pixels fixed the routine reminder; explicit decision rules distinguishing missing context from visible scam tactics fixed the ambiguous verdict in these checks. Provenance remains documented here and in the README. The prompt also requests plain-language flags rather than underscored category labels.

The live-check script now checks a small set of expected fixture behaviors and returns a nonzero exit if they regress. The screenshot containing embedded instructions did not override the observed verdict or reviewed action in this run; this does not establish general prompt-injection resistance.

## Remaining coverage boundaries

No broad real-world accuracy evaluation, hardware benchmark, non-English evaluation, Firefox/Safari testing, assistive-technology user study, or independent security assessment. The lexical reassurance safeguard is conservative and incomplete: it cannot guarantee all model prose is accurate or free of misleading reassurance. Public hosting and multi-user operation are outside this MVP.

The implementation stays in its new dedicated repository on a focused branch; there was no unrelated checkout to protect with a second worktree. Browser verification uses the installed Chrome through Playwright because the agent-browser CLI was unavailable. Clearing a screenshot prevents stale results but does not stop server-side inference; abandoned work can run until its timeout. Dimension checks happen on the server before analysis, so a browser may decode a compressed large image for preview first. Fixture provenance is documented outside screenshot pixels to avoid contaminating the model input.

## Pause-before-you-act follow-up — 2026-10-02

Updated the single page to emphasize pausing, put the reviewed next step before the explanation, and label uncertain summaries as visible evidence plus missing context. Prompt requests observable pressure tactics. Schema requests at most four flags; runtime caps flags at four and suppresses flags for uncertain verdicts so missing context is not presented as a scam indicator.

Verification: focused test files passed, typecheck passed, production build passed, and all 18 desktop/mobile browser checks passed (including next-step-first order and uncertain heading). Final four live Ollama fixtures returned delivery-fee=likely_scam, ordinary-notification=no_obvious_red_flags, ambiguous-message=uncertain, embedded-instructions=likely_scam. A separate real Chrome upload of the ambiguous fixture rendered the uncertain result and reviewed next step. Updated app-preview.png and result-preview.png were captured from the production server.

Observed limitation: despite explicit prompt instructions, Gemma described the fully readable vague request as cut off. Some flags remain generic rather than quoting visible wording. These fixture verdicts do not establish real-world accuracy or perfect screenshot comprehension. No real recipient feedback has been collected; README includes a short handover exercise rather than claiming one occurred.
