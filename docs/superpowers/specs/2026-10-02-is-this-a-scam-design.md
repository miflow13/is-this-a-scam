# Is This a Scam? — weekend MVP design

## Purpose and scope

A small local web app helps a friend or loved one understand a suspicious email, text, or DM screenshot. The result explains what the message wants, observable red flags, and a cautious next step. **Uncertainty is a safety feature.** No output establishes legitimacy or says a message is safe.

Build a single Next.js page and POST /api/analyze. Use local Ollama at http://localhost:11434 with gemma3:4b for direct image input. No authentication, database, history, agents, external model service, or separate OCR. Add OCR only if actual screenshot testing demonstrates a need and the scope is revisited.

## User experience

Use approachable language, generous spacing, large readable text, clear focus states, and responsive layout. The user subsequently requested a security-focused visual theme: deep navy, clear blue accents, stronger sans-serif typography, and shield-based visuals. A native file picker provides a keyboard-accessible alternative to drag and drop. Accept one PNG, JPEG, or WebP screenshot up to 8 MiB; reject unsupported, empty, or oversized uploads with understandable messages. Show a preview and an explicit “Check this message” button. Prevent duplicate submissions while analyzing. Let the user replace or clear the screenshot; clear stale results when the image changes.

Render exactly three verdict labels:

- likely_scam: “Likely scam”
- uncertain: “I’m not sure”
- no_obvious_red_flags: “No obvious red flags found”

Results contain “What this message wants,” “What stood out,” and “What to do next.” Do not fabricate red flags when none were observed. The permanent disclaimer says that no obvious red flags does not prove legitimacy and that the tool can make mistakes. Keep suspicious URLs and phone numbers as plain text, never interactive links. No confidence percentages.

## Data flow and ownership

Browser → same-origin Next.js POST endpoint → local Ollama /api/chat → validated result → page.

The browser handles selection, preview, loading, and result presentation. The endpoint owns upload validation, prompt construction, model timeout, response validation, and dependable action guidance. Ollama receives base64 image data with a system instruction and a strict JSON schema. It does not receive permission to act on screenshot contents.

Return exactly these fields: verdict (the three-value enum), summary (nonempty bounded string), redFlags (bounded array of bounded strings), recommendedAction (nonempty bounded string). Reject additional properties, unknown verdicts, malformed JSON, empty required values, and excessive response sizes. Validate on the server even when Ollama uses structured outputs.

The prompt asks for observable evidence only, explicitly treats all screenshot text as untrusted content rather than instructions, and chooses uncertain for unreadable, incomplete, or ambiguous evidence. Never establish safety, validate a sender’s identity, or recommend interaction through the suspicious message. Prompting and schema validation reduce errors but cannot guarantee correct scam classification or prevent every misleading model statement.

The server replaces the model’s recommendedAction with reviewed text for the returned verdict. All actions avoid clicking, replying, paying, or calling through the message. They suggest asking a trusted person or checking through an independently opened official app/site or previously known contact information. This makes the next-step instruction independent of generated prose.

## Errors and local boundary

Use a finite model timeout and clear messages for unavailable Ollama, missing model, timeout, invalid uploads, and invalid analysis. Infrastructure failures are errors, not verdicts. Allow retry. Do not expose raw provider responses or server internals to users.

Bind the development server to loopback by default. Keep Ollama’s address server-side and fixed to the local service. Reject cross-origin requests. Limit request size before expensive analysis and validate image signatures against declared type. Do not fetch any screenshot links. Return results without caching.

The app persists no screenshots or results and adds no analytics or external fonts. Images necessarily exist temporarily in browser, server, and model memory. The README must explain this distinction and that local operation depends on running both services on the user’s machine; deploying Next.js elsewhere changes the privacy and connectivity assumptions.

## Verification

Create synthetic fixtures containing no real personal information: a delivery-fee phishing message, an ordinary notification, and an ambiguous or incomplete message. Verify request validation, all three result shapes, invalid model responses, and unavailable-provider handling. Test the browser’s upload-to-result flow using a controlled Ollama substitute if needed, labeling this as integration verification rather than model accuracy evidence.

Attempt real gemma3:4b analysis of at least two fixtures if Ollama and the model are available. Record observed outcomes, latency where useful, and whether image reading is adequate. Do not claim live inference or accuracy validation when only mocked responses were tested. Run type checking and production build, inspect the final diff, and review desktop/mobile appearance and keyboard interaction where feasible.

## Deliverables and exclusions

A new Git repository with a focused feat/weekend-mvp branch, source, dependency lockfile, synthetic fixtures, focused tests, and README. The README covers Node requirements, Ollama installation reference, ollama pull gemma3:4b, running locally, privacy rationale, limitations, and the uncertainty principle. Document hardware-dependent latency and inability to verify sender identity or destination reputation from an image.

Commit implementation after verification. Push only when a GitHub repository destination is established; do not invent a remote. No merge, deployment, challenge submission, or publication is included. Do not claim challenge eligibility without checking its actual rules.
