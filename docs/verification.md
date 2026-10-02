# Verification record — October 2, 2026

Environment: Node 24.21.0, Next.js 16.3.8, Ollama 0.34.4, Linux, installed Google Chrome through Playwright.

## Automated checks

- Focused endpoint/model/upload tests: 13 passed. Includes enum/shape bounds, action replacement, explicit reassurance fallback, origin checks, bounded multipart reading, image decoding, pixel limits, and connection/timeout/invalid-response failures.
- Browser workflow: 16 passed across desktop (1440 × 1100) and mobile (390 × 844) viewports. Covers all verdict displays, file selection, actual file drop, keyboard chooser and analysis, retry, stale-result prevention, and no horizontal overflow. Responses are controlled: this proves interaction behavior, not model accuracy.
- Type checking: passed.
- Production build: passed. The same 16 browser checks also passed against the production server.
- Desktop and mobile page previews reviewed. Browser inspection found no uncaught page errors or Next.js error overlay.

## Real Ollama inference

Pending the gemma3:4b download. Do not interpret the controlled browser responses as live inference evidence. The `npm run check:local-model` script exercises four synthetic screenshots through the actual HTTP endpoint when the model is ready.

## Remaining coverage boundaries

No broad real-world accuracy evaluation, hardware benchmark, non-English evaluation, Firefox/Safari testing, assistive-technology user study, or independent security assessment. The lexical reassurance safeguard is conservative and incomplete: it cannot guarantee all model prose is accurate or free of misleading reassurance. Public hosting and multi-user operation are outside this MVP.
