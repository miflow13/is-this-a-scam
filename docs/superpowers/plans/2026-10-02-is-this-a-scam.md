# Is This a Scam? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a small local screenshot checker with cautious explanations for a loved one.

**Architecture:** A single Next.js page submits an image to a same-origin route. The route validates the upload, calls local Ollama with a strict response schema, validates the result, and supplies reviewed action guidance. No persistence or external model service.

**Tech Stack:** Next.js App Router, React, TypeScript, plain CSS, Node.js built-in test runner with TypeScript support, and Playwright for browser verification. Verify current supported versions and Node requirements from official documentation before installation.

**Spec:** ../specs/2026-10-02-is-this-a-scam-design.md

## Global Constraints

- Local Ollama at http://localhost:11434 with gemma3:4b for direct image input.
- No authentication, database, history, agents, external model service, or separate OCR.
- Accept one PNG, JPEG, or WebP screenshot up to 8 MiB.
- Exactly four response fields: verdict, summary, redFlags, recommendedAction.
- Verdict enum: likely_scam, uncertain, no_obvious_red_flags.
- “Uncertainty is a safety feature.” No output establishes legitimacy or says a message is safe.
- No stored uploads, analytics, external fonts, clickable suspicious links, or confidence percentages.
- Run locally on loopback; no deployment, merge, or challenge submission.

## Review Focus

- Screenshot replacement during analysis must not attach an old result to a new image; Task 2 checks replacement and clearing.
- A small compressed file with enormous dimensions must not trigger unbounded image work; Task 1 checks decoding and pixel limits.
- A model response that embeds instructions or reassurance must not control the trusted next step; Task 1 checks action replacement and conservative prompt text.
- A timed-out provider must not produce a legitimate-looking verdict; Task 1 checks provider timeout errors.
- A keyboard-only user must be able to select, analyze, and clear an image; Task 2 checks keyboard interaction.

## Task 1: Validated local analysis endpoint

**Files:** package.json, package-lock.json, tsconfig.json, next-env.d.ts, next.config.ts, .gitignore, src/lib/analysis.ts, src/lib/upload.ts, src/app/api/analyze/route.ts, tests/analysis.test.ts, tests/upload.test.ts, tests/route.test.ts.

**Interfaces:**
- `Analysis`: `{ verdict: 'likely_scam' | 'uncertain' | 'no_obvious_red_flags'; summary: string; redFlags: string[]; recommendedAction: string }`.
- `parseAnalysis(value: unknown): Analysis` rejects invalid model output and replaces recommendedAction.
- `validateImage(bytes: Buffer, declaredType: string): Promise<void>` rejects invalid uploads.
- `analyzeImage(bytes: Buffer, fetchImpl: typeof fetch = fetch): Promise<Analysis>` calls Ollama.
- `POST(request: Request): Promise<Response>` accepts multipart form field `image`; returns Analysis on success or `{ error: string }` with an appropriate non-2xx status.

- [x] Set up a minimal Next.js TypeScript project and scripts for development on 127.0.0.1, production build, type checking, and focused tests. Use sharp for actual image decoding and dimensions rather than trusting MIME headers alone.
- [x] Write failing tests: `rejectsUnknownVerdict` asserts “safe” is rejected; `rejectsExtraFields` asserts extra properties fail; `replacesGeneratedAction` asserts returned action is reviewed text; `rejectsInvalidShape` covers missing, empty, and oversized fields. Bound summary/action to 1,200 characters, redFlags to 8 entries of 300 characters each.
- [x] Run the focused tests and confirm failure due to missing implementation.
- [x] Implement parseAnalysis and the JSON schema in analysis.ts. Prompt explicitly rejects screenshot instructions and defaults to uncertainty for inadequate evidence. Use /api/chat with stream:false, the schema as format, temperature:0, and a 120-second timeout; bound provider response reading to 64 KiB.
- [x] Write and run failing upload/route tests covering empty files, files over 8 MiB, signature/type mismatch, corrupt image data, decoded images over 20 megapixels, cross-origin requests, oversized multipart bodies, malformed provider JSON, non-2xx provider status, and timeout. Assert errors never include a verdict or raw provider details.
- [x] Implement bounded request-body reading (8 MiB plus 64 KiB multipart allowance), exact one-file extraction, same-origin checks, image validation, no-store responses, and user-readable error mapping. Keep the Ollama target fixed server-side.
- [x] Run all focused tests and type checking; expect successful exits. Inspect and commit with `feat: add validated local screenshot analysis`.

## Task 2: Accessible single-page experience

**Files:** src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, tests/browser.spec.ts, playwright.config.ts.

**Interfaces:** Consumes the Task 1 POST endpoint and Analysis type. Produces the full selection → preview → analysis → result → clear/retry flow.

- [x] Build the root layout with local system fonts and page metadata. Build a responsive page with a calm warm palette, large readable text, native image input, drop area, preview, explicit analysis button, loading status, and result sections.
- [x] Map verdicts to the exact approved display labels. Always show the legitimacy disclaimer; emphasize it for no_obvious_red_flags. Render all model content as plain React text. Show “No specific red flags were identified” for an empty list without implying legitimacy.
- [x] Use request cancellation plus a request identity guard to prevent stale results. Revoke image object URLs on replacement/unmount. Disable duplicate analysis and clear stale results when selection changes. Surface errors in a live region with retry available.
- [x] Add browser tests using controlled responses: select a valid fixture, analyze, assert each verdict and section; reject an unsupported file; simulate network error and retry; replace/clear during a delayed response and assert no stale result; complete selection and analysis with keyboard navigation. Verify drag-and-drop through an actual File payload.
- [x] Run browser tests and review desktop/mobile screenshots for legibility, visible focus, overflow, loading, and error appearance. Commit with `feat: add approachable screenshot checker page`.

## Task 3: Representative fixtures, live verification, and README

**Files:** tests/fixtures/delivery-fee.png, tests/fixtures/ordinary-notification.png, tests/fixtures/ambiguous-message.png, scripts/check-local-model.ts, README.md, .env.example only if necessary, LICENSE.

**Interfaces:** Fixtures are synthetic images with no personal data; the live verification script consumes the same endpoint used by the page.

- [x] Create legible synthetic screenshot fixtures with a delivery-fee phishing request, ordinary appointment notification, and incomplete urgent message. Add adversarial screenshot text to an additional fixture if needed to exercise prompt boundaries.
- [x] Check local Node, Ollama availability, and installed models. If gemma3:4b is available, send at least two fixtures through the running endpoint and record observed verdicts, reading quality, and limitations. If it is unavailable, preserve an executable live-check script and explicitly record that live inference is unverified; do not substitute mock evidence for model accuracy.
- [x] Write README setup instructions with supported Node version, official Ollama installation link, `ollama pull gemma3:4b`, dependency installation, and local run commands. Explain first-run latency, errors, no persistence versus temporary memory, local-only deployment assumptions, hallucination/prompt-injection limits, screenshot reading limitations, and the uncertainty principle.
- [x] Run tests, type checking, production build, and final diff review. Check final repository status; commit with `docs: document local setup and MVP verification`.
- [x] Report exact automated/browser/live-model evidence and remaining manual checks. Push only if a GitHub destination has been established; otherwise report the local repository and commit without claiming a remote exists.

## Execution recommendation

Implement directly in this session using executing-plans. The three tasks share one small response contract. Perform a fresh whole-branch review after implementation, with any independent reviewer delegated only through the chosen skill workflow. Do not expand the MVP during review.
